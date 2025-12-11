'use client';

import React from 'react';
import { ArrowLeft, Star, Shield, Swords, Crown, Skull } from 'lucide-react';

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillageWantedProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
}

export default function MemberVillageWanted({ hoodName, members, onBack }: MemberVillageWantedProps) {
    // Sort members by rank for visual hierarchy
    const sortedMembers = [...members].sort((a, b) => {
        const rankOrder = { 'Leader': 0, 'CoLeader': 1, 'Elder': 2, 'Member': 3 };
        return rankOrder[a.role] - rankOrder[b.role];
    });

    return (
        <div className="w-full h-full min-h-screen bg-[#3e2723] relative overflow-y-auto custom-scrollbar">
            {/* Background Texture (Wood Pattern) */}
            <div className="fixed inset-0 opacity-40 pointer-events-none"
                style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 40px, #2d1b15 41px, #2d1b15 42px), linear-gradient(#5d4037, #3e2723)' }}
            />

            {/* Header: The "Saloon Sign" */}
            <div className="relative z-10 pt-24 pb-10 text-center">
                <div className="inline-block bg-[#8b4513] border-4 border-[#d4af37] px-12 py-4 rounded-xl shadow-2xl transform rotate-1">
                    <h1 className="text-4xl md:text-6xl font-black text-[#f4e4bc] uppercase tracking-widest drop-shadow-md" style={{ fontFamily: 'serif' }}>
                        {hoodName}
                    </h1>
                    <div className="text-[#d4af37] font-bold tracking-[0.5em] text-sm mt-2">NOTORIOUS MEMBERS</div>
                </div>
            </div>

            {/* The Wall of Posters */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {sortedMembers.map((member) => (
                        <WantedPoster key={member.id} member={member} />
                    ))}
                </div>
            </div>

            {/* Back Button (Fixed) */}
            <button
                onClick={onBack}
                className="fixed top-6 right-6 z-50 bg-[#2d1b15] hover:bg-[#1a0f0b] text-[#d4af37] px-6 py-3 rounded-full flex items-center gap-2 border-2 border-[#d4af37] transition-all font-bold shadow-xl active:scale-95"
            >
                <ArrowLeft className="w-5 h-5" /> EXIT SALOON
            </button>
        </div>
    );
}

function WantedPoster({ member }: { member: Member }) {
    const isLeader = member.role === 'Leader';
    const isCoLeader = member.role === 'CoLeader';

    // Aesthetic logic based on rank
    const rotation = Math.random() * 4 - 2; // Slight tilt
    const paperColor = isLeader ? '#f9f1d8' : '#eaddcf';
    const borderColor = isLeader ? '#d4af37' : '#5d4037';

    return (
        <div
            className="relative group transition-transform hover:scale-105 hover:z-20 duration-300"
            style={{ transform: `rotate(${rotation}deg)` }}
        >
            {/* Pin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-800 shadow-md z-10 border border-black/30" />

            {/* Paper */}
            <div className="w-full bg-[#eaddcf] p-4 shadow-xl relative overflow-hidden"
                style={{ backgroundColor: paperColor }}
            >
                {/* Torn Edge Effect (CSS Clip-path or Border-image ideal, using simplified borders for now) */}
                <div className="border-4 border-double p-4 text-center flex flex-col items-center gap-2"
                    style={{ borderColor: borderColor }}
                >
                    <h3 className="text-2xl font-black uppercase tracking-widest leading-none mb-1"
                        style={{ color: borderColor, fontFamily: 'serif' }}>
                        {member.name.split('[')[0].trim()}
                    </h3>

                    {/* Portrait Placeholder */}
                    <div className="w-full aspect-square bg-[#8b7355] mb-2 grayscale contrast-125 sepia relative flex items-center justify-center overflow-hidden border-2 border-[#2d1b15]">
                        <div className="opacity-50 absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

                        {/* Avatar Icon */}
                        {isLeader ? (
                            <Crown className="w-20 h-20 text-[#2d1b15] opacity-80" />
                        ) : isCoLeader ? (
                            <Swords className="w-20 h-20 text-[#2d1b15] opacity-80" />
                        ) : (
                            <Skull className="w-20 h-20 text-[#2d1b15] opacity-80" />
                        )}
                    </div>

                    <div className="text-xl font-bold text-[#3e2723] mt-2 uppercase break-words w-full leading-tight">
                        {member.name}
                    </div>

                    <div className="flex items-center gap-1 text-sm font-bold text-[#5d4037] uppercase tracking-wide">
                        {isLeader && <Star className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />}
                        {member.role === 'CoLeader' && <Shield className="w-4 h-4" />}
                        {member.role}
                    </div>

                    <div className="border-t-2 border-[#2d1b15] w-full my-2"></div>

                    <div className="text-2xl font-black text-[#8b0000]" style={{ fontFamily: 'serif' }}>
                        ${isLeader ? '50,000' : isCoLeader ? '10,000' : '1,000'}
                    </div>
                    <div className="text-[10px] font-bold text-[#5d4037] uppercase">
                        REWARD
                    </div>
                </div>

                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 bg-black/5 pointer-events-none mix-blend-multiply"></div>
            </div>
        </div>
    );
}
