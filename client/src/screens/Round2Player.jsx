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
        <div className="min-h-screen bg-[#121010] text-white pb-20 font-sans">
             {/* Header */}
             <div className="p-6 bg-[#2c2c2c] border-b-4 border-black flex justify-between items-center sticky top-0 z-50">
                <div>
                     <h1 className="text-lg font-bold text-[#f0c330] uppercase text-shadow-[1px_1px_#3f2a00]">Chunk C Active</h1>
                     <p className={`text-xs uppercase font-bold text-shadow-[1px_1px_#000] ${team === 'human' ? 'text-[#3C8DAB]' : 'text-[#ff3333]'}`}>
                        Team: {team}
                     </p>
                </div>
                <div className="flex items-center gap-2 bg-[#373737] px-3 py-1 border-2 border-black">
                    <Trophy className="w-4 h-4 text-[#f0c330]" strokeWidth={2.5} />
                    <span className="font-mono font-bold text-white text-shadow-[1px_1px_#000]">{score}</span>
                </div>
             </div>

             {/* Content */}
             <div className="p-6 space-y-6">
                 {/* Question Buttons */}
                 <div className="grid grid-cols-1 gap-4">
                     <button 
                        onClick={() => submitAnswer('easy')}
                        className="h-24 bg-[#5b8731] border-b-4 border-black active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center transition shadow-[2px_2px_0_#000]"
                    >
                         <span className="text-xl font-bold text-white text-shadow-[1px_1px_#2f4a1a]">WOODEN TASK</span>
                         <span className="text-xs text-[#a4d476] font-bold">+10 XP</span>
                     </button>
                     
                     <button 
                         onClick={() => submitAnswer('medium')}
                         className="h-24 bg-[#7d7d7d] border-b-4 border-black active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center transition shadow-[2px_2px_0_#000]"
                    >
                         <span className="text-xl font-bold text-white text-shadow-[1px_1px_#3f3f3f]">STONE TASK</span>
                         <span className="text-xs text-[#dcdcdc] font-bold">+20 XP</span>
                     </button>
                     
                     <button 
                         onClick={() => submitAnswer('hard')}
                         className="h-24 bg-[#3C8DAB] border-b-4 border-black active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center transition shadow-[2px_2px_0_#000]"
                    >
                         <span className="text-xl font-bold text-white text-shadow-[1px_1px_#204c5c]">DIAMOND TASK</span>
                         <span className="text-xs text-[#b8e3f0] font-bold">+30 XP</span>
                     </button>
                 </div>

                 {/* Sabotage - Only shows if available */}
                 <div className="mt-8 pt-8 border-t-2 border-dashed border-[#555]">
                     <h3 className="text-[#bfbfbf] mb-4 text-sm uppercase center text-center font-bold">Combat Options</h3>
                     <button 
                        onClick={requestSabotage}
                        className="w-full py-4 bg-[#ff3333] border-b-4 border-black text-white font-bold flex items-center justify-center gap-2 hover:bg-[#b32424] transition shadow-[2px_2px_0_#000] active:translate-y-1 active:border-b-0"
                    >
                         <Zap className="w-5 h-5" strokeWidth={2.5} />
                         IGNITE TNT
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default Round2Player;
