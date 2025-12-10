import React from 'react';
import { motion } from 'framer-motion';
import { NeighborhoodDB } from '@/lib/types';
import { Trophy, Users, Hash, AlertCircle, Edit, Trash, RefreshCw } from 'lucide-react';
import Image from 'next/image';

interface NeighborhoodCardProps {
    neighborhood: NeighborhoodDB;
    index: number;
    // Optional Admin Actions
    onEdit?: (hood: NeighborhoodDB) => void;
    onSync?: (hood: NeighborhoodDB) => void;
    onDelete?: (hood: NeighborhoodDB) => void;
}

export default function NeighborhoodCard({ neighborhood, index, onEdit, onSync, onDelete }: NeighborhoodCardProps) {
    const [copied, setCopied] = React.useState(false);
    const divRef = React.useRef<HTMLDivElement>(null);
    const [xy, setXY] = React.useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = React.useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setXY({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleCopyTag = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(neighborhood.tag);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
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
                    background: `radial-gradient(600px circle at ${xy.x}px ${xy.y}px, rgba(255,255,255,.1), transparent 40%)`,
                }}
            />

            {/* Image Section */}
            <div className="h-64 overflow-hidden relative bg-black/50 flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/90 z-10" />

                {/* Fallback if no image (Admin might not have one yet) */}
                {neighborhood.image ? (
                    <Image
                        src={neighborhood.image}
                        alt={neighborhood.name}
                        fill
                        className="object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110 relative z-0"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="text-gray-600 font-mono text-xs z-0">No Image</div>
                )}

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

                {/* ADMIN CONTROLS OVERLAY */}
                {(onEdit || onSync || onDelete) && (
                    <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {onEdit && (
                            <button onClick={(e) => { e.stopPropagation(); onEdit(neighborhood); }} className="p-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded-full backdrop-blur shadow-lg">
                                <Edit className="w-4 h-4" />
                            </button>
                        )}
                        {onSync && (
                            <button onClick={(e) => { e.stopPropagation(); onSync(neighborhood); }} className="p-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-full backdrop-blur shadow-lg">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(neighborhood); }} className="p-2 bg-red-600/80 hover:bg-red-500 text-white rounded-full backdrop-blur shadow-lg">
                                <Trash className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-8 flex flex-col flex-1 gap-6 relative z-20 -mt-12">
                <div className="space-y-2">
                    <h2
                        className="text-3xl font-black tracking-tight text-white drop-shadow-lg"
                        style={{ color: neighborhood.text_color || '#ffffff' }}
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
                        {/* Handle string[] or parsing logic if accidentally string */}
                        <ul className="space-y-2">
                            {(Array.isArray(neighborhood.requirements) ? neighborhood.requirements : [neighborhood.requirements]).map((req, idx) => (
                                <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                                    {req || 'None'}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Derby Card */}
                    {neighborhood.derby_requirements && (
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-white uppercase tracking-wider">
                                <Trophy className="w-4 h-4 text-purple-400" /> Derby Rules
                            </h3>
                            <ul className="space-y-2">
                                {(Array.isArray(neighborhood.derby_requirements) ? neighborhood.derby_requirements : [neighborhood.derby_requirements]).map((req, idx) => (
                                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                        {typeof req === 'string' ? req : 'Derby Focus'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
