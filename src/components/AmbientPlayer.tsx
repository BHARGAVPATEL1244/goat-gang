'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music, Volume2, VolumeX, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AmbientPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        audioRef.current.muted = !isMuted;
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
                        <span className="text-xs font-mono text-green-400 whitespace-nowrap ml-2">
                            Hay Day Radio
                        </span>

                        {/* Visualizer Bars */}
                        <div className="flex items-end gap-[2px] h-3 ml-2">
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-green-500 rounded-t-sm"
                                    animate={{ height: [4, 12, 6, 12, 4] }}
                                    transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "linear" }}
                                />
                            ))}
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
                    ${isPlaying ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'}
                `}
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Music size={18} />}
            </button>

            {/* Native Audio Element */}
            <audio
                ref={audioRef}
                src="/sounds/hayday.m4a"
                loop
                onEnded={() => setIsPlaying(false)}
            />
        </div>
    );
}
