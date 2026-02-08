import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Plus, Minus, X, Users, Skull, Zap, Crosshair } from 'lucide-react';
import soundManager from '../utils/sounds';
import SoundControl from '../components/SoundControl';

// Player Selection Modal - Simplified
const PlayerModal = ({ isOpen, onClose, team, zone, difficulty, players, onConfirm }) => {
  const [selectedPlayer, setSelectedPlayer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayer) return;
    
    soundManager.play('scoreIncrement');
    
    // Call parent callback with playerId
    onConfirm(selectedPlayer);
    
    // Reset and close
    setSelectedPlayer('');
    onClose();
  };

  const teamColor = team === 'human' ? 'neonBlue' : 'neonRed';
  const teamBg = team === 'human' ? 'bg-blue-900/20' : 'bg-red-900/20';
  const teamBorder = team === 'human' ? 'border-neonBlue' : 'border-neonRed';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-gray-900 border-2 ${teamBorder} rounded-xl p-6 max-w-md w-full`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className={`text-2xl font-bold text-${teamColor} uppercase mb-1`}>Select Player</h3>
            <p className="text-gray-400 text-sm font-mono">
              Zone {zone} • {difficulty === 'E' ? 'Easy' : difficulty === 'M' ? 'Medium' : 'Hard'}
            </p>
          </div>
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-400 text-xs uppercase tracking-widest mb-2">Player Name</label>
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-neonBlue focus:outline-none"
            >
              <option value="">-- Select Player --</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedPlayer}
              className={`flex-1 py-2 ${teamBg} border ${teamBorder} rounded-lg hover:opacity-80 transition disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Score Cell Component
const ScoreCell = ({ zone, difficulty, score, team, onIncrement, onDecrement }) => {
  const teamColor = team === 'human' ? 'text-[#3C8DAB]' : 'text-[#ff3333]';

  return (
    <div className={`bg-[#373737] border-2 border-black p-4 flex flex-col items-center justify-center gap-3 relative shadow-[2px_2px_0_#000]`}>
      <div className="text-xs text-[#bfbfbf] uppercase tracking-widest font-bold">
        {zone} • {difficulty === 'E' ? 'Easy' : difficulty === 'M' ? 'Med' : 'Hard'}
      </div>
      <div className={`text-4xl font-bold ${teamColor} font-mono text-shadow-[2px_2px_#000]`}>{score}</div>
      <div className="flex gap-2">
        <button
          onClick={onDecrement}
          className="w-10 h-10 border-2 border-black bg-[#8b8b8b] hover:bg-[#a0a0a0] transition flex items-center justify-center shadow-[1px_1px_0_#000] active:translate-y-1 active:shadow-none"
          disabled={score <= 0}
        >
          <Minus className="w-4 h-4 text-black" strokeWidth={3} />
        </button>
        <button
          onClick={onIncrement}
          className={`w-10 h-10 border-2 border-black ${team === 'human' ? 'bg-[#3C8DAB] hover:bg-[#204c5c]' : 'bg-[#ff3333] hover:bg-[#b32424]'} transition flex items-center justify-center shadow-[1px_1px_0_#000] active:translate-y-1 active:shadow-none`}
        >
          <Plus className="w-4 h-4 text-white" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

const Round2Admin = () => {
  const { socket } = useGame();

  // Score state: { human: { A: { E: 0, M: 0, H: 0 }, B: {...}, C: {...} }, zombie: {...} }
  const [scores, setScores] = useState({
    human: {
      A: { E: 0, M: 0, H: 0 },
      B: { E: 0, M: 0, H: 0 },
      C: { E: 0, M: 0, H: 0 },
    },
    zombie: {
      A: { E: 0, M: 0, H: 0 },
      B: { E: 0, M: 0, H: 0 },
      C: { E: 0, M: 0, H: 0 },
    },
  });

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    team: null,
    zone: null,
    difficulty: null,
  });
  
  // Use ref instead of state for synchronous checking
  const isProcessingRef = useRef(false);
  
  // Active zone state
  const [activeZone, setActiveZone] = useState('A');

  // Dynamic players from API
  const [players, setPlayers] = useState({
    human: [],
    zombie: [],
  });
  const [teams, setTeams] = useState({ human: null, zombie: null });

  // Fetch initial zone scores from API
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/zones');
        const zonesData = await res.json();
        
        if (Array.isArray(zonesData)) {
          // Load difficulty counts directly from zone documents
          const newScores = { human: {}, zombie: {} };
          zonesData.forEach(zone => {
            newScores.human[zone.name] = {
              E: zone.humanDifficulty?.E || 0,
              M: zone.humanDifficulty?.M || 0,
              H: zone.humanDifficulty?.H || 0,
            };
            newScores.zombie[zone.name] = {
              E: zone.zombieDifficulty?.E || 0,
              M: zone.zombieDifficulty?.M || 0,
              H: zone.zombieDifficulty?.H || 0,
            };
            
            // Set active zone
            if (zone.isActive) {
              setActiveZone(zone.name);
            }
          });
          
          setScores(newScores);
        }
      } catch (e) {
        console.error('Failed to fetch zones:', e);
      }
    };
    fetchZones();
  }, []);

  // Fetch teams and players on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsRes = await fetch('http://localhost:5000/api/teams');
        const teamsData = await teamsRes.json();
        
        const humanTeam = teamsData.find(t => t.faction === 'human');
        const zombieTeam = teamsData.find(t => t.faction === 'zombie');
        
        setTeams({ human: humanTeam, zombie: zombieTeam });

        if (humanTeam) {
          const humanPlayersRes = await fetch(`http://localhost:5000/api/teams/${humanTeam._id}/players`);
          const humanPlayersData = await humanPlayersRes.json();
          setPlayers(prev => ({ ...prev, human: humanPlayersData.map(p => ({ id: p._id, name: p.username })) }));
        }

        if (zombieTeam) {
          const zombiePlayersRes = await fetch(`http://localhost:5000/api/teams/${zombieTeam._id}/players`);
          const zombiePlayersData = await zombiePlayersRes.json();
          setPlayers(prev => ({ ...prev, zombie: zombiePlayersData.map(p => ({ id: p._id, name: p.username })) }));
        }
      } catch (err) {
        console.error('Failed to fetch teams/players:', err);
      }
    };

    fetchData();
  }, []);

  // Socket sync for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('admin:join');

    const onScoreUpdate = (data) => {
      // Sync scores from other admins or system
      if (data.team && data.zone && data.difficulty !== undefined) {
        console.log('Admin received score update:', {
          team: data.team,
          zone: data.zone,
          difficulty: data.difficulty,
          newScore: data.score
        });
        setScores(prev => {
          const oldScore = prev[data.team]?.[data.zone]?.[data.difficulty];
          console.log(`Admin updating ${data.team} ${data.zone} ${data.difficulty}: ${oldScore} -> ${data.score}`);
          const newScores = { ...prev };
          if (newScores[data.team]?.[data.zone]) {
            newScores[data.team][data.zone][data.difficulty] = data.score;
          }
          return newScores;
        });
      }
    };

    const onScoresReset = () => {
      setScores({
        human: {
          A: { E: 0, M: 0, H: 0 },
          B: { E: 0, M: 0, H: 0 },
          C: { E: 0, M: 0, H: 0 },
        },
        zombie: {
          A: { E: 0, M: 0, H: 0 },
          B: { E: 0, M: 0, H: 0 },
          C: { E: 0, M: 0, H: 0 },
        },
      });
    };
    
    const onZoneActivated = (data) => {
      if (data && data.name) {
        setActiveZone(data.name);
      }
    };

    socket.on('r2:score_update', onScoreUpdate);
    socket.on('r2:scores_reset', onScoresReset);
    socket.on('r2:zone_activated', onZoneActivated);

    // Listen for timer updates
    socket.on('r2:timer_update', (data) => {
      if (data && data.timeRemaining !== undefined) {
        setTimeRemaining(data.timeRemaining);
        setIsTimerRunning(data.isRunning);
      }
    });

    socket.on('r2:timer_finished', () => {
      setTimeRemaining(0);
      setIsTimerRunning(false);
    });

    return () => {
      socket.off('r2:score_update', onScoreUpdate);
      socket.off('r2:scores_reset', onScoresReset);
      socket.off('r2:zone_activated', onZoneActivated);
      socket.off('r2:timer_update');
      socket.off('r2:timer_finished');
    };
  }, [socket]);

  const zones = ['A', 'B', 'C'];
  const difficulties = ['E', 'M', 'H'];

  const handleIncrement = (team, zone, difficulty) => {
    setModalState({ isOpen: true, team, zone, difficulty });
  };

  const handleDecrement = (team, zone, difficulty) => {
    setScores((prev) => {
      const current = prev[team][zone][difficulty];
      if (current <= 0) return prev;

      const newScores = { ...prev };
      newScores[team][zone][difficulty] = current - 1;

      // Emit socket event
      if (socket) {
        socket.emit('r2:admin_update_score', {
          team,
          zone,
          difficulty,
          score: newScores[team][zone][difficulty],
          action: 'decrement',
        });
      }

      return newScores;
    });
  };

  const handlePlayerConfirm = (playerId) => {
    // Immediate guard check
    if (isProcessingRef.current) {
      console.log('⛔ Blocked duplicate call');
      return;
    }
    
    isProcessingRef.current = true;
    console.log(`🎯 Processing increment for playerId: ${playerId}`);
    
    const { team, zone, difficulty } = modalState;
    
    // Close modal first
    setModalState({ isOpen: false, team: null, zone: null, difficulty: null });

    // Get current score and increment
    const currentScore = scores[team][zone][difficulty];
    const newScore = currentScore + 1;
    
    console.log(`📊 Score change: ${team} ${zone} ${difficulty}: ${currentScore} → ${newScore}`);
    
    // Update local state
    setScores(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [zone]: {
          ...prev[team][zone],
          [difficulty]: newScore
        }
      }
    }));
    
    // Emit to server
    if (socket) {
      socket.emit('r2:admin_update_score', {
        team,
        zone,
        difficulty,
        score: newScore,
        action: 'increment',
        playerId,
      });
    }
    
    // Reset guard after delay
    setTimeout(() => {
      isProcessingRef.current = false;
      console.log('✅ Ready for next increment');
    }, 300);
  };

  const handleSabotage = (team) => {    soundManager.play('sabotage');    if (socket) {
      socket.emit('r2:admin_trigger_sabotage', { team });
    }
    alert(`Sabotage triggered for ${team === 'human' ? 'Humans' : 'Zombies'}!`);
  };
  
  const handleChangeActiveZone = (zoneName) => {
    if (socket) {
      soundManager.play('zoneActivated');
      console.log(`🎯 Changing active zone to: ${zoneName}`);
      socket.emit('admin:activate_zone', { zoneName });
      setActiveZone(zoneName);
    }
  };

  const handleResetAllScores = () => {
    if (!confirm('Are you sure you want to reset ALL scores? This cannot be undone.')) return;
    
    soundManager.play('reset');
    
    if (socket) {
      socket.emit('admin:reset_all_scores');
    }
    
    // Reset local state immediately
    setScores({
      human: {
        A: { E: 0, M: 0, H: 0 },
        B: { E: 0, M: 0, H: 0 },
        C: { E: 0, M: 0, H: 0 },
      },
      zombie: {
        A: { E: 0, M: 0, H: 0 },
        B: { E: 0, M: 0, H: 0 },
        C: { E: 0, M: 0, H: 0 },
      },
    });
  };

  const startRound2 = () => {
    if (socket) socket.emit('admin:start_round2');
  };

  const resetRound2 = () => {
    if (socket) socket.emit('admin:reset_round2');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#121010] text-white p-6 font-sans">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-widest uppercase text-[#f0c330] text-shadow-[2px_2px_#3f2a00]">
              OP Console - Round 2
            </h1>
            <p className="text-[#bfbfbf] mt-2 font-bold text-sm">Target: PVP Arena</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Sound Control */}
            <SoundControl />
            
            {/* Timer Display */}
            <div className="text-right px-6 py-2 bg-[#373737] border-2 border-black rounded-none shadow-[2px_2px_0_#000]">
              <div className={`text-3xl font-mono font-bold ${isTimerRunning ? 'text-[#5b8731]' : 'text-[#8b8b8b]'} text-shadow-[1px_1px_#000]`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-[#bfbfbf] uppercase tracking-wider font-bold">
                {isTimerRunning ? 'Clock Running' : 'Clock Stopped'}
              </div>
            </div>
            
            <button 
              onClick={startRound2} 
              disabled={isTimerRunning}
              className="px-6 py-2 bg-[#5b8731] border-b-4 border-black hover:border-b-2 active:border-b-0 active:translate-y-1 rounded-none font-bold transition uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_#000] text-white"
            >
              Start Game
            </button>
            <button 
              onClick={resetRound2} 
              className="px-6 py-2 bg-[#7d7d7d] border-b-4 border-black hover:border-b-2 active:border-b-0 active:translate-y-1 rounded-none font-bold transition uppercase tracking-wider shadow-[2px_2px_0_#000] text-white"
            >
              Reset Clock
            </button>
            <button onClick={handleResetAllScores} className="px-6 py-2 bg-[#ff3333] border-b-4 border-black hover:border-b-2 active:border-b-0 active:translate-y-1 rounded-none font-bold transition uppercase tracking-wider shadow-[2px_2px_0_#000] text-white">
              Wipe Data
            </button>
          </div>
        </div>
      </div>
      
      {/* Active Zone Control */}
      <div className="mb-8 mc-panel p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crosshair className="w-6 h-6 text-[#f0c330]" strokeWidth={2.5} />
            <div>
              <h2 className="text-xl font-bold uppercase text-[#f0c330] text-shadow-[1px_1px_#3f2a00]">Active Chunk Selection</h2>
              <p className="text-[#bfbfbf] text-sm font-bold">Selected chunk yields 1.5x Capture Points</p>
            </div>
          </div>
          <div className="flex gap-3">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => handleChangeActiveZone(zone)}
                className={`px-8 py-3 font-bold text-lg transition uppercase tracking-wider border-2 border-black shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none ${
                  activeZone === zone
                    ? 'bg-[#f0c330] text-black'
                    : 'bg-[#8b8b8b] text-[#333] hover:bg-[#a0a0a0]'
                }`}
              >
                Chunk {zone}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* HUMANS */}
        <div className="bg-[#3C8DAB]/20 border-4 border-[#3C8DAB] p-6 shadow-[4px_4px_0_#000]">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-[#3C8DAB]" strokeWidth={2.5} />
            <h2 className="text-2xl font-bold uppercase text-[#3C8DAB] text-shadow-[1px_1px_#000]">Humans</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone} className="space-y-4">
                <div className="text-center text-lg font-bold text-[#bfbfbf] uppercase tracking-widest text-shadow-[1px_1px_#000]">
                  Chunk {zone}
                </div>
                {difficulties.map((diff) => (
                  <ScoreCell
                    key={`${zone}-${diff}`}
                    zone={zone}
                    difficulty={diff}
                    score={scores.human[zone][diff]}
                    team="human"
                    onIncrement={() => handleIncrement('human', zone, diff)}
                    onDecrement={() => handleDecrement('human', zone, diff)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ZOMBIES */}
        <div className="bg-[#ff3333]/20 border-4 border-[#ff3333] p-6 shadow-[4px_4px_0_#000]">
          <div className="flex items-center gap-3 mb-6">
            <Skull className="w-6 h-6 text-[#ff3333]" strokeWidth={2.5} />
            <h2 className="text-2xl font-bold uppercase text-[#ff3333] text-shadow-[1px_1px_#000]">Zombies</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone} className="space-y-4">
                <div className="text-center text-lg font-bold text-[#bfbfbf] uppercase tracking-widest text-shadow-[1px_1px_#000]">
                  Chunk {zone}
                </div>
                {difficulties.map((diff) => (
                  <ScoreCell
                    key={`${zone}-${diff}`}
                    zone={zone}
                    difficulty={diff}
                    score={scores.zombie[zone][diff]}
                    team="zombie"
                    onIncrement={() => handleIncrement('zombie', zone, diff)}
                    onDecrement={() => handleDecrement('zombie', zone, diff)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sabotage Panel */}
      <div className="mc-panel p-6 border-2 border-[#f0c330]">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-[#f0c330]" strokeWidth={2.5} />
          <h2 className="text-2xl font-bold uppercase text-[#f0c330] text-shadow-[1px_1px_#3f2a00]">Creeper Trap Control</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleSabotage('human')}
            className="h-24 bg-[#3C8DAB]/20 border-2 border-[#3C8DAB] hover:bg-[#3C8DAB]/40 transition flex flex-col items-center justify-center gap-2 group shadow-[4px_4px_0_rgba(60,141,171,0.5)] active:translate-y-1 active:shadow-none"
          >
            <Users className="w-8 h-8 text-[#3C8DAB] group-hover:scale-110 transition" strokeWidth={2.5} />
            <span className="text-lg font-bold text-[#3C8DAB] uppercase tracking-wider text-shadow-[1px_1px_#000]">Ignite Human Trap</span>
          </button>
          <button
            onClick={() => handleSabotage('zombie')}
            className="h-24 bg-[#ff3333]/20 border-2 border-[#ff3333] hover:bg-[#ff3333]/40 transition flex flex-col items-center justify-center gap-2 group shadow-[4px_4px_0_rgba(255,51,51,0.5)] active:translate-y-1 active:shadow-none"
          >
            <Skull className="w-8 h-8 text-[#ff3333] group-hover:scale-110 transition" strokeWidth={2.5} />
            <span className="text-lg font-bold text-[#ff3333] uppercase tracking-wider text-shadow-[1px_1px_#000]">Ignite Zombie Trap</span>
          </button>
        </div>
      </div>

      {/* Player Selection Modal */}
      <PlayerModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        team={modalState.team}
        zone={modalState.zone}
        difficulty={modalState.difficulty}
        players={modalState.team ? players[modalState.team] : []}
        onConfirm={handlePlayerConfirm}
      />
    </div>
  );
};

export default Round2Admin;
