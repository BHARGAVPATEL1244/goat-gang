'use client';

import React from 'react';
import { ArrowLeft, Crown, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface HeroSelectRosterProps {
    hoodName: string;
    leaderName: string;
    members: Member[];
    onBack: () => void;
}

export default function HeroSelectRoster({ hoodName, leaderName, members, onBack }: HeroSelectRosterProps) {
    const leader = members.find(m => m.role === 'Leader') || { name: leaderName, role: 'Leader' };
    const otherMembers = members.filter(m => m.role !== 'Leader');

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'CoLeader': return 'bg-orange-500/20 border-orange-500/50 text-orange-200';
            case 'Elder': return 'bg-purple-500/20 border-purple-500/50 text-purple-200';
            default: return 'bg-white/5 border-white/10 text-gray-300';
        }
    };

    return (
        <div className="w-full h-full bg-gray-900 text-white flex flex-col md:flex-row overflow-hidden relative">

            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />

            {/* LEFT SIDE: LEADER CARD (The "Boss") */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-1/3 bg-gradient-to-br from-gray-800 to-black border-r border-white/10 p-8 flex flex-col items-center justify-center relative z-10"
            >
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white uppercase font-bold tracking-widest text-xs transition-colors"
                >
                    <ArrowLeft size={16} /> Back to Select
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-lg">
                        {hoodName}
                    </h2>
                    <div className="w-24 h-2 bg-yellow-500 mx-auto mt-2" />
                </div>

                {/* Big Avatar / Model Placeholder */}
                <div className="w-64 h-64 bg-gray-700 rounded-full border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)] flex items-center justify-center mb-8 relative group">
                    {/* Static Image or Initial for now */}
                    <span className="text-8xl font-black text-white/10">{leader.name.substring(0, 1)}</span>
                    <Crown size={48} className="absolute -top-4 -right-4 text-yellow-400 drop-shadow-md animate-bounce" />
                </div>

                <div className="text-center">
                    <h3 className="text-gray-400 uppercase tracking-[0.2em] text-sm mb-2">Guild Master</h3>
                    <h1 className="text-4xl font-bold text-white">{leader.name}</h1>
                </div>
            </motion.div>

            {/* RIGHT SIDE: THE ROSTER (Scrollable List) */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full md:w-2/3 p-8 md:p-12 overflow-y-auto z-10"
            >
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black uppercase italic mb-8 border-b border-white/10 pb-4 flex items-center justify-between">
                        <span>Active Roster</span>
                        <span className="text-base not-italic font-mono text-gray-500 bg-gray-800 px-3 py-1 rounded">{members.length} Members</span>
                    </h2>

                    <div className="space-y-3">
                        {/* Co-Leaders & Elders First */}
                        {otherMembers.map((member, i) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className={`
                                    flex items-center justify-between p-4 rounded-lg border backdrop-blur-sm
                                    hover:scale-[1.01] transition-transform cursor-default
                                    ${getRoleColor(member.role)}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-black/30 flex items-center justify-center">
                                        {member.role === 'CoLeader' && <Shield size={20} />}
                                        {member.role === 'Elder' && <Shield size={16} />}
                                        {member.role === 'Member' && <User size={16} />}
                                    </div>
                                    <span className="font-bold text-lg">{member.name.replace(/\[.*?\]/g, '').trim()}</span>
                                </div>
                                <span className="font-mono text-xs uppercase tracking-widest opacity-60">{member.role}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
