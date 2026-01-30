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
  const teamColor = team === 'human' ? 'text-neonBlue' : 'text-neonRed';
  const teamBorder = team === 'human' ? 'border-neonBlue/30' : 'border-neonRed/30';

  return (
    <div className={`bg-black/40 border ${teamBorder} rounded-lg p-4 flex flex-col items-center justify-center gap-3`}>
      <div className="text-xs text-gray-500 uppercase tracking-widest font-mono">
        {zone} • {difficulty === 'E' ? 'Easy' : difficulty === 'M' ? 'Med' : 'Hard'}
      </div>
      <div className={`text-4xl font-bold ${teamColor} font-mono`}>{score}</div>
      <div className="flex gap-2">
        <button
          onClick={onDecrement}
          className="w-10 h-10 border border-gray-700 rounded-lg hover:bg-gray-800 transition flex items-center justify-center"
          disabled={score <= 0}
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={onIncrement}
          className={`w-10 h-10 border ${teamBorder} ${team === 'human' ? 'hover:bg-neonBlue/10' : 'hover:bg-neonRed/10'} rounded-lg transition flex items-center justify-center`}
        >
          <Plus className="w-4 h-4" />
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
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonRed">
              War Room Control
            </h1>
            <p className="text-gray-500 mt-2 font-mono text-sm">Round 2 • Admin Panel</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Sound Control */}
            <SoundControl />
            
            {/* Timer Display */}
            <div className="text-right px-6 py-2 bg-black/40 border border-gray-700 rounded-lg">
              <div className={`text-3xl font-mono font-bold ${isTimerRunning ? 'text-green-400' : 'text-gray-400'}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                {isTimerRunning ? 'Running' : 'Stopped'}
              </div>
            </div>
            
            <button 
              onClick={startRound2} 
              disabled={isTimerRunning}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Round 2
            </button>
            <button 
              onClick={resetRound2} 
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition uppercase tracking-wider"
            >
              Reset Timer
            </button>
            <button onClick={handleResetAllScores} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition uppercase tracking-wider">
              Reset All Scores
            </button>
          </div>
        </div>
      </div>
      
      {/* Active Zone Control */}
      <div className="mb-8 bg-gray-900/40 border border-yellow-400/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crosshair className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-black uppercase text-yellow-400">Active Zone</h2>
              <p className="text-gray-500 text-sm">Selected zone receives 1.5x domination time</p>
            </div>
          </div>
          <div className="flex gap-3">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => handleChangeActiveZone(zone)}
                className={`px-8 py-3 rounded-lg font-bold text-lg transition uppercase tracking-wider ${
                  activeZone === zone
                    ? 'bg-yellow-400 text-black border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
                    : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-yellow-400/50'
                }`}
              >
                Zone {zone}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* HUMANS */}
        <div className="bg-gray-900/40 border border-neonBlue/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-neonBlue" />
            <h2 className="text-2xl font-black uppercase text-neonBlue">Humans</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone} className="space-y-4">
                <div className="text-center text-lg font-bold text-gray-400 uppercase tracking-widest">
                  Zone {zone}
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
        <div className="bg-gray-900/40 border border-neonRed/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skull className="w-6 h-6 text-neonRed" />
            <h2 className="text-2xl font-black uppercase text-neonRed">Zombies</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone} className="space-y-4">
                <div className="text-center text-lg font-bold text-gray-400 uppercase tracking-widest">
                  Zone {zone}
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
      <div className="bg-gray-900/40 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-black uppercase text-yellow-400">Sabotage Control</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleSabotage('human')}
            className="h-24 bg-neonBlue/10 border-2 border-neonBlue rounded-xl hover:bg-neonBlue/20 transition flex flex-col items-center justify-center gap-2 group"
          >
            <Users className="w-8 h-8 text-neonBlue group-hover:scale-110 transition" />
            <span className="text-lg font-bold text-neonBlue uppercase tracking-wider">Trigger Human Sabotage</span>
          </button>
          <button
            onClick={() => handleSabotage('zombie')}
            className="h-24 bg-neonRed/10 border-2 border-neonRed rounded-xl hover:bg-neonRed/20 transition flex flex-col items-center justify-center gap-2 group"
          >
            <Skull className="w-8 h-8 text-neonRed group-hover:scale-110 transition" />
            <span className="text-lg font-bold text-neonRed uppercase tracking-wider">Trigger Zombie Sabotage</span>
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
