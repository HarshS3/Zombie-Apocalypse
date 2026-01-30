import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Zap, AlertTriangle } from 'lucide-react';

const Round2Player = () => {
    const { socket } = useGame();
    // Team can be set via query param or login
    const [team, setTeam] = useState('human'); 
    const [activeTab, setActiveTab] = useState('solve');
    const [score, setScore] = useState(0);

    const submitAnswer = (difficulty) => {
        // Just mock emitting score for now
        const points = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
        setScore(curr => curr + points);
        if(socket) {
            socket.emit('r2:submit_score', { 
                userId: 'p1', 
                team: team, 
                points: points, 
                zoneId: 'dummy_zone_id' // Needs real zone ID from context
            });
        }
    };

    const requestSabotage = () => {
        if(socket) socket.emit('r2:request_sabotage', { teamId: team });
        alert('Sabotage Requested!');
    };

    return (
        <div className="min-h-screen bg-black text-gray-100 pb-20">
             {/* Header */}
             <div className="p-6 bg-gray-900 border-b border-gray-800 flex justify-between items-center sticky top-0 z-50">
                <div>
                     <h1 className="text-lg font-bold">Zone C Active</h1>
                     <p className={`text-xs uppercase ${team === 'human' ? 'text-neonBlue' : 'text-neonRed'}`}>
                        Team: {team}
                     </p>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="font-mono font-bold">{score}</span>
                </div>
             </div>

             {/* Content */}
             <div className="p-6 space-y-6">
                 {/* Question Buttons */}
                 <div className="grid grid-cols-1 gap-4">
                     <button 
                        onClick={() => submitAnswer('easy')}
                        className="h-24 rounded-xl bg-green-900/20 border-2 border-green-500/50 flex flex-col items-center justify-center active:scale-95 transition"
                    >
                         <span className="text-xl font-bold text-green-400">EASY CODE</span>
                         <span className="text-xs text-green-600">+10 Points</span>
                     </button>
                     
                     <button 
                         onClick={() => submitAnswer('medium')}
                         className="h-24 rounded-xl bg-yellow-900/20 border-2 border-yellow-500/50 flex flex-col items-center justify-center active:scale-95 transition"
                    >
                         <span className="text-xl font-bold text-yellow-400">MEDIUM LOGIC</span>
                         <span className="text-xs text-yellow-600">+20 Points</span>
                     </button>
                     
                     <button 
                         onClick={() => submitAnswer('hard')}
                         className="h-24 rounded-xl bg-red-900/20 border-2 border-red-500/50 flex flex-col items-center justify-center active:scale-95 transition"
                    >
                         <span className="text-xl font-bold text-red-500">HARD ALGO</span>
                         <span className="text-xs text-red-600">+30 Points</span>
                     </button>
                 </div>

                 {/* Sabotage - Only shows if available */}
                 <div className="mt-8 pt-8 border-t border-gray-800">
                     <h3 className="text-gray-400 mb-4 text-sm uppercase center text-center">Tactical Options</h3>
                     <button 
                        onClick={requestSabotage}
                        className="w-full py-4 bg-purple-900/30 border border-purple-500 text-purple-300 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-900/50 transition"
                    >
                         <Zap className="w-5 h-5" />
                         INITIATE SABOTAGE
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default Round2Player;
