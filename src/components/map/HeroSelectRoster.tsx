'use client';

import React from 'react';
import { ArrowLeft, Crown, Shield, User } from 'lucide-react';
import { m as motion } from 'framer-motion';
import { parseUser } from '@/utils/nameParser';
import { useSwipeable } from 'react-swipeable';
import { useHaptic } from '@/hooks/useHaptic';

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface HeroSelectRosterProps {
    hoodName: string;
    leaderName: string;
    leaderId?: string;
    hoodImage?: string;
    members: Member[];
    onBack: () => void;
    onNext: () => void;
    onPrev: () => void;
    color?: string;
}

export default function HeroSelectRoster({ hoodName, leaderName, leaderId, hoodImage, members, onBack, onNext, onPrev, color }: HeroSelectRosterProps) {
    // Determine Leader logic: Prioritize the passed 'leaderName' prop (source of truth from map_districts)
    // accessible from the neighborhood card. The members list might have inconsistencies or multiple leaders in rare cases.
    const leaderRawName = leaderName;
    const { cleanName: leaderClean, level: leaderLevel } = parseUser(leaderRawName);
    const activeColor = color || '#EAB308'; // Default Yellow
    const { trigger: haptic } = useHaptic();

    // Swipe Handlers
    const handlers = useSwipeable({
        onSwipedLeft: () => {
            haptic('medium');
            onNext();
        },
        onSwipedRight: () => {
            haptic('medium');
            onPrev();
        },
        trackMouse: false
    });

    // Filter out leader from the list if already shown on the left
    // Logic: If members list contains the leader, exclude them from the right side list by ID if available, else name
    // Logic: If members list contains the leader, exclude them from the right side list by ID if available, else name
    // We compare CLEAN names to be robust against raw/clean mismatches
    const otherMembers = members
        .filter(m => {
            // 1. Strict ID Check
            if (leaderId && m.id === leaderId) return false;

            // 2. Role Check
            if (m.role === 'Leader') return false;

            // 3. Name Check (Clean vs Clean)
            // Use local parsing to ensure we compare apples to apples
            const memberClean = parseUser(m.name).cleanName;
            return memberClean !== leaderClean;
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
        <div
            {...handlers}
            className="w-full h-full bg-gray-900 text-white flex flex-col md:flex-row overflow-hidden relative"
        >

            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />

            {/* LEFT SIDE: LEADER CARD (The "Boss") */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-1/3 bg-gradient-to-br from-gray-800 to-black border-b md:border-b-0 md:border-r border-white/10 p-6 md:p-8 flex flex-col items-center justify-center relative z-10 shrink-0"
            >
                <button
                    onClick={() => { haptic('light'); onBack(); }}
                    className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center gap-2 text-gray-400 hover:text-white uppercase font-bold tracking-widest text-[10px] md:text-xs transition-colors bg-black/20 p-2 rounded-full md:bg-transparent md:p-0 z-50 backdrop-blur-sm"
                >
                    <ArrowLeft size={16} /> <span className="hidden xs:inline">Back</span>
                </button>

                <div className="text-center mb-6 md:mb-10 w-full px-4 pt-8 md:pt-0">
                    <h2
                        className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text drop-shadow-lg break-words w-full mx-auto leading-tight px-2"
                        style={{
                            backgroundImage: `linear-gradient(to bottom, #FFF, ${activeColor})`
                        }}
                    >
                        {hoodName}
                    </h2>
                    <div
                        className="w-16 md:w-24 h-1.5 md:h-2 mx-auto mt-2"
                        style={{ backgroundColor: activeColor, boxShadow: `0 0 10px ${activeColor}` }}
                    />
                </div>

                {/* Big Avatar */}
                <div className="w-32 h-32 md:w-64 md:h-64 mb-6 md:mb-8 relative group shrink-0">
                    {/* Image Container (Clipped) */}
                    <div
                        className="w-full h-full rounded-full border-4 overflow-hidden bg-gray-700 flex items-center justify-center transition-all duration-500"
                        style={{
                            borderColor: activeColor,
                            boxShadow: `0 0 50px ${activeColor}40`
                        }}
                    >
                        {hoodImage ? (
                            <img src={hoodImage} alt={hoodName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl md:text-8xl font-black text-white/10">{leaderClean.substring(0, 1)}</span>
                        )}
                    </div>

                    {/* Crown (Outside Clip) */}
                    <Crown size={32} className="absolute -top-1 -right-1 md:-top-2 md:-right-2 drop-shadow-md animate-bounce z-20 md:w-12 md:h-12" style={{ color: activeColor }} />
                </div>

                <div className="text-center">
                    <h3 className="text-gray-400 uppercase tracking-[0.2em] text-xs md:text-sm mb-1 md:mb-2">Hood Leader</h3>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 truncate max-w-[300px]">{leaderClean}</h1>

                    {/* Leader Level Display */}
                    {leaderLevel && (
                        <div
                            className="inline-flex items-center justify-center bg-gray-900 border px-4 py-1.5 md:px-6 md:py-2 rounded-lg mt-2 md:mt-4 shadow-lg backdrop-blur-sm transition-colors"
                            style={{ borderColor: `${activeColor}40` }}
                        >
                            <span className="font-black text-xs md:text-sm tracking-widest mr-2" style={{ color: activeColor }}>LEVEL</span>
                            <span className="text-white font-mono font-bold text-base md:text-lg">{leaderLevel}</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* RIGHT SIDE: THE ROSTER (Scrollable List) */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full md:w-2/3 p-4 md:p-12 overflow-y-auto z-10 bg-gray-900/50 md:bg-transparent"
            >
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-xl md:text-3xl font-black uppercase italic mb-6 border-b border-white/10 pb-4 flex items-center justify-between sticky top-0 bg-gray-900/95 md:bg-transparent z-20 py-2 backdrop-blur-md md:backdrop-filter-none">
                        <span>Active Members</span>
                        <span className="text-xs md:text-base not-italic font-mono text-gray-500 bg-gray-800 px-2 py-1 md:px-3 rounded">{members.length} Members</span>
                    </h2>

                    <div className="space-y-2 md:space-y-3 pb-20">
                        {/* Co-Leaders & Elders First */}
                        {otherMembers.map((member, i) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
                                className={`
                                    flex items-center justify-between p-3 md:p-4 rounded-lg border backdrop-blur-sm
                                    hover:bg-white/5 transition-colors cursor-default group
                                    ${getRoleColor(member.role)}
                                `}
                            >
                                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                                    {/* Role Icon */}
                                    <div className="w-8 h-8 md:w-10 md:h-10 rounded bg-black/30 flex items-center justify-center flex-shrink-0">
                                        {member.role === 'CoLeader' && <Shield size={16} className="md:w-5 md:h-5" />}
                                        {member.role === 'Elder' && <Shield size={14} className="md:w-4 md:h-4" />}
                                        {member.role === 'Member' && <User size={14} className="md:w-4 md:h-4" />}
                                    </div>

                                    {/* Level Box (Before Name) */}
                                    {member.level && (
                                        <div className="w-10 h-6 md:w-14 md:h-8 flex items-center justify-center bg-black/40 border border-white/10 rounded text-[10px] md:text-xs font-mono font-bold text-gray-400 shrink-0">
                                            {member.level}
                                        </div>
                                    )}

                                    {/* Name */}
                                    <span className="font-bold text-sm md:text-lg truncate">{member.cleanName}</span>
                                </div>

                                <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest opacity-60 ml-2 md:ml-4 whitespace-nowrap">
                                    {member.role === 'CoLeader' ? 'Co-Leader' : member.role}
                                </span>
                            </motion.div>
                        ))}

                        {otherMembers.length === 0 && (
                            <div className="text-center text-gray-500 py-10 font-mono text-sm">
                                No other members found.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
