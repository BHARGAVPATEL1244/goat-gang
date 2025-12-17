import React from 'react';
import { m as motion } from 'framer-motion';
import { EventDB } from '@/lib/types';
import { Trophy, User, DollarSign, Calendar } from 'lucide-react';

interface EventCardProps {
    event: EventDB;
}

export default function EventCard({ event }: EventCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full"
        >
            <div className="h-48 overflow-hidden relative">
                <img
                    src={event.image}
                    alt={event.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {event.category}
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{event.name}</h3>
                    {event.date && (
                        <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>

                <div className="space-y-4 flex-1">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                            <Trophy className="w-4 h-4" /> Winners
                        </p>

                        {event.category === 'Weekly Derby' ? (
                            // Simple list for Derby
                            <div className="flex flex-wrap gap-2">
                                {event.winners.map((winner, idx) => (
                                    <span key={idx} className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-1 rounded-md font-medium">
                                        {winner}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            // Ranked list for Main/Mini
                            <div className="space-y-2">
                                <div className="flex flex-col gap-1">
                                    {event.winners[0] && (
                                        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded-md">
                                            <span className="text-lg">🥇</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{event.winners[0]}</span>
                                        </div>
                                    )}
                                    {event.winners[1] && (
                                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-md">
                                            <span className="text-lg">🥈</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{event.winners[1]}</span>
                                        </div>
                                    )}
                                    {event.winners[2] && (
                                        <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-md">
                                            <span className="text-lg">🥉</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{event.winners[2]}</span>
                                        </div>
                                    )}
                                </div>
                                {event.winners.length > 3 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {event.winners.slice(3).map((winner, idx) => (
                                            <span key={idx} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-1 rounded-md">
                                                {winner}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                <User className="w-3 h-3" /> Host
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{event.host}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2">
                            <DollarSign className="w-3 h-3" /> Sponsors
                        </p>
                        <div className="space-y-1">
                            {event.sponsors.map((sponsor, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">{sponsor.name}</span>
                                    <span className="font-mono text-green-600 dark:text-green-400">{sponsor.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
