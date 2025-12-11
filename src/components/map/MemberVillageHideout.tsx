'use client';

import React from 'react';
import { ArrowLeft, Crown, Shield, User, Coffee, Tv, Lamp } from 'lucide-react';

interface Member {
    id: string;
    name: string;
    role: 'Leader' | 'CoLeader' | 'Elder' | 'Member';
}

interface MemberVillageHideoutProps {
    hoodName: string;
    members: Member[];
    onBack: () => void;
}

export default function MemberVillageHideout({ hoodName, members, onBack }: MemberVillageHideoutProps) {
    // Categorize members
    const leader = members.find(m => m.role === 'Leader');
    const coLeaders = members.filter(m => m.role === 'CoLeader');
    const elders = members.filter(m => m.role === 'Elder');
    const regularMembers = members.filter(m => m.role === 'Member');

    return (
        <div className="w-full h-full min-h-screen bg-gray-900 relative overflow-y-auto custom-scrollbar flex flex-col items-center">

            {/* Sky / Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-900 via-purple-900 to-black pointer-events-none">
                <div className="absolute top-10 right-20 w-16 h-16 bg-yellow-100 rounded-full blur-[40px] opacity-20"></div>
            </div>

            {/* Back Button */}
            <button
                onClick={onBack}
                className="fixed top-6 left-6 z-50 bg-black/60 text-white px-6 py-3 rounded-full flex items-center gap-2 border border-white/20 transition-all font-bold hover:bg-black"
            >
                <ArrowLeft className="w-5 h-5" /> EXIT BASE
            </button>

            {/* THE BUILDING CONTAINER */}
            <div className="relative z-10 w-full max-w-4xl mt-20 mb-20 px-4">

                {/* Roof */}
                <div className="w-full h-16 bg-[#1a1a1a] clip-path-polygon-[10%_0%,90%_0%,100%_100%,0%_100%] rounded-t-lg flex items-center justify-center relative border-b-4 border-gray-800">
                    <div className="absolute -top-10 bg-yellow-500 text-black font-black px-6 py-2 rounded shadow-lg border-2 border-white transform -rotate-2">
                        {hoodName} HQ
                    </div>
                    <div className="w-2 h-16 bg-gray-600 absolute bottom-10 left-10"></div> {/* Antenna */}
                </div>

                {/* FLOOR 4: PENTHOUSE (Leader) */}
                <div className="w-full bg-[#2c3e50] border-l-8 border-r-8 border-gray-700 relative overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-4 left-4 bg-yellow-500 text-[10px] font-bold px-2 py-0.5 rounded text-black uppercase tracking-wider">Penthouse</div>
                    <div className="h-64 flex items-center justify-center p-8 relative">
                        {/* Window Background */}
                        <div className="absolute right-10 top-10 w-32 h-32 bg-blue-500/20 border-4 border-black/50 rounded-lg backdrop-blur-sm"></div>

                        {/* Leader Room Content */}
                        {leader ? (
                            <div className="flex flex-col items-center gap-4 z-10 animate-in zoom-in duration-500">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                                        <Crown className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-black text-white text-xs font-bold px-2 py-1 rounded border border-yellow-500">BOSS</div>
                                </div>
                                <div className="text-center">
                                    <h2 className="text-3xl font-black text-white drop-shadow-lg">{leader.name.split('[')[0].trim()}</h2>
                                    <p className="text-yellow-400 font-bold uppercase text-sm tracking-widest">The Leader</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 font-mono">VACANT THRONE</div>
                        )}

                        {/* Decor */}
                        <div className="absolute bottom-0 left-20 w-16 h-24 bg-red-900 rounded-t-lg"></div> {/* Chair */}
                        <div className="absolute bottom-0 right-32 w-24 h-12 bg-gray-900 rounded-t-sm"></div> {/* Desk */}
                    </div>
                </div>

                {/* FLOOR 3: EXECUTIVE SUITES (Co-Leaders) */}
                {coLeaders.length > 0 && (
                    <div className="w-full bg-[#34495e] border-l-8 border-r-8 border-gray-700 border-t-4 border-black relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x-4 divide-gray-800">
                        <div className="absolute top-0 left-0 bg-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-br text-white uppercase tracking-wider z-10">Exec Level</div>
                        {coLeaders.map(cl => (
                            <div key={cl.id} className="h-48 p-4 relative group hover:bg-[#2c3e50] transition-colors">
                                <div className="absolute bottom-0 left-0 w-full h-2 bg-[#27ae60]"></div> {/* Carpet */}
                                <div className="h-full flex flex-col items-center justify-center gap-2">
                                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center shadow-lg border-2 border-gray-400">
                                        <Shield className="w-8 h-8 text-gray-700" />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-white font-bold text-lg leading-none">{cl.name.split('[')[0].trim()}</div>
                                        <div className="text-green-400 text-xs font-bold uppercase mt-1">Co-Leader</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FLOOR 2: ELDER QUARTERS */}
                {elders.length > 0 && (
                    <div className="w-full bg-[#7f8c8d] border-l-8 border-r-8 border-gray-700 border-t-4 border-black relative grid grid-cols-2 md:grid-cols-4 divide-x-4 divide-gray-600">
                        <div className="absolute top-0 left-0 bg-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-br text-white uppercase tracking-wider z-10">Veterans</div>
                        {elders.map(e => (
                            <div key={e.id} className="h-40 p-2 relative flex flex-col items-center justify-end pb-4 hover:bg-gray-600 transition-colors">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow mb-2">
                                    <User className="w-6 h-6 text-gray-800" />
                                </div>
                                <div className="text-white font-bold text-sm text-center">{e.name.split('[')[0].trim()}</div>
                                <div className="text-gray-300 text-[10px] uppercase">Elder</div>
                                {/* Bed */}
                                <div className="absolute bottom-1 right-1 w-8 h-4 bg-blue-800 rounded-sm"></div>
                            </div>
                        ))}
                    </div>
                )}

                {/* FLOOR 1: BARRACKS (Members) */}
                <div className="w-full bg-[#95a5a6] border-l-8 border-r-8 border-gray-700 border-t-4 border-black relative p-6 min-h-[200px]">
                    <div className="absolute top-0 left-0 bg-gray-400 text-[10px] font-bold px-2 py-0.5 rounded-br text-black uppercase tracking-wider z-10">The Crew</div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-4">
                        {regularMembers.map(m => (
                            <div key={m.id} className="bg-white/10 rounded-lg p-2 flex flex-col items-center border border-white/20 hover:bg-white/20 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-gray-300 rounded mb-1 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <User className="w-6 h-6 text-gray-600" />
                                </div>
                                <div className="text-black font-bold text-xs text-center truncate w-full">{m.name.split('[')[0].trim()}</div>
                            </div>
                        ))}
                        {/* Empty Bunks */}
                        {Array.from({ length: Math.max(0, 12 - regularMembers.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="opacity-30 flex flex-col items-center justify-center">
                                <div className="w-8 h-2 bg-gray-800 rounded mt-8"></div>
                                <div className="text-[9px] mt-1 font-mono">EMPTY</div>
                            </div>
                        ))}
                    </div>

                    {/* Common Area Props */}
                    <div className="absolute bottom-2 left-6 opacity-50 flex gap-2">
                        <Tv className="w-6 h-6 text-black" />
                        <Coffee className="w-6 h-6 text-black" />
                    </div>
                </div>

                {/* FOUNDATION */}
                <div className="w-full h-8 bg-black/80 flex items-center justify-center">
                    <div className="text-[10px] text-gray-500 font-mono">EST. 2025 • GOAT GANG CONSTRUCTION</div>
                </div>

            </div>
        </div>
    );
}
