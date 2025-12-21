'use client';

import React, { useState, useEffect } from 'react';
import { Music, Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any;

export default function AmbientPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.5); // Increased volume
    const [isReady, setIsReady] = useState(false);

    // Browser policy prevents autoplay with sound. We wait for user interaction to toggle play.
    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
            {/* Hidden Player - positioned offscreen but 'visible' to DOM */}
            {/* Hidden Player - positioned offscreen but 'visible' to DOM */}
            {/* We use 1px opacity cleanly. Increasing size to avoid browser throttling */}
            <div className="fixed bottom-0 right-0 opacity-0 pointer-events-none">
                <ReactPlayer
                    url='https://www.youtube.com/watch?v=Kwp2Lhn-DmA'
                    playing={isPlaying}
                    muted={isMuted}
                    volume={volume}
                    loop={true}
                    width="200px"
                    height="200px"
                    playsinline={true}
                    onReady={() => {
                        console.log('Music Player Ready');
                        setIsReady(true);
                    }}
                    onStart={() => console.log('Music Started Playing')}
                    onError={(e: any) => console.error('Music Player Error:', e)}
                />
            </div>

            <AnimatePresence>
                {isPlaying && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="bg-gray-900 border border-t border-r border-gray-700 rounded-lg p-2 flex items-center gap-2 overflow-hidden"
                    >
                        {/* Visualizer Bars (Fake but cool) */}
                        <div className="flex items-end gap-[2px] h-4">
                            {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-1 bg-red-500 rounded-t-sm"
                                    animate={{ height: [4, 12, 6, 16, 4] }}
                                    transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "linear" }}
                                />
                            ))}
                        </div>
                        <span className="text-xs font-mono text-red-400 whitespace-nowrap ml-2">
                            Hay Day Lofi
                        </span>

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
                    w-10 h-10 rounded-full flex items-center justify-center border transition-all shadow-lg
                    ${isPlaying ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'}
                `}
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Music size={18} />}
            </button>
        </div>
    );
}
