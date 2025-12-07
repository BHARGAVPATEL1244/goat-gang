import React from 'react';
import { BarCounts, Entry } from '@/lib/types';
import { Coins, Hexagon, Layers, Shield, Zap, Package } from 'lucide-react';

interface SummaryCardsProps {
    entries: Entry[];
}

const BAR_TYPES = [
    { key: 'silver', label: 'Silver', icon: Shield, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-900/50' },
    { key: 'gold', label: 'Gold', icon: Coins, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
    { key: 'platinum', label: 'Platinum', icon: Layers, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/50' },
    { key: 'iron', label: 'Iron', icon: Hexagon, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50' },
    { key: 'coal', label: 'Coal', icon: Zap, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
] as const;

export default function SummaryCards({ entries }: SummaryCardsProps) {
    const totals = entries.reduce(
        (acc, entry) => {
            const isDonation = entry.type === 'donation';
            const multiplier = isDonation ? 1 : -1;

            (Object.keys(entry.bars) as Array<keyof BarCounts>).forEach((key) => {
                const value = entry.bars[key] || 0;
                acc.available[key] = (acc.available[key] || 0) + value * multiplier;
                if (isDonation) {
                    acc.donated[key] = (acc.donated[key] || 0) + value;
                } else {
                    acc.requested[key] = (acc.requested[key] || 0) + value;
                }
            });
            return acc;
        },
        {
            available: { silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0 } as BarCounts,
            donated: { silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0 } as BarCounts,
            requested: { silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0 } as BarCounts,
        }
    );

    const grandTotals = {
        available: Object.values(totals.available).reduce((a, b) => a + b, 0),
        donated: Object.values(totals.donated).reduce((a, b) => a + b, 0),
        requested: Object.values(totals.requested).reduce((a, b) => a + b, 0),
    };

    const cards = [
        ...BAR_TYPES.map(type => ({ ...type, stats: null })),
        {
            key: 'total',
            label: 'Total Bars',
            icon: Package,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-100 dark:bg-purple-900/50',
            stats: grandTotals
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map(({ key, label, icon: Icon, color, bg, stats }) => {
                const available = stats ? stats.available : totals.available[key as keyof BarCounts];
                const donated = stats ? stats.donated : totals.donated[key as keyof BarCounts];
                const requested = stats ? stats.requested : totals.requested[key as keyof BarCounts];
                const isPositive = available > 0;

                return (
                    <div key={key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${bg}`}>
                                <Icon className={`w-6 h-6 ${color}`} />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {label}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                                <span className={`text-3xl font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {available.toLocaleString('en-US')}
                                </span>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Available</span>
                            </div>

                            <div className="flex flex-col gap-1 text-xs pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Total Donated:</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                        {donated.toLocaleString('en-US')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Total Requested:</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                        {requested.toLocaleString('en-US')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
