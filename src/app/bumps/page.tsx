'use client';

import React, { useEffect, useState } from 'react';
import { getTopBumpers } from '@/actions/bumps';
import { motion } from 'framer-motion';
import { Trophy, Clock, Zap, Crown } from 'lucide-react';

type Bumper = {
    user_id: string;
    count: number;
    last_bumped_at: string;
    name: string;
};

export default function BumpsPage() {
    const [bumpers, setBumpers] = useState<Bumper[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        async function load() {
            const data = await getTopBumpers();
            setBumpers(data);
            setLoading(false);
        }
        load();
    }, []);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const nextReset = new Date(currentYear, currentMonth + 1, 1, 0, 0, 0);

            const diff = nextReset.getTime() - now.getTime();

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };

        const timer = setInterval(calculateTime, 60000);
        calculateTime();
        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <div className="w-full h-screen bg-[#050505] flex items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-yellow-500">🐐</div>
                </div>
            </div>
        );
    }

    const top3 = bumpers.slice(0, 3);
    const rest = bumpers.slice(3, 50);

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative font-sans selection:bg-yellow-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 pb-20 pt-12">

                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono text-zinc-400 mb-2"
                    >
                        <Clock size={12} className="text-yellow-500" />
                        <span>RESETS IN: <span className="text-yellow-400 font-bold">{timeLeft}</span></span>
                    </motion.div>

                    <motion.h1
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-6xl md:text-7xl font-black bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent tracking-tight"
                    >
                        MONTHLY BUMP
                    </motion.h1>
                    <p className="text-zinc-500 text-lg max-w-md mx-auto">
                        Compete for the crown. Top bumpers get automated rewards and eternal glory.
                    </p>
                </div>

                {/* Podium */}
                <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-24 min-h-[450px]">
                    {/* 2nd Place */}
                    {top3[1] && <GlassPodium bumper={top3[1]} rank={2} color="from-zinc-300 to-zinc-500" height="h-[320px]" delay={0.2} />}

                    {/* 1st Place */}
                    {top3[0] && <GlassPodium bumper={top3[0]} rank={1} color="from-yellow-300 via-yellow-500 to-amber-600" height="h-[400px]" delay={0} isWinner />}

                    {/* 3rd Place */}
                    {top3[2] && <GlassPodium bumper={top3[2]} rank={3} color="from-amber-700 to-amber-900" height="h-[280px]" delay={0.4} />}
                </div>

                {/* Leaderboard List */}
                <div className="max-w-3xl mx-auto space-y-3">
                    <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4 pl-4">Runner Ups</div>
                    {rest.map((bumper, i) => (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 + (i * 0.03) }}
                            key={bumper.user_id}
                            className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all backdrop-blur-sm"
                        >
                            <div className="flex items-center gap-6">
                                <span className="text-zinc-500 font-mono w-6 text-right group-hover:text-white transition-colors">0{i + 4}</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-sm font-bold border border-white/10 shadow-inner">
                                        {bumper.name[0].toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{bumper.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full border border-white/5">
                                <span className="text-yellow-500 font-bold font-mono">{bumper.count}</span>
                                <Zap size={14} className="text-yellow-500 fill-yellow-500" />
                            </div>
                        </motion.div>
                    ))}

                    {rest.length === 0 && top3.length === 0 && (
                        <div className="text-center text-zinc-600 py-10 font-mono text-sm border border-dashed border-zinc-800 rounded-xl">
                            No data for this month yet. Be the first to BUMP!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function GlassPodium({ bumper, rank, color, height, delay, isWinner = false }: { bumper: Bumper, rank: number, color: string, height: string, delay: number, isWinner?: boolean }) {
    return (
        <motion.div
            initial={{ height: "100px", opacity: 0 }}
            animate={{ height, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay }}
            className={`relative flex flex-col items-center flex-1 min-w-[140px] md:min-w-[200px] rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-xl shadow-2xl overflow-hidden group ${isWinner ? 'ring-1 ring-yellow-500/50 shadow-yellow-900/20' : ''}`}
        >
            {/* Glow Effect for Winner */}
            {isWinner && (
                <div className="absolute inset-0 bg-yellow-500/10 blur-[50px] pointer-events-none" />
            )}

            {/* Content Container (Pushed to bottom) */}
            <div className="absolute bottom-0 w-full p-6 flex flex-col items-center z-10">
                {/* Rank Badge */}
                <div className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b ${color} opacity-80 mb-4`}>
                    {rank}
                </div>

                {/* Avatar */}
                <div className={`relative mb-4 ${isWinner ? 'scale-110' : ''} transition-transform duration-500 group-hover:scale-110`}>
                    <div className={`w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-bold border-2 ${isWinner ? 'border-yellow-500 text-yellow-500' : 'border-zinc-700 text-zinc-400'} shadow-lg z-10 relative`}>
                        {bumper.name[0].toUpperCase()}
                    </div>
                    {isWinner && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-lg animate-bounce">
                            <Crown size={32} fill="currentColor" />
                        </div>
                    )}
                </div>

                {/* Name */}
                <div className="font-bold text-lg text-white mb-1 text-center truncate w-full px-2">
                    {bumper.name}
                </div>

                {/* Score */}
                <div className="flex items-center gap-1.5 text-xs font-mono bg-black/40 px-3 py-1 rounded-full border border-white/10">
                    <span className="text-yellow-400 font-bold text-base">{bumper.count}</span>
                    <span className="text-zinc-500 uppercase tracking-wider">Bumps</span>
                </div>
            </div>

            {/* Decorative background lines */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 mix-blend-overlay"></div>
        </motion.div>
    );
}
