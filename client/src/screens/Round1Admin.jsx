import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';

const Round1Admin = () => {
    const { labNumber } = useParams();
    const labNum = Number(labNumber);
    const { socket } = useGame();
    const [lab, setLab] = useState(null);
    const [pcs, setPcs] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        if (!socket) return;
        if (!Number.isFinite(labNum)) return;

        socket.emit('admin:join');
        socket.emit('r1:join_lab', { labNumber: labNum });
        socket.emit('r1:get_lab_data', { labNumber: labNum });
        socket.emit('r1:get_leaderboard');

        const onLabData = (data) => {
            setLab(data.lab);
            setPcs((data.pcs || []).slice().sort((a, b) => a.pcNumber - b.pcNumber));
        };
        const onPcUpdate = (payload) => {
            const updatedPc = payload?.pc ? payload.pc : payload;
            if (!updatedPc?._id) return;
            setPcs(prev => prev.map(pc => pc._id === updatedPc._id ? updatedPc : pc));
        };
        const onLeaderboard = (rows) => setLeaderboard(Array.isArray(rows) ? rows : []);

        socket.on('r1:lab_data', onLabData);
        socket.on('r1:pc_update', onPcUpdate);
        socket.on('r1:leaderboard', onLeaderboard);

        return () => {
            socket.off('r1:lab_data', onLabData);
            socket.off('r1:pc_update', onPcUpdate);
            socket.off('r1:leaderboard', onLeaderboard);
        };
    }, [socket, labNum]);

    const setStep = (pcId, stepKey, solved) => {
        if (!socket) return;
        socket.emit('r1:admin_set_pc_step', { pcId, stepKey, solved });
    };

    const toggleLock = (pc) => {
        if (!socket) return;
        const locked = pc.status !== 'locked';
        socket.emit('r1:admin_set_pc_lock', { pcId: pc._id, locked });
    };

    const sortedLeaderboard = useMemo(() => leaderboard.slice(), [leaderboard]);

    const startTimer = () => {
        if (socket) socket.emit('admin:start_round1');
    };

    const resetTimer = () => {
        if (socket) socket.emit('admin:reset_round1');
    };

    return (
        <div className="min-h-screen bg-[#121010] text-white p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-widest uppercase text-[#3C8DAB] text-shadow-[2px_2px_#204c5c]">OP Console - Round 1</h1>
                    <p className="text-[#bfbfbf] mt-1 font-bold text-shadow-[1px_1px_#000]">Server: <span className="text-[#f0c330] font-bold">Chunk {lab?.name || labNum}</span></p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={startTimer} className="px-6 py-2 bg-[#5b8731] border-b-4 border-black hover:border-b-2 active:border-b-0 active:translate-y-1 font-bold transition uppercase tracking-wider text-white shadow-[2px_2px_0_#000]">
                        Start Timer
                    </button>
                    <button onClick={resetTimer} className="px-6 py-2 bg-[#ff3333] border-b-4 border-black hover:border-b-2 active:border-b-0 active:translate-y-1 font-bold transition uppercase tracking-wider text-white shadow-[2px_2px_0_#000]">
                        Reset Timer
                    </button>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex items-center gap-2 text-[#f0c330] bg-[#3f2a00] border-2 border-[#f0c330] px-4 py-2 font-bold inline-flex">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-sm">Admin Access Level: 4 (Creative Mode)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                {/* Left: PC controls */}
                <div className="mc-panel p-6">
                    <h2 className="text-lg font-bold mb-4 text-[#3f3f3f] uppercase border-b-2 border-[#555] pb-2">Command Blocks Grid (10 PCs)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pcs.map((pc) => (
                            <div key={pc._id} className="bg-[#373737] border-2 border-black p-4 relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-mono text-[#3C8DAB] font-bold text-shadow-[1px_1px_#000]">CMD-{String(pc.pcNumber).padStart(2, '0')}</div>
                                    <button
                                        onClick={() => toggleLock(pc)}
                                        className={`px-2 py-1 border-2 font-black text-xs flex items-center gap-1 ${pc.status === 'locked' ? 'border-[#ff3333] text-[#ff3333] bg-[#3f0000]' : 'border-[#5b8731] text-[#5b8731] bg-[#1a2e05]'}`}
                                    >
                                        {pc.status === 'locked' ? <Lock className="w-4 h-4" strokeWidth={2.5} /> : <Unlock className="w-4 h-4" strokeWidth={2.5} />}
                                        {pc.status === 'locked' ? 'LOCKED' : 'OPEN'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    {(['a','b','c','d']).map((k) => {
                                        const isOn = !!pc?.steps?.[k];
                                        return (
                                            <button
                                                key={k}
                                                disabled={pc.status === 'locked'}
                                                onClick={() => setStep(pc._id, k, !isOn)}
                                                className={`h-10 font-bold uppercase border-2 transition active:scale-95 disabled:opacity-40 shadow-[2px_2px_0_#000] ${
                                                    isOn
                                                        ? 'bg-[#3C8DAB] border-black text-white'
                                                        : 'bg-[#8b8b8b] border-[#555] text-[#3f3f3f] hover:bg-[#a0a0a0]'
                                                }`}
                                            >
                                                {k}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-3 text-xs text-[#bfbfbf] flex justify-between font-bold">
                                    <span>XP: <span className="font-mono text-white">{pc.progress}/4</span></span>
                                    <span className={`uppercase font-black ${pc.status === 'solved' ? 'text-[#5b8731]' : pc.status === 'locked' ? 'text-[#ff3333]' : 'text-[#f0c330]'}`}>{pc.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Leaderboard */}
                <div className="mc-panel p-6">
                    <h2 className="text-lg font-bold mb-4 text-[#3f3f3f] uppercase border-b-2 border-[#555] pb-2">Server Rankings (8 Chunks)</h2>
                    <div className="space-y-2">
                        {sortedLeaderboard.map((row, idx) => (
                            <div
                                key={row.labNumber}
                                className={`flex items-center justify-between p-3 border-2 border-black ${
                                    row.labNumber === labNum ? 'bg-[#3C8DAB] text-white' : 'bg-[#c6c6c6] text-black'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 text-center font-mono font-bold">#{idx + 1}</div>
                                    <div>
                                        <div className="font-bold uppercase">Chunk {row.labNumber}</div>
                                        <div className="text-xs font-bold opacity-75">Unlocked: {row.totalSolvedPCs}/10</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-mono font-bold text-lg">{row.totalProgress}/40</div>
                                    <div className={`text-xs font-black uppercase ${row.infectionLevel === 'critical' ? 'text-[#ff3333]' : row.infectionLevel === 'medium' ? 'text-[#f0c330]' : 'text-[#5b8731]'}`}
                                        >{row.infectionLevel}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sortedLeaderboard.length === 0 && (
                            <div className="text-[#555] font-bold text-sm">No players connected...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Round1Admin;
