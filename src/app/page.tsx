'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Trophy, MessageCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Playfair_Display } from 'next/font/google';
import { triggerCoinExplosion, triggerGoatExplosion } from '@/lib/confetti';
import MagneticButton from '@/components/MagneticButton';

// Dynamically import Scene3D to avoid SSR issues with R3F
const Scene3D = dynamic(() => import('@/components/Scene3D'), { ssr: false });

export default function HomePage() {
    return (
        // Negative margins to break out of the RootLayout container
        <div className="relative -mt-8 -mb-8 -mx-4 sm:-mx-6 lg:-mx-8 min-h-[calc(100vh-64px)] bg-black overflow-hidden selection:bg-yellow-500/30">
            {/* Minimal Modern Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900 pointer-events-none" />

            {/* Hero Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] text-center px-4 pointer-events-none">
                <div className="max-w-4xl mx-auto space-y-8 pointer-events-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-2xl">
                            GOAT GANG
                        </h1>
                    </motion.div>




                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="flex flex-wrap justify-center gap-6 pt-8 pointer-events-auto"
                    >
                        <MagneticButton>
                            <Link
                                href="/neighborhoods"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                                    const y = (rect.top + rect.height / 2) / window.innerHeight;
                                    triggerGoatExplosion(x, y);
                                }}
                                className="group relative px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-full transition-all transform hover:scale-105 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] flex items-center gap-2 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">Join a Hood <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                            </Link>
                        </MagneticButton>

                        <MagneticButton>
                            <Link
                                href="/events"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                                    const y = (rect.top + rect.height / 2) / window.innerHeight;
                                    triggerCoinExplosion(x, y);
                                }}
                                className="px-8 py-4 bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white font-bold rounded-full transition-all border border-white/10 hover:border-white/30 flex items-center gap-2"
                            >
                                Events
                            </Link>
                        </MagneticButton>
                    </motion.div>
                </div>
            </div>

            <section className="max-w-7xl mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    <Link href="/neighborhoods" className="group">
                        <div className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:bg-white/10 group-hover:border-blue-500/30 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">Neighborhoods</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Find your perfect community. Browse our top-tier neighborhoods, check requirements, and join the family.
                            </p>
                            <span className="text-blue-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                Explore Hoods <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </Link>

                    <Link href="/events" className="group">
                        <div className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:bg-white/10 group-hover:border-purple-500/30 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Trophy className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold mb-3 text-white group-hover:text-purple-400 transition-colors">Events & Derbies</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Participate in Main Events, Mini Events, and Weekly Derby Championships. Win big prizes!
                            </p>
                            <span className="text-purple-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                View Events <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </Link>

                    <Link href="/contact" className="group">
                        <div className="bg-white/5 backdrop-blur-lg p-8 rounded-3xl border border-white/10 h-full transition-all duration-300 group-hover:-translate-y-2 group-hover:bg-white/10 group-hover:border-green-500/30 group-hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold mb-3 text-white group-hover:text-green-400 transition-colors">Join Discord</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Connect with thousands of players. Trade, chat, and coordinate in our active Discord server.
                            </p>
                            <span className="text-green-400 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
                                Get Invite <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </Link>
                </motion.div>
            </section>
        </div >
    );
}
