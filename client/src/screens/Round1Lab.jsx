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
    <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neonBlue to-neonRed"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-12 relative z-10">
            <div>
                <h1 className="text-4xl font-bold tracking-widest uppercase text-neonBlue flex items-center gap-3">
                    <Terminal className="w-10 h-10" />
                    Lab Breach Protocol
                </h1>
                <h2 className="text-2xl text-gray-400 mt-2">Sector: {labData?.name || `Lab ${labId}`}</h2>
            </div>
            <div className="text-right">
                <div className="text-6xl font-mono font-bold text-red-500 tracking-tighter shadow-red-500/50 drop-shadow-lg">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <div className="text-sm text-red-400 uppercase tracking-widest mt-1 animate-pulse">
                    Virus Breach Imminent
                </div>
            </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900/80 border border-gray-700 p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm uppercase mb-2">Virus Integrity</h3>
                <div className="flex items-center gap-4 text-green-400">
                    <Biohazard className="w-8 h-8" />
                    <span className="text-2xl font-bold">STABLE</span>
                </div>
                <div className="w-full bg-gray-800 h-2 mt-4 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[80%]"></div>
                </div>
            </div>
            
            <div className="bg-gray-900/80 border border-t border-neonBlue p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm uppercase mb-2">Decryption Progress</h3>
                <div className="text-4xl font-bold text-white">
                    {displayPcs.filter(p => p.status === 'solved').length} / 10
                </div>
            </div>

             <div className="bg-gray-900/80 border border-t border-neonRed p-6 rounded-lg backdrop-blur-sm">
                <h3 className="text-gray-400 text-sm uppercase mb-2">Escape Code</h3>
                <div className="flex gap-2">
                    {displayPcs.filter(p => p.status === 'solved').map((p, i) => (
                        <div key={i} className="w-8 h-10 border border-neonBlue/50 flex items-center justify-center font-mono text-xl bg-neonBlue/10">
                            {p.assignedAlphabet}
                        </div>
                    ))}
                    {Array(10 - displayPcs.filter(p => p.status === 'solved').length).fill(0).map((_, i) => (
                         <div key={i} className="w-8 h-10 border border-gray-700 flex items-center justify-center font-mono text-xl text-gray-600">
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
                                                    relative p-6 rounded-xl border-2 transition-all duration-300
                                                    ${pc.status === 'solved' 
                                                            ? 'bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                                                            : pc.status === 'locked'
                                                                ? 'bg-red-900/10 border-red-800/60'
                                                                : 'bg-gray-900/50 border-gray-800'
                                                    }
                                            `}
                                    >
                                            <div className="flex justify-between items-start mb-4">
                                                    <span className="font-mono text-lg text-gray-400">PC-{String(pc.pcNumber).padStart(2, '0')}</span>
                                                    {pc.status === 'solved'
                                                        ? <Unlock className="text-green-500" />
                                                        : <Lock className={pc.status === 'locked' ? 'text-red-400' : 'text-red-500/50'} />}
                                            </div>
                      
                                            {/* Progress Bars for 4 questions */}
                                            <div className="flex gap-2 mb-4">
                                                    {[1, 2, 3, 4].map((q) => (
                                                            <div 
                                                                    key={q} 
                                                                    className={`h-2 flex-1 rounded-full ${q <= pc.progress ? 'bg-neonBlue shadow-[0_0_8px_#00f3ff]' : 'bg-gray-800'}`}
                                                            ></div>
                                                    ))}
                                            </div>

                                            <div className="text-center mt-2">
                                                    {pc.status === 'solved' ? (
                                                            <span className="text-4xl font-bold text-green-400 font-mono">{pc.assignedAlphabet}</span>
                                                    ) : pc.status === 'locked' ? (
                                                            <span className="text-xs text-red-300 uppercase tracking-widest">Locked</span>
                                                    ) : (
                                                            <span className="text-xs text-gray-500 uppercase tracking-widest">Pending</span>
                                                    )}
                                            </div>
                                    </motion.div>
                            ))}
                    </div>

                    {/* Right: Live Leaderboard */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-bold mb-4">Live Leaderboard</h2>
                        <div className="space-y-2">
                            {leaderboard.map((row, idx) => (
                                <div
                                    key={row.labNumber}
                                    className={`flex items-center justify-between p-3 rounded border ${
                                        row.labNumber === labNumber ? 'border-neonBlue/60 bg-neonBlue/10' : 'border-gray-800 bg-black/30'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 text-center font-mono text-gray-400">#{idx + 1}</div>
                                        <div>
                                            <div className="font-semibold">Lab {row.labNumber}</div>
                                            <div className="text-xs text-gray-500">Solved PCs: {row.totalSolvedPCs}/10</div>
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
