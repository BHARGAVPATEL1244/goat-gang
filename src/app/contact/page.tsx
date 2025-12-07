'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Users, ArrowRight, Hash } from 'lucide-react';

export default function ContactPage() {
    const [serverData, setServerData] = useState<any>(null);

    useEffect(() => {
        fetch('https://discord.com/api/guilds/1243246332718743622/widget.json')
            .then(res => res.json())
            .then(data => setServerData(data))
            .catch(err => console.error('Failed to load Discord data', err));
    }, []);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-5xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    >
                        Join the Goat Gang
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-600 dark:text-gray-300"
                    >
                        Connect, trade, and dominate the derby with us on Discord.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden relative"
                >
                    {/* Decorative background blobs */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">

                        {/* Left Side: Server Info */}
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center lg:justify-start gap-3">
                                    <MessageCircle className="w-8 h-8 text-[#5865F2]" />
                                    Discord Community
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    The heart of our neighborhood. Real-time chat, trading channels, and event coordination.
                                </p>
                            </div>

                            {serverData ? (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 inline-block w-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-bold text-lg text-gray-900 dark:text-white">{serverData.name}</span>
                                        <span className="px-3 py-1 bg-[#5865F2]/10 text-[#5865F2] rounded-full text-xs font-bold uppercase tracking-wider">
                                            Official
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="flex items-center gap-2 text-green-500 font-medium">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                            </span>
                                            {serverData.presence_count} Online
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                            <Hash className="w-4 h-4" />
                                            General Chat
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-pulse h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full" />
                            )}

                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href={serverData?.instant_invite || "https://discord.gg/"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#5865F2]/30 transition-all w-full lg:w-auto justify-center"
                            >
                                Join Server Now <ArrowRight className="w-5 h-5" />
                            </motion.a>
                        </div>

                        {/* Right Side: Widget */}
                        <div className="w-full lg:w-1/2 h-[500px] bg-[#2f3136] rounded-2xl shadow-inner overflow-hidden border border-gray-700">
                            <iframe
                                src="https://discord.com/widget?id=1243246332718743622&theme=dark"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                            ></iframe>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
