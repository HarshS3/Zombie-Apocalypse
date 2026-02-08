import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { ShieldAlert, Terminal, Lock, Unlock, Biohazard } from 'lucide-react';
import { motion } from 'framer-motion';

const Round1Lab = () => {
    const { labId } = useParams();
    const labNumber = Number(labId);
  const { socket } = useGame();
  const [labData, setLabData] = useState(null);
  const [pcs, setPcs] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3000); // 50 mins

  useEffect(() => {
    if (!socket) return;

        socket.emit('r1:join_lab', { labNumber });
        socket.emit('r1:get_lab_data', { labNumber });
        socket.emit('r1:get_leaderboard');

        const onLabData = (data) => {
            setLabData(data.lab);
            setPcs((data.pcs || []).slice().sort((a, b) => a.pcNumber - b.pcNumber));
        };

        const onPcUpdate = (payload) => {
            const updatedPc = payload?.pc ? payload.pc : payload;
            if (!updatedPc?._id) return;
            setPcs(prev => prev.map(pc => pc._id === updatedPc._id ? updatedPc : pc));
        };

        const onLeaderboard = (rows) => setLeaderboard(Array.isArray(rows) ? rows : []);

        const onEscaped = () => {
            alert("LAB ESCAPED! PROCEED TO EXTRACTION POINT.");
        };

        socket.on('r1:lab_data', onLabData);
        socket.on('r1:pc_update', onPcUpdate);
        socket.on('r1:leaderboard', onLeaderboard);
        socket.on('r1:escaped', onEscaped);
    
    // Timer mockup
    const interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

        return () => {
            clearInterval(interval);
            socket.off('r1:lab_data', onLabData);
            socket.off('r1:pc_update', onPcUpdate);
            socket.off('r1:leaderboard', onLeaderboard);
            socket.off('r1:escaped', onEscaped);
        };

    }, [socket, labNumber]);

  // If no data yet, mock for UI dev
  const displayPcs = pcs.length > 0 ? pcs : Array(10).fill(null).map((_, i) => ({
    pcNumber: i + 1,
    status: i < 3 ? 'solved' : 'pending',
    progress: i === 3 ? 2 : 0,
    assignedAlphabet: i < 3 ? String.fromCharCode(65+i) : '?'
  }));
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen text-white p-8 relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 relative z-10">
            <div>
                <h1 className="text-4xl font-bold tracking-widest uppercase text-[#3C8DAB] text-shadow-[3px_3px_#204c5c] flex items-center gap-3">
                    <Terminal className="w-10 h-10" strokeWidth={2.5} />
                    Server Protocol
                </h1>
                <h2 className="text-2xl text-[#bfbfbf] mt-2 text-shadow-[2px_2px_#000]">Chunk: {labData?.name || `Lab ${labId}`}</h2>
            </div>
            <div className="text-right">
                <div className="text-6xl font-mono font-bold text-[#ff3333] tracking-tighter text-shadow-[4px_4px_#3f0000]">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="text-sm text-[#ff3333] uppercase tracking-widest mt-1 animate-pulse text-shadow-[1px_1px_#000]">
                    Server Shutdown Imminent
                </div>
            </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="mc-panel p-6">
                <h3 className="text-[#3f3f3f] text-lg font-bold uppercase mb-2">Server Integrity</h3>
                <div className="flex items-center gap-4 text-[#5b8731]">
                    <Biohazard className="w-8 h-8" strokeWidth={2.5} />
                    <span className="text-3xl font-bold text-shadow-[2px_2px_#2f4a1a]">STABLE</span>
                </div>
                <div className="w-full bg-[#373737] h-4 mt-4 border-2 border-black">
                    <div className="bg-[#5b8731] h-full w-[80%] border-r-2 border-[#8cc44e]"></div>
                </div>
            </div>
            
            <div className="mc-panel p-6">
                <h3 className="text-[#3f3f3f] text-lg font-bold uppercase mb-2">Decryption Progress</h3>
                <div className="text-4xl font-bold text-[#3C8DAB] text-shadow-[2px_2px_#204c5c]">
                    {displayPcs.filter(p => p.status === 'solved').length} / 10
                </div>
            </div>

             <div className="mc-panel p-6">
                <h3 className="text-[#3f3f3f] text-lg font-bold uppercase mb-2">Admin Code</h3>
                <div className="flex gap-2">
                    {displayPcs.filter(p => p.status === 'solved').map((p, i) => (
                        <div key={i} className="w-10 h-12 border-2 border-black flex items-center justify-center font-mono text-xl bg-[#3C8DAB] text-white text-shadow-[1px_1px_#000]">
                            {p.assignedAlphabet}
                        </div>
                    ))}
                    {Array(10 - displayPcs.filter(p => p.status === 'solved').length).fill(0).map((_, i) => (
                         <div key={i} className="w-10 h-12 border-2 border-[#555] flex items-center justify-center font-mono text-xl text-[#555] bg-[#8b8b8b]">
                            ?
                        </div>
                    ))}
                </div>
            </div>
        </div>

                {/* Main Layout: PC Grid + Leaderboard */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 relative z-10">
                    {/* PC Grid */}
                    <div className="grid grid-cols-5 gap-6">
                            {displayPcs.map((pc) => (
                                    <motion.div 
                                            key={pc.pcNumber}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`
                                                    relative p-6 border-4 transition-all duration-300 mc-panel
                                                    ${pc.status === 'solved' 
                                                            ? 'bg-[#5b8731] border-black scale-105' 
                                                            : pc.status === 'locked'
                                                                ? 'bg-[#3f0000] border-[#ff3333]'
                                                                : 'bg-[#c6c6c6] border-black'
                                                    }
                                            `}
                                    >
                                            <div className="flex justify-between items-start mb-4">
                                                    <span className={`font-mono text-xl ${pc.status === 'solved' ? 'text-white text-shadow-[1px_1px_#000]' : 'text-[#3f3f3f]'}`}>
                                                        Computer-{String(pc.pcNumber).padStart(2, '0')}
                                                    </span>
                                                    {pc.status === 'solved'
                                                        ? <Unlock className="text-white" strokeWidth={2.5} />
                                                        : <Lock className={pc.status === 'locked' ? 'text-[#ff3333]' : 'text-[#7d7d7d]'} strokeWidth={2.5} />}
                                            </div>
                      
                                            {/* Progress Bars for 4 questions */}
                                            <div className="flex gap-1 mb-4">
                                                    {[1, 2, 3, 4].map((q) => (
                                                            <div 
                                                                    key={q} 
                                                                    className={`h-3 flex-1 border border-black ${q <= pc.progress ? 'bg-[#3C8DAB]' : 'bg-[#555]'}`}
                                                            ></div>
                                                    ))}
                                            </div>

                                            <div className="text-center mt-2">
                                                    {pc.status === 'solved' ? (
                                                            <span className="text-4xl font-bold text-white font-mono text-shadow-[2px_2px_#000]">{pc.assignedAlphabet}</span>
                                                    ) : pc.status === 'locked' ? (
                                                            <span className="text-sm text-[#ff3333] font-bold uppercase tracking-widest text-shadow-[1px_1px_#3f0000]">Locked</span>
                                                    ) : (
                                                            <span className="text-sm text-[#555] font-bold uppercase tracking-widest">Pending</span>
                                                    )}
                                            </div>
                                    </motion.div>
                            ))}
                    </div>

                    {/* Right: Live Leaderboard */}
                    <div className="mc-panel p-6 text-black">
                        <h2 className="text-xl font-bold mb-4 uppercase border-b-2 border-[#555] pb-2">Server Rankings</h2>
                        <div className="space-y-2">
                            {leaderboard.map((row, idx) => (
                                <div
                                    key={row.labNumber}
                                    className={`flex items-center justify-between p-3 border-2 border-black ${
                                        row.labNumber === labNumber ? 'bg-[#3C8DAB] text-white' : 'bg-[#8b8b8b] text-black'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 text-center font-mono text-lg font-bold">#{idx + 1}</div>
                                        <div>
                                            <div className="font-bold text-lg">Chunk {row.labNumber}</div>
                                            <div className="text-sm opacity-80 uppercase">Unlocked: {row.totalSolvedPCs}/10</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-white">{row.totalProgress}/40</div>
                                        <div className={`text-xs uppercase ${row.infectionLevel === 'critical' ? 'text-red-300' : row.infectionLevel === 'medium' ? 'text-yellow-300' : 'text-green-300'}`}
                                            >{row.infectionLevel}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {leaderboard.length === 0 && (
                                <div className="text-gray-500 text-sm">Waiting for leaderboard…</div>
                            )}
                        </div>
                    </div>
                </div>
    </div>
  );
};

export default Round1Lab;
