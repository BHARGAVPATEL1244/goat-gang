'use client';

import React, { useState } from 'react';
import { Entry } from '@/lib/types';
import SummaryCards from './SummaryCards';
import RecentActivity from './RecentActivity';
import { Filter, RefreshCw } from 'lucide-react';

import { useEntries } from '@/hooks/useEntries';

export default function Dashboard() {
    const { entries, isLoading: loading } = useEntries();
    const [filterNeighborhood, setFilterNeighborhood] = useState('');
    const [filterBarType, setFilterBarType] = useState('');

    const neighborhoods = Array.from(new Set(entries.map(e => e.neighborhood))).sort();
    const barTypes = ['silver', 'gold', 'platinum', 'iron', 'coal'];

    const filteredEntries = entries.filter(entry => {
        if (filterNeighborhood && entry.neighborhood !== filterNeighborhood) return false;
        return true;
    });

    const resetFilters = () => {
        setFilterNeighborhood('');
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Goat Gang Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bar Vault</h1>
                        <p className="text-gray-500 dark:text-gray-400">Overview of inventory and donations</p>
                    </div>
                </div>

                <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                    <a href="/leaderboard" className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-black font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 w-full sm:w-auto justify-center">
                        <span className="text-lg">🏆</span> View Leaderboard
                    </a>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <select
                            className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={filterNeighborhood}
                            onChange={(e) => setFilterNeighborhood(e.target.value)}
                        >
                            <option value="">All Neighborhoods</option>
                            {neighborhoods.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    {filterNeighborhood && (
                        <button
                            onClick={resetFilters}
                            className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <SummaryCards entries={filteredEntries} />
            <RecentActivity entries={filteredEntries} />
        </div>
    );
}
