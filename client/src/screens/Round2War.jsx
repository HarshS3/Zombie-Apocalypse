import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'framer-motion';
import { Swords, Skull, Users, Shield, Crosshair, Clock, Zap } from 'lucide-react';
import soundManager from '../utils/sounds';
import SoundControl from '../components/SoundControl';

const Round2War = () => {
    const { socket } = useGame();
    const [zones, setZones] = useState([]);
    const [activeZone, setActiveZone] = useState(null);
    const [timeLeft, setTimeLeft] = useState(420); // 7 mins
    const [humanLeaderboard, setHumanLeaderboard] = useState([]);
    const [zombieLeaderboard, setZombieLeaderboard] = useState([]);
    const [sabotageStatus, setSabotageStatus] = useState({ humans: [false, false, false], zombies: [false, false, false] });
    const [liveTimes, setLiveTimes] = useState({});
    const [sabotageModal, setSabotageModal] = useState({ show: false, team: null });

    // Helper functions for domination time
    const formatDominationTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getCurrentDominationTime = (zone) => {
        if (!zone || zone.dominationStatus === 'neutral' || !zone.currentDominationStartTime) {
            return 0;
        }
        let elapsed = Math.floor((Date.now() - new Date(zone.currentDominationStartTime).getTime()) / 1000);
        
        // Apply 1.5x multiplier for active zone
        if (zone.isActive) {
            elapsed = Math.floor(elapsed * 1.5);
        }
        
        return elapsed;
    };

    // Fetch initial zones from API
    useEffect(() => {
        const fetchZones = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/zones');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setZones(data);
                    const active = data.find(z => z.isActive);
                    if (active) setActiveZone(active);
                }
            } catch (e) {
                console.error('Failed to fetch zones:', e);
            }
        };
        fetchZones();
    }, []);

    // Live timer that ticks every second for domination times
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveTimes(prev => {
                const newTimes = {};
                zones.forEach(zone => {
                    if (zone.dominationStatus !== 'neutral' && zone.currentDominationStartTime) {
                        newTimes[zone.name] = getCurrentDominationTime(zone);
                    } else {
                        newTimes[zone.name] = 0;
                    }
                });
                return newTimes;
            });
        }, 1000);
        
        return () => clearInterval(interval);
    }, [zones]);

    useEffect(() => {
        if(!socket) {
            console.log('Socket not available');
            return;
        }
        
        console.log('Setting up socket listeners once...');
        socket.emit('r2:join_war', { userId: 'screen' });
        
        const handleZoneUpdate = (data) => {
            if(data) setActiveZone(data);
        };
        
        const handleZoneActivated = (data) => {
            soundManager.play('zoneActivated');
            setActiveZone(data);
            setTimeLeft(420);
        };
        
        const handlePlayerLeaderboards = (data) => {
            if (data) {
                setHumanLeaderboard(data.humans || []);
                setZombieLeaderboard(data.zombies || []);
            }
        };

        const handleScoreUpdate = (data) => {
            if (data && data.zoneDoc) {
                // Play capture sound if zone status changed
                setZones(prev => {
                    const oldZone = prev.find(z => String(z._id) === String(data.zoneDoc._id));
                    if (oldZone && oldZone.status !== data.zoneDoc.status && data.zoneDoc.status !== 'neutral') {
                        soundManager.play('zoneCapture');
                    }
                    return prev.map(z => 
                        String(z._id) === String(data.zoneDoc._id) ? data.zoneDoc : z
                    );
                });
                
                setActiveZone(prev => {
                    if (prev && String(prev._id) === String(data.zoneDoc._id)) {
                        return data.zoneDoc;
                    }
                    return prev;
                });
            }
        };

        const handleAllZones = (data) => {
            if (Array.isArray(data)) {
                setZones(data);
            }
        };

        const handleTimerUpdate = (data) => {
            if (data && data.timeRemaining !== undefined) {
                setTimeLeft(prev => {
                    // Play warning sound at 60 seconds
                    if (data.timeRemaining === 60 && prev > 60) {
                        soundManager.play('timerWarning');
                    }
                    // Play tick sound in last 10 seconds
                    if (data.timeRemaining <= 10 && data.timeRemaining > 0 && prev > data.timeRemaining) {
                        soundManager.play('timerTick');
                    }
                    return data.timeRemaining;
                });
            }
        };

        const handleTimerFinished = () => {
            soundManager.play('timerEnd');
            setTimeLeft(0);
        };
        
        const handleScoresReset = (data) => {
            console.log('🔄 Scores reset received in war room');
            soundManager.play('reset');
            if (data && Array.isArray(data.zones)) {
                setZones(data.zones);
            }
            // Reset leaderboards
            setHumanLeaderboard([]);
            setZombieLeaderboard([]);
        };
        
        const handleSabotage = (data) => {
            if (data && data.team) {
                console.log(`💥 Sabotage triggered for ${data.team}`);
                soundManager.play('sabotage');
                setSabotageModal({ show: true, team: data.team });
                
                // Auto-dismiss after 5 seconds
                setTimeout(() => {
                    setSabotageModal({ show: false, team: null });
                }, 5000);
            }
        };
        
        socket.on('r2:zone_update', handleZoneUpdate);
        socket.on('r2:zone_activated', handleZoneActivated);
        socket.on('r2:player_leaderboards', handlePlayerLeaderboards);
        socket.on('r2:score_update', handleScoreUpdate);
        socket.on('r2:all_zones', handleAllZones);
        socket.on('r2:sabotage', handleSabotage);
        socket.on('r2:timer_update', handleTimerUpdate);
        socket.on('r2:timer_finished', handleTimerFinished);
        socket.on('r2:scores_reset', handleScoresReset);

        return () => {
            socket.off('r2:zone_update', handleZoneUpdate);
            socket.off('r2:zone_activated', handleZoneActivated);
            socket.off('r2:player_leaderboards', handlePlayerLeaderboards);
            socket.off('r2:score_update', handleScoreUpdate);
            socket.off('r2:all_zones', handleAllZones);
            socket.off('r2:sabotage', handleSabotage);
            socket.off('r2:timer_update', handleTimerUpdate);
            socket.off('r2:timer_finished', handleTimerFinished);
            socket.off('r2:scores_reset', handleScoresReset);
        };
    }, [socket]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const getZoneDominance = (zone) => {
        if (!zone) return 'neutral';
        if (zone.humanScore > zone.zombieScore) return 'human';
        if (zone.zombieScore > zone.humanScore) return 'zombie';
        return 'neutral';
    };

    return (
        <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden">
             {/* Dynamic Background */}
            <div className={`absolute inset-0 transition-colors duration-1000 ${
                activeZone && getZoneDominance(activeZone) === 'human' ? 'bg-blue-900/20' : 
                activeZone && getZoneDominance(activeZone) === 'zombie' ? 'bg-red-900/20' : 'bg-gray-900/10'
            }`}></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />

            {/* Top Bar - Active Zone Indicator */}
            <header className="relative z-10 flex justify-between items-center p-6 bg-black/80 backdrop-blur border-b border-gray-800">
                 <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Round 2: Domination Protocol</h1>
                    <div className="flex items-center gap-6">
                        <span className="text-gray-400 text-sm uppercase tracking-widest">Active Zone:</span>
                        <div className="flex gap-3">
                            {['A', 'B', 'C'].map(zoneName => {
                                const isActive = activeZone?.name === zoneName;
                                const zone = zones.find(z => z.name === zoneName);
                                const dominance = getZoneDominance(zone);
                                return (
                                    <motion.div
                                        key={zoneName}
                                        animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className={`
                                            w-16 h-16 flex items-center justify-center rounded-lg font-black text-2xl border-2 transition-all
                                            ${isActive 
                                                ? dominance === 'human' ? 'bg-neonBlue/20 border-neonBlue text-neonBlue shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                                                : dominance === 'zombie' ? 'bg-neonRed/20 border-neonRed text-neonRed shadow-[0_0_20px_rgba(255,0,60,0.4)]'
                                                : 'bg-white/10 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                                : 'bg-gray-900/50 border-gray-700 text-gray-600'
                                            }
                                        `}
                                    >
                                        {zoneName}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                 </div>
                 <div className="text-right flex items-center gap-4">
                    <SoundControl />
                    <div>
                        <div className="text-5xl font-mono font-bold text-white tracking-widest">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">Cycle Timer</div>
                    </div>
                 </div>
            </header>

            {/* Main Grid Layout */}
            <main className="flex-1 grid grid-cols-12 gap-6 p-6 relative z-10 overflow-auto">
                {/* Left Column: Zone Scores + Domination Time */}
                <div className="col-span-4 space-y-6">
                    {/* Zone Scores */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 backdrop-blur">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Crosshair className="w-5 h-5 text-yellow-400" />
                            Zone Control Status
                        </h2>
                        <div className="space-y-4">
                            {zones.map(zone => {
                                const dominance = getZoneDominance(zone);
                                const isActive = activeZone?._id === zone._id;
                                return (
                                    <div key={`${zone._id}-${zone.humanScore}-${zone.zombieScore}-${zone.dominationStatus}`} className={`
                                        p-4 rounded-lg border-2 transition-all
                                        ${dominance === 'human' ? 'bg-neonBlue/10 border-neonBlue/50' : 
                                          dominance === 'zombie' ? 'bg-neonRed/10 border-neonRed/50' : 
                                          'bg-gray-800/40 border-gray-700'}
                                        ${isActive ? 'ring-2 ring-yellow-400/50' : ''}
                                    `}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black">ZONE {zone.name}</span>
                                                {isActive && <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded font-bold">ACTIVE</span>}
                                            </div>
                                            <span className={`text-sm font-bold uppercase ${
                                                dominance === 'human' ? 'text-neonBlue' :
                                                dominance === 'zombie' ? 'text-neonRed' : 'text-gray-400'
                                            }`}>
                                                {dominance === 'neutral' ? 'Contested' : dominance === 'human' ? 'Human Controlled' : 'Zombie Controlled'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">HUMANS</div>
                                                <div className="text-3xl font-bold text-neonBlue">{zone.humanScore || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-400 mb-1">ZOMBIES</div>
                                                <div className="text-3xl font-bold text-neonRed">{zone.zombieScore || 0}</div>
                                            </div>
                                        </div>
                                        
                                        {/* Current Domination Status */}
                                        <div className="mt-3 pt-3 border-t border-gray-700">
                                            <div className="text-xs text-gray-400 mb-1">Current Status:</div>
                                            {dominance === 'neutral' ? (
                                                <span className="text-sm text-gray-300 font-mono">Neutral - No domination</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${dominance === 'human' ? 'text-neonBlue' : 'text-neonRed'}`}>
                                                        {dominance === 'human' ? 'Humans' : 'Zombies'} dominating since: 
                                                    </span>
                                                    <span className={`font-mono text-lg font-bold ${dominance === 'human' ? 'text-neonBlue' : 'text-neonRed'}`}>
                                                        {formatDominationTime(liveTimes[zone.name] || 0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Zone Domination Time */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 backdrop-blur">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Total Domination Time (Per Zone)
                        </h2>
                        <div className="space-y-3">
                            {zones.map(zone => (
                                <div key={`${zone._id}-dom-${zone.humanTotalDominationTime}-${zone.zombieTotalDominationTime}`} className="p-3 bg-black/40 rounded-lg border border-gray-800">
                                    <div className="text-sm font-bold text-gray-300 mb-2">Zone {zone.name}</div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3 h-3 text-neonBlue" />
                                            <span className="text-gray-400">Humans:</span>
                                            <span className="font-mono text-neonBlue font-bold">
                                                {formatDominationTime(zone.humanTotalDominationTime || 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skull className="w-3 h-3 text-neonRed" />
                                            <span className="text-gray-400">Zombies:</span>
                                            <span className="font-mono text-neonRed font-bold">
                                                {formatDominationTime(zone.zombieTotalDominationTime || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sabotage Status */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 backdrop-blur">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-orange-400" />
                            Sabotage Status (20min windows)
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-neonBlue" />
                                    Humans
                                </div>
                                <div className="flex gap-2">
                                    {sabotageStatus.humans.map((used, i) => (
                                        <div key={i} className={`flex-1 h-8 rounded border-2 flex items-center justify-center font-bold ${
                                            used ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-gray-800/30 border-gray-700 text-gray-500'
                                        }`}>
                                            {used ? '✓' : '○'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                                    <Skull className="w-4 h-4 text-neonRed" />
                                    Zombies
                                </div>
                                <div className="flex gap-2">
                                    {sabotageStatus.zombies.map((used, i) => (
                                        <div key={i} className={`flex-1 h-8 rounded border-2 flex items-center justify-center font-bold ${
                                            used ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-gray-800/30 border-gray-700 text-gray-500'
                                        }`}>
                                            {used ? '✓' : '○'}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Cumulative Totals + Player Leaderboards */}
                <div className="col-span-8 space-y-6">
                    {/* Cumulative Domination Times */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-neonBlue/10 border-2 border-neonBlue rounded-xl p-6 backdrop-blur">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-6 h-6 text-neonBlue" />
                                <h3 className="text-xl font-bold text-neonBlue uppercase tracking-wider">Humans Total</h3>
                            </div>
                            <div className="text-sm text-gray-400 mb-3">Total Domination Time (All Zones)</div>
                            <div className="text-5xl font-mono font-black text-neonBlue">
                                {formatDominationTime(
                                    zones.reduce((sum, z) => sum + (z.humanTotalDominationTime || 0) + 
                                        (z.dominationStatus === 'human' ? (liveTimes[z.name] || 0) : 0), 0)
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-neonRed/10 border-2 border-neonRed rounded-xl p-6 backdrop-blur">
                            <div className="flex items-center gap-2 mb-2">
                                <Skull className="w-6 h-6 text-neonRed" />
                                <h3 className="text-xl font-bold text-neonRed uppercase tracking-wider">Zombies Total</h3>
                            </div>
                            <div className="text-sm text-gray-400 mb-3">Total Domination Time (All Zones)</div>
                            <div className="text-5xl font-mono font-black text-neonRed">
                                {formatDominationTime(
                                    zones.reduce((sum, z) => sum + (z.zombieTotalDominationTime || 0) + 
                                        (z.dominationStatus === 'zombie' ? (liveTimes[z.name] || 0) : 0), 0)
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Player Leaderboards */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Humans Leaderboard */}
                        <div className="bg-gray-900/60 border-2 border-neonBlue/30 rounded-xl p-6 backdrop-blur">
                            <div className="flex items-center gap-3 mb-6">
                            <Users className="w-8 h-8 text-neonBlue" />
                            <h2 className="text-2xl font-black uppercase text-neonBlue">Humans</h2>
                        </div>
                        <div className="space-y-2">
                            {humanLeaderboard.length > 0 ? humanLeaderboard.map(player => (
                                <div key={player.rank} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-neonBlue/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-neonBlue/20 border border-neonBlue flex items-center justify-center font-bold text-neonBlue">
                                            {player.rank}
                                        </div>
                                        <div className="font-mono text-white">{player.username}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-neonBlue">{player.score}</div>
                                        <div className="text-xs text-gray-400">points</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 py-8">No players yet</div>
                            )}
                        </div>
                    </div>

                    {/* Zombies Leaderboard */}
                    <div className="bg-gray-900/60 border-2 border-neonRed/30 rounded-xl p-6 backdrop-blur">
                        <div className="flex items-center gap-3 mb-6">
                            <Skull className="w-8 h-8 text-neonRed" />
                            <h2 className="text-2xl font-black uppercase text-neonRed">Zombies</h2>
                        </div>
                        <div className="space-y-2">
                            {zombieLeaderboard.length > 0 ? zombieLeaderboard.map(player => (
                                <div key={player.rank} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-neonRed/20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-neonRed/20 border border-neonRed flex items-center justify-center font-bold text-neonRed">
                                            {player.rank}
                                        </div>
                                        <div className="font-mono text-white">{player.username}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-neonRed">{player.score}</div>
                                        <div className="text-xs text-gray-400">points</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-gray-500 py-8">No players yet</div>
                            )}
                        </div>
                    </div>
                    </div>
                </div>
            </main>

            {/* Sabotage Modal */}
            {sabotageModal.show && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`bg-gray-900 border-4 ${sabotageModal.team === 'human' ? 'border-neonBlue shadow-[0_0_30px_rgba(0,243,255,0.5)]' : 'border-neonRed shadow-[0_0_30px_rgba(255,0,60,0.5)]'} rounded-xl p-8 max-w-md`}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Zap className={`w-20 h-20 ${sabotageModal.team === 'human' ? 'text-neonBlue' : 'text-neonRed'} animate-pulse`} />
                            <h2 className="text-4xl font-black uppercase text-yellow-400 tracking-wider">Sabotage Activated For:</h2>
                            <p className={`text-2xl font-bold uppercase ${sabotageModal.team === 'human' ? 'text-neonBlue' : 'text-neonRed'}`}>
                                {sabotageModal.team === 'human' ? 'HUMANS' : 'ZOMBIES'}
                            </p>
                            <p className="text-white text-center text-lg font-semibold">2nd Rank Player Eliminated for 5 Minutes</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default Round2War;
