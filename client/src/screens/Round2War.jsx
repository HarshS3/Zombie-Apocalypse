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
        <div className="h-screen w-full bg-[#121010] flex flex-col relative overflow-hidden">
             {/* Dynamic Background */}
            <div className={`absolute inset-0 transition-colors duration-1000 ${
                activeZone && getZoneDominance(activeZone) === 'human' ? 'bg-[#3C8DAB]/10' : 
                activeZone && getZoneDominance(activeZone) === 'zombie' ? 'bg-[#ff3333]/10' : 'bg-[#121010]'
            }`}></div>
            
            {/* Top Bar - Active Zone Indicator */}
            <header className="relative z-10 flex justify-between items-center p-6 bg-[#2c2c2c] border-b-4 border-b-black shadow-[0_4px_0_#000]">
                 <div>
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-[#f0c330] mb-2 text-shadow-[2px_2px_#3f2a00]">Round 2: PVP Arena</h1>
                    <div className="flex items-center gap-6">
                        <span className="text-[#bfbfbf] text-sm uppercase tracking-widest text-shadow-[1px_1px_#000]">Active Chunk:</span>
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
                                            w-16 h-16 flex items-center justify-center font-bold text-2xl border-4 transition-all
                                            ${isActive 
                                                ? dominance === 'human' ? 'bg-[#3C8DAB] border-black text-white text-shadow-[2px_2px_#204c5c]'
                                                : dominance === 'zombie' ? 'bg-[#ff3333] border-black text-white text-shadow-[2px_2px_#3f0000]'
                                                : 'bg-[#f0c330] border-black text-black'
                                                : 'bg-[#8b8b8b] border-black text-[#555]'
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
                        <div className="text-5xl font-mono font-bold text-[#ff3333] tracking-widest text-shadow-[3px_3px_#3f0000]">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-xs text-[#bfbfbf] uppercase tracking-widest mt-1 text-shadow-[1px_1px_#000]">Redstone Clock</div>
                    </div>
                 </div>
            </header>

            {/* Main Grid Layout */}
            <main className="flex-1 grid grid-cols-12 gap-6 p-6 relative z-10 overflow-auto">
                {/* Left Column: Zone Scores + Domination Time */}
                <div className="col-span-4 space-y-6">
                    {/* Zone Scores */}
                    <div className="mc-panel p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#3f3f3f]">
                            <Crosshair className="w-5 h-5 text-[#f0c330]" />
                            Chunk Control Status
                        </h2>
                        <div className="space-y-4">
                            {zones.map(zone => {
                                const dominance = getZoneDominance(zone);
                                const isActive = activeZone?._id === zone._id;
                                return (
                                    <div key={`${zone._id}-${zone.humanScore}-${zone.zombieScore}-${zone.dominationStatus}`} className={`
                                        p-4 border-4 transition-all
                                        ${dominance === 'human' ? 'bg-[#3C8DAB]/20 border-[#3C8DAB]' : 
                                          dominance === 'zombie' ? 'bg-[#ff3333]/20 border-[#ff3333]' : 
                                          'bg-[#8b8b8b] border-gray-600'}
                                        ${isActive ? 'ring-4 ring-[#f0c330]' : ''}
                                    `}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-shadow-[1px_1px_#000] text-white">CHUNK {zone.name}</span>
                                                {isActive && <span className="text-xs bg-[#f0c330] text-black px-2 py-1 border-2 border-black font-bold">ACTIVE</span>}
                                            </div>
                                            <span className={`text-sm font-bold uppercase text-shadow-[1px_1px_#000] ${
                                                dominance === 'human' ? 'text-[#3C8DAB]' :
                                                dominance === 'zombie' ? 'text-[#ff3333]' : 'text-white'
                                            }`}>
                                                {dominance === 'neutral' ? 'Contested' : dominance === 'human' ? 'Human Controlled' : 'Zombie Controlled'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-xs text-[#bfbfbf] mb-1 font-bold">HUMANS</div>
                                                <div className="text-3xl font-bold text-[#3C8DAB] text-shadow-[1px_1px_#000]">{zone.humanScore || 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-[#bfbfbf] mb-1 font-bold">ZOMBIES</div>
                                                <div className="text-3xl font-bold text-[#ff3333] text-shadow-[1px_1px_#000]">{zone.zombieScore || 0}</div>
                                            </div>
                                        </div>
                                        
                                        {/* Current Domination Status */}
                                        <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-600">
                                            <div className="text-xs text-[#bfbfbf] mb-1 font-bold">Current Status:</div>
                                            {dominance === 'neutral' ? (
                                                <span className="text-sm text-white font-mono">Neutral - No domination</span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${dominance === 'human' ? 'text-[#3C8DAB]' : 'text-[#ff3333]'} text-shadow-[1px_1px_#000]`}>
                                                        {dominance === 'human' ? 'Humans' : 'Zombies'} dominating since: 
                                                    </span>
                                                    <span className={`font-mono text-lg font-bold ${dominance === 'human' ? 'text-[#3C8DAB]' : 'text-[#ff3333]'} text-shadow-[1px_1px_#000]`}>
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
                    <div className="mc-panel p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#3f3f3f]">
                            <Clock className="w-5 h-5 text-[#f0c330]" />
                            Total Capture Time (Per Chunk)
                        </h2>
                        <div className="space-y-3">
                            {zones.map(zone => (
                                <div key={`${zone._id}-dom-${zone.humanTotalDominationTime}-${zone.zombieTotalDominationTime}`} className="p-3 bg-[#373737] border-2 border-black">
                                    <div className="text-sm font-bold text-white mb-2 text-shadow-[1px_1px_#000]">Chunk {zone.name}</div>
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3 h-3 text-[#3C8DAB]" />
                                            <span className="text-[#bfbfbf]">Humans:</span>
                                            <span className="font-mono text-[#3C8DAB] font-bold text-shadow-[1px_1px_#000]">
                                                {formatDominationTime(zone.humanTotalDominationTime || 0)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Skull className="w-3 h-3 text-[#ff3333]" />
                                            <span className="text-[#bfbfbf]">Zombies:</span>
                                            <span className="font-mono text-[#ff3333] font-bold text-shadow-[1px_1px_#000]">
                                                {formatDominationTime(zone.zombieTotalDominationTime || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sabotage Status */}
                    <div className="mc-panel p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#3f3f3f]">
                            <Shield className="w-5 h-5 text-[#ff3333]" />
                            Creeper Trap Status (20min)
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-[#3f3f3f] mb-2 flex items-center gap-2 font-bold">
                                    <Users className="w-4 h-4 text-[#3C8DAB]" />
                                    Humans
                                </div>
                                <div className="flex gap-2">
                                    {sabotageStatus.humans.map((used, i) => (
                                        <div key={i} className={`flex-1 h-8 border-2 border-black flex items-center justify-center font-bold ${
                                            used ? 'bg-[#5b8731] text-white' : 'bg-[#8b8b8b] text-[#555]'
                                        }`}>
                                            {used ? '✓' : ''}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-[#3f3f3f] mb-2 flex items-center gap-2 font-bold">
                                    <Skull className="w-4 h-4 text-[#ff3333]" />
                                    Zombies
                                </div>
                                <div className="flex gap-2">
                                    {sabotageStatus.zombies.map((used, i) => (
                                        <div key={i} className={`flex-1 h-8 border-2 border-black flex items-center justify-center font-bold ${
                                            used ? 'bg-[#5b8731] text-white' : 'bg-[#8b8b8b] text-[#555]'
                                        }`}>
                                            {used ? '✓' : ''}
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
                        <div className="bg-[#3C8DAB] border-4 border-black p-6 shadow-[4px_4px_0_#000]">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider text-shadow-[2px_2px_#204c5c]">Humans Total</h3>
                            </div>
                            <div className="text-sm text-white/80 mb-3 font-bold">Total Capture Time (All Chunks)</div>
                            <div className="text-5xl font-mono font-bold text-white text-shadow-[3px_3px_#204c5c]">
                                {formatDominationTime(
                                    zones.reduce((sum, z) => sum + (z.humanTotalDominationTime || 0) + 
                                        (z.dominationStatus === 'human' ? (liveTimes[z.name] || 0) : 0), 0)
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-[#ff3333] border-4 border-black p-6 shadow-[4px_4px_0_#000]">
                            <div className="flex items-center gap-2 mb-2">
                                <Skull className="w-6 h-6 text-white" strokeWidth={2.5} />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider text-shadow-[2px_2px_#3f0000]">Zombies Total</h3>
                            </div>
                            <div className="text-sm text-white/80 mb-3 font-bold">Total Capture Time (All Chunks)</div>
                            <div className="text-5xl font-mono font-bold text-white text-shadow-[3px_3px_#3f0000]">
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
                        <div className="mc-panel p-6">
                            <div className="flex items-center gap-3 mb-6 border-b-2 border-gray-600 pb-2">
                            <Users className="w-8 h-8 text-[#3C8DAB]" />
                            <h2 className="text-2xl font-bold uppercase text-[#3f3f3f]">Humans</h2>
                        </div>
                        <div className="space-y-2">
                            {humanLeaderboard.length > 0 ? humanLeaderboard.map(player => (
                                <div key={player.rank} className="flex items-center justify-between p-3 bg-[#c6c6c6] rounded-none border-2 border-black">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-[#3C8DAB] border-2 border-black flex items-center justify-center font-bold text-white text-shadow-[1px_1px_#000]">
                                            {player.rank}
                                        </div>
                                        <div className="font-mono text-black font-bold">{player.username}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-[#3C8DAB] text-shadow-[1px_1px_#000]">{player.score}</div>
                                        <div className="text-xs text-[#555] font-bold">XP</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-[#555] py-8 font-bold">No players connected...</div>
                            )}
                        </div>
                    </div>

                    {/* Zombies Leaderboard */}
                    <div className="mc-panel p-6">
                        <div className="flex items-center gap-3 mb-6 border-b-2 border-gray-600 pb-2">
                            <Skull className="w-8 h-8 text-[#ff3333]" />
                            <h2 className="text-2xl font-bold uppercase text-[#3f3f3f]">Zombies</h2>
                        </div>
                        <div className="space-y-2">
                            {zombieLeaderboard.length > 0 ? zombieLeaderboard.map(player => (
                                <div key={player.rank} className="flex items-center justify-between p-3 bg-[#c6c6c6] rounded-none border-2 border-black">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-[#ff3333] border-2 border-black flex items-center justify-center font-bold text-white text-shadow-[1px_1px_#000]">
                                            {player.rank}
                                        </div>
                                        <div className="font-mono text-black font-bold">{player.username}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-[#ff3333] text-shadow-[1px_1px_#000]">{player.score}</div>
                                        <div className="text-xs text-[#555] font-bold">XP</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-[#555] py-8 font-bold">No players connected...</div>
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
                        className={`bg-[#c6c6c6] border-4 border-black shadow-[8px_8px_0_#000] p-8 max-w-md text-center`}
                    >
                        <div className="flex flex-col items-center gap-4">
                            <Zap className={`w-20 h-20 ${sabotageModal.team === 'human' ? 'text-[#3C8DAB]' : 'text-[#ff3333]'} animate-bounce`} strokeWidth={2.5} />
                            <h2 className="text-4xl font-bold uppercase text-[#3f3f3f] tracking-wider text-shadow-[2px_2px_#bfbfbf]">TNT Ignited!</h2>
                            <p className={`text-2xl font-bold uppercase ${sabotageModal.team === 'human' ? 'text-[#3C8DAB]' : 'text-[#ff3333]'} text-shadow-[1px_1px_#000]`}>
                                {sabotageModal.team === 'human' ? 'HUMANS' : 'ZOMBIES'}
                            </p>
                            <p className="text-[#3f3f3f] text-lg font-bold">2nd Rank Player Blown Up (5 Min Timeout)</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default Round2War;
