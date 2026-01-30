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
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-widest uppercase">Round 1 Admin</h1>
                    <p className="text-gray-400 mt-1">Managing: <span className="text-neonBlue font-bold">{lab?.name || `Lab ${labNum}`}</span></p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={startTimer} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition uppercase tracking-wider">
                        Start Timer
                    </button>
                    <button onClick={resetTimer} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition uppercase tracking-wider">
                        Reset Timer
                    </button>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex items-center gap-2 text-yellow-200 bg-yellow-900/20 border border-yellow-500/30 px-4 py-2 rounded inline-flex">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-sm">Per-lab control: PC A/B/C/D + lock</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
                {/* Left: PC controls */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4">PC Control Grid (10 PCs)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pcs.map((pc) => (
                            <div key={pc._id} className="bg-black/40 border border-gray-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="font-mono text-gray-300">PC-{String(pc.pcNumber).padStart(2, '0')}</div>
                                    <button
                                        onClick={() => toggleLock(pc)}
                                        className={`px-2 py-1 rounded border text-xs flex items-center gap-1 ${pc.status === 'locked' ? 'border-red-600/60 text-red-200 bg-red-900/20' : 'border-gray-700 text-gray-200 bg-gray-800/40'}`}
                                    >
                                        {pc.status === 'locked' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        {pc.status === 'locked' ? 'Locked' : 'Unlocked'}
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
                                                className={`h-10 rounded font-bold uppercase border transition active:scale-95 disabled:opacity-40 ${
                                                    isOn
                                                        ? 'bg-neonBlue/20 border-neonBlue text-neonBlue'
                                                        : 'bg-gray-900/30 border-gray-700 text-gray-300 hover:border-gray-500'
                                                }`}
                                            >
                                                {k}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-3 text-xs text-gray-400 flex justify-between">
                                    <span>Progress: <span className="font-mono text-white">{pc.progress}/4</span></span>
                                    <span className={`${pc.status === 'solved' ? 'text-green-300' : pc.status === 'locked' ? 'text-red-300' : 'text-gray-300'}`}>{pc.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Leaderboard */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
                    <h2 className="text-lg font-bold mb-4">Live Leaderboard (8 Labs)</h2>
                    <div className="space-y-2">
                        {sortedLeaderboard.map((row, idx) => (
                            <div
                                key={row.labNumber}
                                className={`flex items-center justify-between p-3 rounded border ${
                                    row.labNumber === labNum ? 'border-neonBlue/60 bg-neonBlue/10' : 'border-gray-800 bg-black/30'
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
                        {sortedLeaderboard.length === 0 && (
                            <div className="text-gray-500 text-sm">No leaderboard yet. Trigger `/api/seed` and refresh.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Round1Admin;
