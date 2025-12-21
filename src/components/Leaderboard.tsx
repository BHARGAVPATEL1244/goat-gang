'use client';

import React, { useState } from 'react';
import { Entry, BarCounts } from '@/lib/types';
import { Search, Trophy, Medal, Award, X } from 'lucide-react';
import { useEntries } from '@/hooks/useEntries';

interface LeaderboardProps {
    allowRequestView?: boolean;
    isAdmin?: boolean;
}

interface UserStat {
    rank: number;
    username: string;
    farmName: string;
    total: number;
    bars: BarCounts;
}

export default function Leaderboard({ allowRequestView = false, isAdmin = false }: LeaderboardProps) {
    const { entries, isLoading: loading } = useEntries();
    const [activeTab, setActiveTab] = useState<'neighborhood' | 'user'>('neighborhood');
    const [viewType, setViewType] = useState<'donation' | 'request'>('donation');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<{ username: string, farmName: string } | null>(null);

    // Calculate Neighborhood Stats
    const neighborhoodStats = React.useMemo(() => {
        const stats: Record<string, number> = {};
        entries.forEach(entry => {
            if (entry.type === viewType) {
                const total = Object.values(entry.bars).reduce((a, b) => a + b, 0);
                const hood = entry.neighborhood || 'Unknown';
                stats[hood] = (stats[hood] || 0) + total;
            }
        });
        return Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .map(([name, total], index) => ({ rank: index + 1, name, total }));
    }, [entries, viewType]);

    // Calculate User Stats
    const userStats = React.useMemo(() => {
        const stats: Record<string, { total: number, farmName: string, bars: BarCounts }> = {};

        entries.forEach(entry => {
            if (entry.type === viewType) {
                const total = Object.values(entry.bars).reduce((a, b) => a + b, 0);
                const user = entry.username || 'Unknown';

                if (!stats[user]) {
                    stats[user] = {
                        total: 0,
                        farmName: entry.farmName,
                        bars: { silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0 }
                    };
                }

                stats[user].total += total;
                stats[user].farmName = entry.farmName;

                // Aggregate bar counts
                stats[user].bars.silver += entry.bars.silver || 0;
                stats[user].bars.gold += entry.bars.gold || 0;
                stats[user].bars.platinum += entry.bars.platinum || 0;
                stats[user].bars.iron += entry.bars.iron || 0;
                stats[user].bars.coal += entry.bars.coal || 0;
            }
        });

        let sortedUsers: UserStat[] = Object.entries(stats)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([username, data], index) => ({
                rank: index + 1,
                username,
                farmName: data.farmName,
                total: data.total,
                bars: data.bars
            }));

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            sortedUsers = sortedUsers.filter(u =>
                u.username.toLowerCase().includes(query) ||
                u.farmName.toLowerCase().includes(query)
            );
        }

        return sortedUsers;
    }, [entries, searchQuery, viewType]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
        if (rank === 3) return <Award className="w-5 h-5 text-orange-500" />;
        return <span className="font-mono text-gray-500 w-5 text-center">{rank}</span>;
    };

    // Selected User Details
    const selectedUserDetails = React.useMemo(() => {
        if (!selectedUser) return null;

        const userEntries = entries.filter(e =>
            e.username === selectedUser.username &&
            e.type === viewType
        ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const totalBars: BarCounts = {
            silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0
        };

        userEntries.forEach(e => {
            totalBars.silver += e.bars.silver;
            totalBars.gold += e.bars.gold;
            totalBars.platinum += e.bars.platinum;
            totalBars.iron += e.bars.iron;
            totalBars.coal += e.bars.coal;
        });

        const grandTotal = Object.values(totalBars).reduce((a, b) => a + b, 0);

        return { userEntries, totalBars, grandTotal };
    }, [selectedUser, entries, viewType]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Goat Gang Logo" className="w-12 h-12 object-contain" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
                        <p className="text-gray-500 dark:text-gray-400">Top contributors by neighborhood and user</p>
                    </div>
                </div>

                {allowRequestView && (
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewType('donation')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewType === 'donation'
                                ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Donations
                        </button>
                        <button
                            onClick={() => setViewType('request')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewType === 'request'
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            Requests
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-full sm:w-fit">
                <button
                    onClick={() => setActiveTab('neighborhood')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'neighborhood'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Neighborhoods
                </button>
                <button
                    onClick={() => setActiveTab('user')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'user'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                >
                    Users
                </button>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {activeTab === 'user' && (
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={isAdmin ? "Search by username or farm name..." : "Search by farm name..."}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-3 w-16 whitespace-nowrap">Rank</th>
                                <th className="px-6 py-3 whitespace-nowrap min-w-[180px]">{activeTab === 'neighborhood' ? 'Neighborhood' : 'Farm Name'}</th>
                                {activeTab === 'user' && isAdmin && <th className="px-6 py-3 hidden sm:table-cell whitespace-nowrap">Username</th>}
                                {activeTab === 'user' && (
                                    <>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider whitespace-nowrap">Silver</th>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider whitespace-nowrap">Gold</th>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider whitespace-nowrap">Plat</th>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider whitespace-nowrap">Iron</th>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider whitespace-nowrap">Coal</th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-right font-bold whitespace-nowrap">
                                    {viewType === 'donation' ? 'Total' : 'Total'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === 'user' ? (isAdmin ? 9 : 8) : 3} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : activeTab === 'neighborhood' ? (
                                neighborhoodStats.map((item) => (
                                    <tr key={item.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 flex items-center justify-center whitespace-nowrap">
                                            {getRankIcon(item.rank)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{item.name}</td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {item.total.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                userStats.length > 0 ? (
                                    userStats.map((item) => (
                                        <tr
                                            key={item.username}
                                            onClick={() => setSelectedUser({ username: item.username, farmName: item.farmName })}
                                            className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-6 py-4 flex items-center justify-center whitespace-nowrap">
                                                {getRankIcon(item.rank)}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{item.farmName}</td>
                                            {isAdmin && <td className="px-6 py-4 text-gray-600 dark:text-gray-300 hidden sm:table-cell whitespace-nowrap">{item.username}</td>}

                                            <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.bars.silver}</td>
                                            <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.bars.gold}</td>
                                            <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.bars.platinum}</td>
                                            <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.bars.iron}</td>
                                            <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.bars.coal}</td>

                                            <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                                {item.total.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={activeTab === 'user' ? (isAdmin ? 9 : 8) : 3} className="px-6 py-8 text-center text-gray-500">No users found</td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && selectedUserDetails && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 m-4 sm:m-0" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.farmName}</h2>
                                {isAdmin && <p className="text-sm text-gray-500 dark:text-gray-400">@{selectedUser.username}</p>}
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Total Breakdown */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Total Breakdown</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</div>
                                        <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedUserDetails.grandTotal.toLocaleString()}</div>
                                    </div>
                                    {(['silver', 'gold', 'platinum', 'iron', 'coal'] as const).map(type => (
                                        <div key={type} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-center">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">{type}</div>
                                            <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedUserDetails.totalBars[type].toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Entry History */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Entry History</h3>
                                <div className="border rounded-lg overflow-hidden border-gray-200 dark:border-gray-700">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3 text-right">Silver</th>
                                                <th className="px-4 py-3 text-right">Gold</th>
                                                <th className="px-4 py-3 text-right">Plat</th>
                                                <th className="px-4 py-3 text-right">Iron</th>
                                                <th className="px-4 py-3 text-right">Coal</th>
                                                <th className="px-4 py-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedUserDetails.userEntries.map((entry) => {
                                                const entryTotal = Object.values(entry.bars).reduce((a, b) => a + b, 0);
                                                return (
                                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                            {new Date(entry.timestamp).toLocaleDateString('en-US')}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{entry.bars.silver}</td>
                                                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{entry.bars.gold}</td>
                                                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{entry.bars.platinum}</td>
                                                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{entry.bars.iron}</td>
                                                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{entry.bars.coal}</td>
                                                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{entryTotal}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
