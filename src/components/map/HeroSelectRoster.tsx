'use client';

import React from 'react';
import { ArrowLeft, Crown, Shield, User } from 'lucide-react';
import { m as motion } from 'framer-motion';
import { parseUser } from '@/utils/nameParser';

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface HeroSelectRosterProps {
    hoodName: string;
    leaderName: string;
    leaderId?: string; // Optional for backward compat, but we'll pass it
    hoodImage?: string;
    members: Member[];
    onBack: () => void;
}

export default function HeroSelectRoster({ hoodName, leaderName, leaderId, hoodImage, members, onBack }: HeroSelectRosterProps) {
    // Determine Leader logic: Prioritize the passed 'leaderName' prop (source of truth from map_districts)
    // accessible from the neighborhood card. The members list might have inconsistencies or multiple leaders in rare cases.
    const leaderRawName = leaderName;
    const { cleanName: leaderClean, level: leaderLevel } = parseUser(leaderRawName);

    // Filter out leader from the list if already shown on the left
    // Logic: If members list contains the leader, exclude them from the right side list by ID if available, else name
    const otherMembers = members
        .filter(m => {
            if (leaderId) return m.id !== leaderId;
            return m.role !== 'Leader' && m.name !== leaderName;
        })
        .map(m => ({ ...m, ...parseUser(m.name) }))
        .sort((a, b) => {
            // Sort by Role Priority
            const rolePriority: any = { 'CoLeader': 1, 'Elder': 2, 'Member': 3 };
            return (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99);
        });

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
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-lg break-words w-min mx-auto leading-tight px-4 py-2">
                        {hoodName}
                    </h2>
                    <div className="w-24 h-2 bg-yellow-500 mx-auto mt-2" />
                </div>

                {/* Big Avatar */}
                <div className="w-48 h-48 md:w-64 md:h-64 mb-8 relative group">
                    {/* Image Container (Clipped) */}
                    <div className="w-full h-full rounded-full border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)] overflow-hidden bg-gray-700 flex items-center justify-center">
                        {hoodImage ? (
                            <img src={hoodImage} alt={hoodName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-6xl md:text-8xl font-black text-white/10">{leaderClean.substring(0, 1)}</span>
                        )}
                    </div>

                    {/* Crown (Outside Clip) */}
                    <Crown size={48} className="absolute -top-2 -right-2 text-yellow-400 drop-shadow-md animate-bounce z-20" />
                </div>

                <div className="text-center">
                    <h3 className="text-gray-400 uppercase tracking-[0.2em] text-sm mb-2">Hood Leader</h3>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{leaderClean}</h1>

                    {/* Leader Level Display */}
                    {leaderLevel && (
                        <div className="inline-flex items-center justify-center bg-gray-900 border border-yellow-500/30 px-6 py-2 rounded-lg mt-4 shadow-lg backdrop-blur-sm group-hover:border-yellow-500/60 transition-colors">
                            <span className="text-yellow-500 font-black text-sm tracking-widest mr-2">LEVEL</span>
                            <span className="text-white font-mono font-bold text-lg">{leaderLevel}</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* RIGHT SIDE: THE ROSTER (Scrollable List) */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full md:w-2/3 p-6 md:p-12 overflow-y-auto z-10"
            >
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-black uppercase italic mb-8 border-b border-white/10 pb-4 flex items-center justify-between">
                        <span>Active Members</span>
                        <span className="text-base not-italic font-mono text-gray-500 bg-gray-800 px-3 py-1 rounded">{members.length} Members</span>
                    </h2>

                    <div className="space-y-3 pb-20">
                        {/* Co-Leaders & Elders First */}
                        {otherMembers.map((member, i) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className={`
                                    flex items-center justify-between p-4 rounded-lg border backdrop-blur-sm
                                    hover:bg-white/5 transition-colors cursor-default group
                                    ${getRoleColor(member.role)}
                                `}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    {/* Role Icon */}
                                    <div className="w-10 h-10 rounded bg-black/30 flex items-center justify-center flex-shrink-0">
                                        {member.role === 'CoLeader' && <Shield size={20} />}
                                        {member.role === 'Elder' && <Shield size={16} />}
                                        {member.role === 'Member' && <User size={16} />}
                                    </div>

                                    {/* Level Box (Before Name) */}
                                    {member.level && (
                                        <div className="w-14 h-8 flex items-center justify-center bg-black/40 border border-white/10 rounded text-xs font-mono font-bold text-gray-400">
                                            {member.level}
                                        </div>
                                    )}

                                    {/* Name */}
                                    <span className="font-bold text-lg truncate">{member.cleanName}</span>
                                </div>

                                <span className="font-mono text-xs uppercase tracking-widest opacity-60 ml-4 hidden sm:block">
                                    {member.role === 'CoLeader' ? 'Co-Leader' : member.role}
                                </span>
                            </motion.div>
                        ))}

                        {otherMembers.length === 0 && (
                            <div className="text-center text-gray-500 py-10 font-mono">
                                No other members found.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
