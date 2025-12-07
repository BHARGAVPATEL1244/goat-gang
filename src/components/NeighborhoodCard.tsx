import React from 'react';
import { motion } from 'framer-motion';
import { NeighborhoodDB } from '@/lib/types';
import { Trophy, Users, Hash, AlertCircle } from 'lucide-react';

interface NeighborhoodCardProps {
    neighborhood: NeighborhoodDB;
    index: number;
}

export default function NeighborhoodCard({ neighborhood, index }: NeighborhoodCardProps) {
    const [copied, setCopied] = React.useState(false);
    const divRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = React.useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setOpacity(1);
    };

    const handleBlur = () => {
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    const handleCopyTag = () => {
        navigator.clipboard.writeText(neighborhood.tag);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-3xl bg-gray-900/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col h-full"
        >
            {/* Spotlight Effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,.1), transparent 40%)`,
                }}
            />
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Image Section */}
            <div className="h-64 overflow-hidden relative bg-black/50 flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/90 z-10" />
                <img
                    src={neighborhood.image}
                    alt={neighborhood.name}
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110 relative z-0"
                />

                {/* Floating Tag */}
                <div className="absolute top-4 right-4 z-20">
                    <button
                        onClick={handleCopyTag}
                        className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-sm font-bold border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 group/btn"
                    >
                        <Hash className="w-3 h-3 text-blue-400 group-hover/btn:rotate-12 transition-transform" />
                        {copied ? 'Copied!' : neighborhood.tag}
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8 flex flex-col flex-1 gap-6 relative z-20 -mt-12">
                <div className="space-y-2">
                    <h2
                        className="text-3xl font-black tracking-tight text-white drop-shadow-lg"
                        style={{ color: neighborhood.text_color }}
                    >
                        {neighborhood.name}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                        <Users className="w-4 h-4 text-yellow-500" />
                        <span>Leader: <span className="text-white">{neighborhood.leader}</span></span>
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    {/* Requirements Card */}
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 hover:bg-white/10 transition-colors group/card">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-200 uppercase tracking-wider">
                            <AlertCircle className="w-4 h-4 text-blue-400" /> Requirements
                        </h3>
                        <ul className="space-y-2">
                            {neighborhood.requirements?.map((req, idx) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Derby Card */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-white uppercase tracking-wider">
                            <Trophy className="w-4 h-4 text-purple-400" /> Derby Rules
                        </h3>
                        <ul className="space-y-2">
                            {neighborhood.derby_requirements?.map((req, idx) => (
                                <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
