'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Users, Crown, ArrowRight } from 'lucide-react';

interface District {
    id: string;
    name: string;
    leader_name: string;
    member_count: number;
    description?: string;
    color?: string; // Fallback or defined color
}

interface HeroSelectCarouselProps {
    districts: District[];
    onSelect: (district: District) => void;
}

export default function HeroSelectCarousel({ districts, onSelect }: HeroSelectCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-select center item on scroll
    const handleScroll = () => {
        if (!scrollRef.current) return;

        const container = scrollRef.current;
        const centerX = container.scrollLeft + container.clientWidth / 2;

        const cards = Array.from(container.children) as HTMLElement[];
        let closestIndex = 0;
        let closestDistance = Infinity;

        cards.forEach((card, index) => {
            const cardCenterX = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(centerX - cardCenterX);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        if (activeIndex !== closestIndex) {
            setActiveIndex(closestIndex);
        }
    };

    // Scroll active item into view smoothly on click
    const scrollToItem = (index: number) => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const cards = Array.from(container.children) as HTMLElement[];
        const card = cards[index];

        if (card) {
            const scrollLeft = card.offsetLeft - (container.clientWidth / 2) + (card.offsetWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    };

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center bg-gray-900 overflow-hidden">

            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 z-0 pointer-events-none" />

            {/* Header Text */}
            <div className="absolute top-10 z-20 text-center">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white drop-shadow-lg tracking-tighter uppercase italic">
                    Choose Your Squad
                </h1>
                <p className="text-blue-300 tracking-widest mt-2 font-medium">SELECT A NEIGHBORHOOD</p>
            </div>

            {/* Carousel Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="w-full flex items-center gap-8 px-[50vw] overflow-x-auto scrollbar-hide snap-x snap-mandatory py-20 z-10"
                style={{ scrollBehavior: 'smooth' }}
            >
                {/* Fallback if empty */}
                {districts.length === 0 && (
                    <div className="w-[300px] h-[500px] flex items-center justify-center text-gray-400">
                        No Squads Found
                    </div>
                )}

                {districts.map((district, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <div
                            key={district.id}
                            onClick={() => scrollToItem(index)}
                            className={`
                                relative flex-shrink-0 transition-all duration-500 ease-out cursor-pointer snap-center
                                ${isActive ? 'w-[320px] h-[560px] scale-110 z-20 brightness-110' : 'w-[280px] h-[480px] scale-90 z-10 brightness-50 hover:brightness-75'}
                            `}
                        >
                            {/* Card Frame */}
                            <div className={`
                                w-full h-full rounded-2xl border-4 overflow-hidden relative shadow-2xl
                                ${isActive ? 'border-yellow-400 shadow-yellow-500/50' : 'border-gray-600 shadow-black'}
                                bg-gray-800 flex flex-col
                            `}>
                                {/* Image / Mascot Placeholder */}
                                <div className="flex-1 bg-gradient-to-b from-gray-700 to-gray-900 flex items-center justify-center relative group">
                                    {/* Simple Avatar/Icon generated from name initials */}
                                    <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-6xl font-bold text-white/20">
                                        {district.name.substring(0, 1)}
                                    </div>

                                    {/* "Select" Overlay */}
                                    {isActive && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onSelect(district); }}
                                                className="bg-yellow-500 text-black font-bold uppercase px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                                            >
                                                Enter Roster <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Info Section */}
                                <div className="p-6 bg-gray-900 border-t border-white/10 relative overflow-hidden">
                                    {/* Diagonal Shine */}
                                    {isActive && <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[30deg] animate-shimmer" />}

                                    <h2 className="text-3xl font-black text-white uppercase italic leading-none mb-1 truncate">
                                        {district.name}
                                    </h2>
                                    <div className="w-12 h-1 bg-yellow-500 mb-4" />

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Crown size={16} className="text-yellow-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Master</span>
                                            </div>
                                            <span className="font-mono text-sm">{district.leader_name}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-blue-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Power Lvl</span>
                                            </div>
                                            <span className="font-mono text-sm text-blue-400 font-bold">{district.member_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer / Instructions */}
            <div className="absolute bottom-10 z-20 text-gray-500 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
                &lt; Scroll to Select &bull; Click to Enter &gt;
            </div>

        </div>
    );
}
