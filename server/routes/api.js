const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');
const Lab = require('../models/Lab');
const PC = require('../models/PC');
const Question = require('../models/Question');
const Zone = require('../models/Zone');
const MatchState = require('../models/MatchState');

// Init Seed Data (Quick setup for the event)
router.post('/seed', async (req, res) => {
    try {
        // ===== ROUND 1: LAB BREACH =====
        console.log('Seeding Round 1 data...');
        await Lab.deleteMany({});
        await PC.deleteMany({});
        
        const labs = [];
        for(let i=1; i<=8; i++) {
            const lab = await Lab.create({
                labNumber: i,
                name: `Lab ${i}`,
                correctWord: `VIRUS${i}`,
                assignedAlphabets: ['V','I','R','U','S', i.toString()],
                infectionLevel: i <= 3 ? 'low' : i <= 6 ? 'medium' : 'critical'
            });
            labs.push(lab);

            // Create PCs
            for(let j=1; j<=10; j++) {
                await PC.create({
                    labId: lab._id,
                    pcNumber: j,
                    steps: { a: false, b: false, c: false, d: false },
                    progress: 0,
                    assignedAlphabet: String.fromCharCode(65 + (j - 1)), // A-J
                    questions: []
                });
            }
        }

        // ===== ROUND 2: DOMINATION =====
        console.log('Seeding Round 2 data...');
        
        // Create Teams
        await Team.deleteMany({});
        const humanTeam = await Team.create({
            name: 'Humans',
            faction: 'human',
            score: 0
        });
        const zombieTeam = await Team.create({
            name: 'Zombies',
            faction: 'zombie',
            score: 0
        });

        // Create Players
        await User.deleteMany({});
        const humanPlayers = [];
        const zombiePlayers = [];

        // Human Players
        const humanNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
        for (let i = 0; i < humanNames.length; i++) {
            const player = await User.create({
                username: humanNames[i],
                role: 'player',
                teamId: humanTeam._id,
                score: 0
            });
            humanPlayers.push(player);
        }

        // Zombie Players
        const zombieNames = ['Zara', 'Zeke', 'Zion', 'Zavi', 'Zulu', 'Zephyr', 'Zane', 'Zelda', 'Ziggy', 'Zora'];
        for (let i = 0; i < zombieNames.length; i++) {
            const player = await User.create({
                username: zombieNames[i],
                role: 'player',
                teamId: zombieTeam._id,
                score: 0
            });
            zombiePlayers.push(player);
        }

        // Create Zones
        await Zone.deleteMany({});
        const zones = await Zone.create([
            { name: 'A', weightage: 1, isActive: true },
            { name: 'B', weightage: 1.5, isActive: false },
            { name: 'C', weightage: 2, isActive: false }
        ]);

        // Create Match State
        await MatchState.deleteMany({});
        await MatchState.create({
            round: 1,
            round1StartTime: new Date(),
            round1Timer: 3000, // 50 minutes in seconds
            isPaused: false,
            activeZoneId: zones[0]._id
        });

        res.json({ 
            message: 'Database Seeded Successfully',
            data: {
                labs: labs.length,
                pcs: labs.length * 10,
                zones: zones.length,
                humanPlayers: humanPlayers.length,
                zombiePlayers: zombiePlayers.length,
                teams: 2
            }
        });
    } catch (e) {
        console.error('Seed error:', e);
        res.status(500).json({ error: e.message });
    }
});

router.get('/labs', async (req, res) => {
    const labs = await Lab.find().sort({ labNumber: 1 });
    res.json(labs);
});

router.get('/labs/by-number/:labNumber', async (req, res) => {
    const labNumber = Number(req.params.labNumber);
    const lab = await Lab.findOne({ labNumber });
    if (!lab) return res.status(404).json({ error: 'Lab not found' });
    const pcs = await PC.find({ labId: lab._id }).sort({ pcNumber: 1 });
    res.json({ lab, pcs });
});

// Get all teams
router.get('/teams', async (req, res) => {
    const teams = await Team.find();
    res.json(teams);
});

// Get players by team
router.get('/teams/:teamId/players', async (req, res) => {
    const players = await User.find({ teamId: req.params.teamId, role: 'player' });
    res.json(players);
});

// Get all zones
router.get('/zones', async (req, res) => {
    const zones = await Zone.find().sort({ name: 1 });
    res.json(zones);
});

// Get match state
router.get('/match-state', async (req, res) => {
    const state = await MatchState.findOne();
    res.json(state || {});
});

module.exports = router;
