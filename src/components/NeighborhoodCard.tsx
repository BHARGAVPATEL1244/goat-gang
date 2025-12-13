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
    onManageMembers?: (neighborhood: any) => void;
}

export default function NeighborhoodCard({ neighborhood, index, onEdit, onSync, onDelete, onManageMembers }: NeighborhoodCardProps) {
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

            {/* Admin Controls - Moved to top right or integrated differently since image is gone */}
            {(onEdit || onSync || onDelete || onManageMembers) && (
                <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onManageMembers && (
                        <button onClick={(e) => { e.stopPropagation(); onManageMembers(neighborhood); }} className="p-2 bg-green-600/80 hover:bg-green-500 text-white rounded-full backdrop-blur shadow-lg" title="Manage Members">
                            <Users className="w-4 h-4" />
                        </button>
                    )}
                    {onEdit && (
                        <button onClick={(e) => { e.stopPropagation(); onEdit(neighborhood); }} className="p-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded-full backdrop-blur shadow-lg" title="Edit Details">
                            <Edit className="w-4 h-4" />
                        </button>
                    )}
                    {onSync && (
                        <button onClick={(e) => { e.stopPropagation(); onSync(neighborhood); }} className="p-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-full backdrop-blur shadow-lg" title="Sync from Discord">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(neighborhood); }} className="p-2 bg-red-600/80 hover:bg-red-500 text-white rounded-full backdrop-blur shadow-lg" title="Delete">
                            <Trash className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Top Pattern / Decoration since image is gone */}
            <div className="h-10 bg-gradient-to-b from-blue-500/10 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

                {/* Hash Tag */}
                <div className="absolute top-2 left-2 z-20">
                    <button
                        onClick={handleCopyTag}
                        className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] font-mono border border-white/5 flex items-center gap-1 transition-all"
                    >
                        <Hash className="w-2 h-2 text-blue-400" />
                        {copied ? 'Copied!' : neighborhood.tag}
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-2 flex flex-col flex-1 gap-1 relative z-20 -mt-6">
                <div className="space-y-0.5 pl-1">
                    <h2
                        className="text-xl font-black tracking-tight text-white drop-shadow-lg"
                        style={{ color: neighborhood.text_color || '#ffffff' }}
                    >
                        {neighborhood.name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-medium">
                        <Users className="w-2.5 h-2.5 text-yellow-500" />
                        <span>Leader: <span className="text-white">{neighborhood.leader}</span></span>
                    </div>
                </div>

                <div className="space-y-1 flex-1">
                    {/* Requirements Card */}
                    <div className="bg-white/5 rounded-lg p-2 border border-white/5 hover:bg-white/10 transition-colors group/card">
                        <h3 className="text-[10px] font-bold mb-1 flex items-center gap-1 text-gray-200 uppercase tracking-wider">
                            <AlertCircle className="w-2.5 h-2.5 text-blue-400" /> Requirements
                        </h3>
                        {/* Handle string[] or parsing logic if accidentally string */}
                        <ul className="space-y-0.5">
                            {(Array.isArray(neighborhood.requirements) ? neighborhood.requirements : [neighborhood.requirements]).map((req, idx) => (
                                <li key={idx} className="text-[10px] text-gray-400 flex items-start gap-1 leading-tight">
                                    <span className="w-0.5 h-0.5 rounded-full bg-blue-500/50 mt-1 shrink-0" />
                                    {req || 'None'}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Derby Card */}
                    {neighborhood.derby_requirements && (
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-2 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                            <h3 className="text-[10px] font-bold mb-1 flex items-center gap-1 text-white uppercase tracking-wider">
                                <Trophy className="w-2.5 h-2.5 text-purple-400" /> Derby Rules
                            </h3>
                            <ul className="space-y-0.5">
                                {(Array.isArray(neighborhood.derby_requirements) ? neighborhood.derby_requirements : [neighborhood.derby_requirements]).map((req, idx) => (
                                    <li key={idx} className="text-[10px] text-gray-300 flex items-start gap-1 leading-tight">
                                        <span className="w-0.5 h-0.5 rounded-full bg-purple-500 mt-1 shrink-0" />
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
