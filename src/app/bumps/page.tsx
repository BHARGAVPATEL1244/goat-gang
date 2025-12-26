'use client';

import React, { useEffect, useState } from 'react';
import { getTopBumpers } from '@/actions/bumps';
import { motion } from 'framer-motion';
import { Trophy, Clock, Zap } from 'lucide-react';
import Image from 'next/image';

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

    // Countdown Logic (Reset on 1st of Month)
    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            // Next month, date 1, 00:00:00
            const nextReset = new Date(currentYear, currentMonth + 1, 1, 0, 0, 0);

            const diff = nextReset.getTime() - now.getTime();

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        };

        const timer = setInterval(calculateTime, 60000); // Update every minute
        calculateTime();

        return () => clearInterval(timer);
    }, []);

    if (loading) {
        return (
            <div className="w-full h-screen bg-[#111] flex items-center justify-center text-white">
                <div className="text-2xl font-bold animate-pulse">Scanning server logs...</div>
            </div>
        );
    }

    const top3 = bumpers.slice(0, 3);
    const rest = bumpers.slice(3, 20); // Show top 20 list

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-20 overflow-y-auto">
            {/* Header */}
            <div className="max-w-4xl mx-auto text-center mb-12 mt-8">
                <motion.h1
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
                >
                    Monthly Bump Race
                </motion.h1>
                <div className="flex items-center justify-center gap-2 text-zinc-400 font-mono text-sm">
                    <Clock size={16} />
                    <span>RESETS IN: <span className="text-white font-bold">{timeLeft}</span></span>
                </div>
            </div>

            {/* Podium */}
            <div className="flex flex-col md:flex-row justify-center items-end gap-4 max-w-4xl mx-auto mb-16 h-[400px]">
                {/* 2nd Place */}
                {top3[1] && <PodiumStep bumper={top3[1]} rank={2} color="bg-zinc-400" height="h-48" delay={0.2} />}

                {/* 1st Place */}
                {top3[0] && <PodiumStep bumper={top3[0]} rank={1} color="bg-yellow-500" height="h-64" delay={0} />}

                {/* 3rd Place */}
                {top3[2] && <PodiumStep bumper={top3[2]} rank={3} color="bg-amber-700" height="h-32" delay={0.4} />}
            </div>

            {/* The Rest List */}
            <div className="max-w-2xl mx-auto space-y-3">
                {rest.map((bumper, i) => (
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + (i * 0.05) }}
                        key={bumper.user_id}
                        className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-zinc-500 font-mono w-6 text-right">0{i + 4}</span>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs border border-zinc-700">
                                {bumper.name[0]}
                            </div>
                            <span className="font-semibold">{bumper.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-yellow-500 font-mono">
                            <span className="text-lg font-bold">{bumper.count}</span>
                            <Zap size={14} className="fill-current" />
                        </div>
                    </motion.div>
                ))}

                {rest.length === 0 && top3.length === 0 && (
                    <div className="text-center text-zinc-500 py-10">
                        No bumps yet this month. Be the first!
                    </div>
                )}
            </div>
        </div>
    );
}

function PodiumStep({ bumper, rank, color, height, delay }: { bumper: Bumper, rank: number, color: string, height: string, delay: number }) {
    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay }}
            className="flex flex-col items-center flex-1 min-w-[100px]"
        >
            <div className="mb-3 text-center">
                <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full border-2 border-zinc-700 flex items-center justify-center text-xl font-bold mb-2">
                    {bumper.name[0]}
                </div>
                <div className="font-bold text-sm truncate max-w-[120px]">{bumper.name}</div>
                <div className="text-yellow-500 font-mono text-xs flex items-center justify-center gap-1">
                    {bumper.count} <Zap size={10} className="fill-current" />
                </div>
            </div>

            <div className={`w-full ${height} ${color} rounded-t-lg relative flex justify-center p-4 bg-opacity-90 backdrop-blur-sm shadow-2xl`}>
                <span className="text-4xl font-black text-black/50 absolute bottom-4">
                    {rank}
                </span>
                {rank === 1 && <Trophy className="text-yellow-900 w-8 h-8 animate-bounce" />}
            </div>
        </motion.div>
    );
}
