'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JoinGuildModalProps {
    isOpen: boolean;
}

export default function JoinGuildModal({ isOpen }: JoinGuildModalProps) {
    if (!isOpen) return null;

    // Discord Invite URL (Replace with your actual invite)
    const INVITE_URL = 'https://discord.gg/goat-gang';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
                >
                    {/* Decorative Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-600/20 blur-[60px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <div className="mb-6 flex justify-center">
                            <img src="/logo.png" alt="Goat Gang" className="w-20 h-20 object-contain drop-shadow-lg" />
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">Join the Gang!</h2>
                        <p className="text-gray-400 mb-8">
                            You must be a member of our <strong className="text-blue-400">Discord Server</strong> to access exclusive features and giveaways.
                        </p>

                        <a
                            href={INVITE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-[#5865F2]/25"
                        >
                            Join Discord Server
                        </a>

                        <p className="text-xs text-gray-500 mt-4">
                            Already joined? Refresh this page once you're in!
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
