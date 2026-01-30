const MatchState = require('../models/MatchState');
const Lab = require('../models/Lab');
const PC = require('../models/PC');
const Zone = require('../models/Zone');
const Team = require('../models/Team');
const User = require('../models/User');

const STEP_KEYS = ['a', 'b', 'c', 'd'];

// Timer state
let round2TimerInterval = null;
let round2TimeRemaining = 3600; // 60 minutes in seconds

function normalizeLabNumber(val) {
    const n = parseInt(val, 10);
    return (n >= 1 && n <= 8) ? n : null;
}

async function computeLabSolvedCount(labId) {
    return PC.countDocuments({ labId, status: 'solved' });
}

async function emitRound1Leaderboard(io) {
    const labs = await Lab.find().sort({ labNumber: 1 }).lean();
    const labIds = labs.map(l => l._id);
    const solvedCounts = await PC.aggregate([
        { $match: { labId: { $in: labIds } } },
        { $group: { _id: '$labId', solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } }, progressSum: { $sum: '$progress' } } }
    ]);
    const map = new Map(solvedCounts.map(x => [String(x._id), x]));
    const leaderboard = labs.map(l => {
        const agg = map.get(String(l._id)) || { solved: 0, progressSum: 0 };
        return {
            labNumber: l.labNumber,
            name: l.name,
            isCompleted: l.isCompleted,
            infectionLevel: l.infectionLevel,
            totalSolvedPCs: agg.solved,
            totalProgress: agg.progressSum // out of 40
        };
    }).sort((a, b) => (b.totalSolvedPCs - a.totalSolvedPCs) || (b.totalProgress - a.totalProgress));

    io.emit('r1:leaderboard', leaderboard);
}

async function emitPlayerLeaderboards(io) {
  try {
    const humanTeam = await Team.findOne({ faction: 'human' });
    const zombieTeam = await Team.findOne({ faction: 'zombie' });
    
    const humans = humanTeam ? await User.find({ teamId: humanTeam._id }).sort({ score: -1 }).limit(10).lean() : [];
    const zombies = zombieTeam ? await User.find({ teamId: zombieTeam._id }).sort({ score: -1 }).limit(10).lean() : [];
    
    io.to('war_room').emit('r2:player_leaderboards', {
      humans: humans.map((u, i) => ({ rank: i + 1, username: u.username, score: u.score })),
      zombies: zombies.map((u, i) => ({ rank: i + 1, username: u.username, score: u.score }))
    });
  } catch (e) {
    console.error('Error emitting player leaderboards:', e);
  }
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User Connected', socket.id);

    socket.on('r1:join_lab', ({ labNumber }) => {
      const n = normalizeLabNumber(labNumber);
      if (!n) return;
      socket.join(`lab:${n}`);
    });

    // Round 1: join admin room
    socket.on('admin:join', () => {
      socket.join('admin_room');
    });

    // --- ROUND 1 LAB BREACH ---
    
    // Fetch initial lab data
        socket.on('r1:get_lab_data', async ({ labId, labNumber }) => {
        try {
                        const n = normalizeLabNumber(labNumber ?? labId);
                        let lab;
                        if (n) lab = await Lab.findOne({ labNumber: n });
                        if (!lab && labId) lab = await Lab.findById(labId);
                        if (!lab) return;

                        const pcs = await PC.find({ labId: lab._id }).sort({ pcNumber: 1 }).populate('questions');
                        socket.emit('r1:lab_data', { lab, pcs });

                        await emitRound1Leaderboard(io);
        } catch (e) {
            console.error(e);
        }
    });

        socket.on('r1:get_leaderboard', async () => {
            try {
                await emitRound1Leaderboard(io);
            } catch (e) {
                console.error(e);
            }
        });

    // Submit answer R1
    socket.on('r1:submit_answer', async ({ pcId, questionId, isCorrect, stepIndex }) => {
        if (!isCorrect) return; // Only process correct answers for simple logic

        try {
            const pc = await PC.findById(pcId);
            if (!pc) return;

                        if (pc.status === 'locked') return;

                        // If stepIndex is provided, mark that step; otherwise just increment next available.
                        const idx = Number(stepIndex);
                        if (Number.isInteger(idx) && idx >= 0 && idx <= 3) {
                            pc.steps[STEP_KEYS[idx]] = true;
                        } else {
                            for (const key of STEP_KEYS) {
                                if (!pc.steps[key]) { pc.steps[key] = true; break; }
                            }
                        }

                        pc.progress = STEP_KEYS.reduce((acc, k) => acc + (pc.steps[k] ? 1 : 0), 0);
                        if (pc.progress === 4) {
                            pc.status = 'solved';
                        } else if (pc.status !== 'locked') {
                            pc.status = 'pending';
                        }

                        await pc.save();

                        const lab = await Lab.findById(pc.labId);
                        if (lab) {
                            lab.totalSolvedPCs = await computeLabSolvedCount(lab._id);
                            await lab.save();
                        }

                        const labRoom = lab ? `lab:${lab.labNumber}` : null;
                        if (labRoom) io.to(labRoom).emit('r1:pc_update', pc);
                        io.to('admin_room').emit('r1:pc_update', { labId: pc.labId, pc });

                        if (pc.status === 'solved') {
                            if (labRoom) io.to(labRoom).emit('r1:pc_solved', { pcId, alphabet: pc.assignedAlphabet });
                        }

                        await emitRound1Leaderboard(io);
        } catch (e) {
            console.error(e);
        }
    });

        // Admin: set a specific step A-D for a PC
        socket.on('r1:admin_set_pc_step', async ({ pcId, stepKey, solved }) => {
            try {
                const pc = await PC.findById(pcId);
                if (!pc) return;
                if (!STEP_KEYS.includes(stepKey)) return;

                if (pc.status === 'locked') return;

                pc.steps[stepKey] = !!solved;
                pc.progress = STEP_KEYS.reduce((acc, k) => acc + (pc.steps[k] ? 1 : 0), 0);
                pc.status = pc.progress === 4 ? 'solved' : 'pending';
                await pc.save();

                const lab = await Lab.findById(pc.labId);
                if (lab) {
                    lab.totalSolvedPCs = await computeLabSolvedCount(lab._id);
                    await lab.save();
                    io.to(`lab:${lab.labNumber}`).emit('r1:pc_update', pc);
                }
                io.to('admin_room').emit('r1:pc_update', { labId: pc.labId, pc });
                await emitRound1Leaderboard(io);
            } catch (e) {
                console.error(e);
            }
        });

        // Admin: lock/unlock PC
        socket.on('r1:admin_set_pc_lock', async ({ pcId, locked }) => {
            try {
                const pc = await PC.findById(pcId);
                if (!pc) return;
                if (pc.status === 'solved') return;

                pc.status = locked ? 'locked' : 'pending';
                await pc.save();

                const lab = await Lab.findById(pc.labId);
                if (lab) io.to(`lab:${lab.labNumber}`).emit('r1:pc_update', pc);
                io.to('admin_room').emit('r1:pc_update', { labId: pc.labId, pc });
                await emitRound1Leaderboard(io);
            } catch (e) {
                console.error(e);
            }
        });

    // Attempt Escape
    socket.on('r1:attempt_escape', async ({ labId, word }) => {
        try {
            const lab = await Lab.findById(labId);
            if (lab && lab.correctWord.toUpperCase() === word.toUpperCase()) {
                lab.isCompleted = true;
                lab.qualifyStatus = true; // Simplified logic
                await lab.save();
                io.to(labId).emit('r1:escaped', { success: true });
                io.emit('r1:admin_update', { labId, status: 'escaped' });
            } else {
                socket.emit('r1:escape_fail', { message: 'Incorrect Code' });
            }
        } catch (e) {
            console.error(e);
        }
    });


    // --- ROUND 2 DOMINATION ---

    // Join War Room (Player)
    socket.on('r2:join_war', async ({ userId }) => {
        console.log('Client joining war_room:', socket.id);
        socket.join('war_room');
        console.log('Client joined war_room successfully');
        
        // Send current active zone info
        const activeZone = await Zone.findOne({ isActive: true });
        socket.emit('r2:zone_update', activeZone);
        
        // Send all zones
        const allZones = await Zone.find().sort({ name: 1 });
        socket.emit('r2:all_zones', allZones);
        
        // Send player leaderboards
        await emitPlayerLeaderboards(io);
    });

    // Submit Answer R2 (Zone Points)
    socket.on('r2:submit_score', async ({ userId, team, points, zoneId }) => {
        try {
            const zone = await Zone.findById(zoneId);
            if (!zone || !zone.isActive) return;

            if (team === 'human') {
                zone.humanScore += points;
            } else {
                zone.zombieScore += points;
            }

            // Calculate domination
            if (zone.humanScore > zone.zombieScore) {
                zone.dominationStatus = 'human';
            } else if (zone.zombieScore > zone.humanScore) {
                zone.dominationStatus = 'zombie';
            } else {
                zone.dominationStatus = 'neutral';
            }

            await zone.save();
            io.to('war_room').emit('r2:zone_update', zone);
            
            // Update all zones
            const allZones = await Zone.find().sort({ name: 1 });
            io.to('war_room').emit('r2:all_zones', allZones);
            
            // Update individual player score
            const user = await User.findById(userId);
            if (user) {
              user.score += points;
              await user.save();
              await emitPlayerLeaderboards(io);
            }

        } catch (e) {
             console.error(e);
        }
    });

    // Request Sabotage
    socket.on('r2:request_sabotage', async ({ teamId }) => {
        // Validation logic here (check cooldown)
        // ...
        io.to('admin_room').emit('r2:admin_sabotage_request', { teamId });
    });

    // Admin Update Score (R2)
    socket.on('r2:admin_update_score', async (data) => {
        try {
            const { team, zone, difficulty, score, playerId, action } = data;
            console.log('Server received r2:admin_update_score:', {
                team,
                zone,
                difficulty,
                score,
                action,
                playerId
            });
            
            // Find the zone document
            const zoneDoc = await Zone.findOne({ name: zone });
            if (!zoneDoc) {
                console.log('Zone not found:', zone);
                return;
            }

            console.log('Current zone state:', {
                zone: zone,
                humanDifficulty: zoneDoc.humanDifficulty,
                zombieDifficulty: zoneDoc.zombieDifficulty,
                humanScore: zoneDoc.humanScore,
                zombieScore: zoneDoc.zombieScore
            });

            // Map difficulty to points
            const pointsMap = { E: 10, M: 20, H: 30 };
            const points = pointsMap[difficulty] || 0;

            // Update difficulty counts
            const difficultyField = team === 'human' ? 'humanDifficulty' : 'zombieDifficulty';
            zoneDoc[difficultyField][difficulty] = score;

            // Recalculate total scores from difficulty counts
            const humanTotal = (zoneDoc.humanDifficulty.E * 10) + (zoneDoc.humanDifficulty.M * 20) + (zoneDoc.humanDifficulty.H * 30);
            const zombieTotal = (zoneDoc.zombieDifficulty.E * 10) + (zoneDoc.zombieDifficulty.M * 20) + (zoneDoc.zombieDifficulty.H * 30);
            
            zoneDoc.humanScore = humanTotal;
            zoneDoc.zombieScore = zombieTotal;

            // Determine new domination status
            const previousStatus = zoneDoc.dominationStatus;
            let newStatus = 'neutral';
            if (zoneDoc.humanScore > zoneDoc.zombieScore) {
                newStatus = 'human';
            } else if (zoneDoc.zombieScore > zoneDoc.humanScore) {
                newStatus = 'zombie';
            }

            // Handle domination time tracking on status change
            if (previousStatus !== newStatus) {
                const now = new Date();
                
                // If previously dominating (not neutral), add accumulated time to that team's total
                if (previousStatus !== 'neutral' && zoneDoc.currentDominationStartTime) {
                    let elapsedSeconds = Math.floor((now - zoneDoc.currentDominationStartTime) / 1000);
                    
                    // Apply 1.5x multiplier if this is the active zone
                    if (zoneDoc.isActive) {
                        elapsedSeconds = Math.floor(elapsedSeconds * 1.5);
                        console.log(`⚡ Active zone bonus: ${Math.floor((now - zoneDoc.currentDominationStartTime) / 1000)}s → ${elapsedSeconds}s (1.5x)`);
                    }
                    
                    if (previousStatus === 'human') {
                        zoneDoc.humanTotalDominationTime += elapsedSeconds;
                    } else if (previousStatus === 'zombie') {
                        zoneDoc.zombieTotalDominationTime += elapsedSeconds;
                    }
                }
                
                // Set new domination status and start time
                zoneDoc.dominationStatus = newStatus;
                zoneDoc.lastDominationStatus = previousStatus;
                
                if (newStatus !== 'neutral') {
                    zoneDoc.currentDominationStartTime = now;
                } else {
                    zoneDoc.currentDominationStartTime = null;
                }
            }

            await zoneDoc.save();

            // Update player score if provided
            if (playerId && action === 'increment') {
                await User.findByIdAndUpdate(playerId, { $inc: { score: points } });
                await emitPlayerLeaderboards(io);
            }

            // Broadcast score update to all clients
            const updateData = { team, zone, difficulty, score, zoneDoc };
            console.log('Broadcasting r2:score_update:', {
                zone: zone,
                dominationStatus: zoneDoc.dominationStatus,
                currentDominationStartTime: zoneDoc.currentDominationStartTime,
                humanScore: zoneDoc.humanScore,
                zombieScore: zoneDoc.zombieScore
            });
            io.to('war_room').emit('r2:score_update', updateData);
            io.to('admin_room').emit('r2:score_update', updateData);

            // Send updated zones to war room
            const allZones = await Zone.find().sort({ name: 1 });
            console.log('Broadcasting r2:all_zones to war_room, zone count:', allZones.length);
            io.to('war_room').emit('r2:all_zones', allZones);
            
        } catch (e) {
            console.error('Error updating R2 score:', e);
        }
    });

    // --- ADMIN ACTIONS ---
    socket.on('admin:start_round1', async () => {
         // Start timer logic
         io.emit('timer:start', { round: 1 });
    });

    socket.on('admin:reset_all_scores', async () => {
        try {
            // Reset all zone scores and domination times
            await Zone.updateMany({}, { 
                humanScore: 0, 
                zombieScore: 0, 
                dominationStatus: 'neutral',
                humanDifficulty: { E: 0, M: 0, H: 0 },
                zombieDifficulty: { E: 0, M: 0, H: 0 },
                humanTotalDominationTime: 0,
                zombieTotalDominationTime: 0,
                currentDominationStartTime: null,
                lastDominationStatus: 'neutral'
            });
            
            // Reset all player scores
            await User.updateMany({}, { score: 0 });
            
            // Get updated zones and broadcast
            const allZones = await Zone.find().sort({ name: 1 });
            io.to('war_room').emit('r2:all_zones', allZones);
            io.to('war_room').emit('r2:scores_reset', { zones: allZones });
            io.to('admin_room').emit('r2:scores_reset', { zones: allZones });
            
            // Update leaderboards
            await emitPlayerLeaderboards(io);
            
            console.log('All scores reset by admin');
        } catch (e) {
            console.error('Error resetting scores:', e);
        }
    });

    socket.on('admin:activate_zone', async ({ zoneName }) => {
        try {
            console.log(`🎯 Admin activating zone: ${zoneName}`);
            
            // Deactivate all zones
            await Zone.updateMany({}, { isActive: false });
            
            // Activate the selected zone
            const zone = await Zone.findOneAndUpdate(
                { name: zoneName }, 
                { isActive: true, currentCycleStartTime: new Date() },
                { new: true }
            );
            
            if (!zone) {
                console.log('Zone not found:', zoneName);
                return;
            }
            
            // Get all zones and broadcast
            const allZones = await Zone.find().sort({ name: 1 });
            console.log(`✅ Zone ${zoneName} is now active`);
            
            io.to('war_room').emit('r2:zone_activated', zone);
            io.to('war_room').emit('r2:all_zones', allZones);
            io.to('admin_room').emit('r2:zone_activated', zone);
        } catch (e) {
            console.error('Error activating zone:', e);
        }
    });

    socket.on('r2:admin_trigger_sabotage', ({ team }) => {
        console.log(`💥 Sabotage triggered for: ${team}`);
        io.to('war_room').emit('r2:sabotage', { team });
    });

    socket.on('admin:start_round2', async () => {
        try {
            // Clear any existing timer
            if (round2TimerInterval) {
                clearInterval(round2TimerInterval);
            }

            // Reset timer to 60 minutes
            round2TimeRemaining = 3600;

            // Update match state
            const matchState = await MatchState.findOne() || new MatchState();
            matchState.round = 2;
            matchState.round2StartTime = new Date();
            matchState.isPaused = false;
            await matchState.save();

            // Broadcast initial timer state
            io.emit('r2:timer_update', { 
                timeRemaining: round2TimeRemaining,
                isRunning: true 
            });

            // Start countdown timer
            round2TimerInterval = setInterval(() => {
                round2TimeRemaining--;

                // Broadcast every second
                io.emit('r2:timer_update', { 
                    timeRemaining: round2TimeRemaining,
                    isRunning: true 
                });

                // Timer finished
                if (round2TimeRemaining <= 0) {
                    clearInterval(round2TimerInterval);
                    round2TimerInterval = null;
                    io.emit('r2:timer_finished');
                }
            }, 1000);

            console.log('Round 2 timer started - 60 minutes');
        } catch (e) {
            console.error('Error starting Round 2:', e);
        }
    });

    socket.on('admin:reset_round2', async () => {
        try {
            // Clear existing timer
            if (round2TimerInterval) {
                clearInterval(round2TimerInterval);
                round2TimerInterval = null;
            }

            // Reset timer to 60 minutes
            round2TimeRemaining = 3600;

            // Update match state
            const matchState = await MatchState.findOne() || new MatchState();
            matchState.round2StartTime = null;
            matchState.isPaused = true;
            await matchState.save();

            // Broadcast reset state
            io.emit('r2:timer_update', { 
                timeRemaining: round2TimeRemaining,
                isRunning: false 
            });

            console.log('Round 2 timer reset');
        } catch (e) {
            console.error('Error resetting Round 2 timer:', e);
        }
    });

    socket.on('disconnect', () => {
      console.log('User Disconnected', socket.id);
    });
  });
};
