'use client';

import React, { useState } from 'react';
import { Music, Volume2, VolumeX, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

export default function AmbientPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="bg-gray-900 border border-t border-r border-gray-700 rounded-lg p-2 flex items-center gap-2 overflow-hidden shadow-xl"
                    >
                        {/* The Actual Video (Visible now) - Lofi Girl from YouTube */}
                        <div className="rounded overflow-hidden relative shadow-md shrink-0" style={{ width: 120, height: 68 }}>
                            <ReactPlayer
                                url='https://www.youtube.com/watch?v=jfKfPfyJRdk'
                                playing={true} // Always play if this box is open
                                muted={isMuted}
                                volume={volume}
                                width="100%"
                                height="100%"
                                playsinline={true}
                                config={{
                                    youtube: {
                                        playerVars: { showinfo: 0, controls: 0, modestbranding: 1 }
                                    }
                                }}
                                onError={(e: any) => console.error('Player Error:', e)}
                            />
                        </div>

                        <div className="flex flex-col gap-1 mr-2">
                            <span className="text-xs font-mono text-red-400 whitespace-nowrap ml-2">
                                Lofi Girl
                            </span>
                            {/* Visualizer Bars (Fake) */}
                            <div className="flex items-end gap-[2px] h-3 ml-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 bg-red-500 rounded-t-sm"
                                        animate={{ height: [4, 12, 6, 12, 4] }}
                                        transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "linear" }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Volume Control */}
                        <button onClick={toggleMute} className="text-gray-400 hover:text-white ml-2">
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={togglePlay}
                className={`
                    w-10 h-10 rounded-full flex items-center justify-center border transition-all shadow-lg z-50
                    ${isPlaying ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'}
                `}
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Music size={18} />}
            </button>
        </div>
    );
}
