import React from 'react';
import { Entry } from '@/lib/types';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface RecentActivityProps {
    entries: Entry[];
}

export default function RecentActivity({ entries }: RecentActivityProps) {
    const recentEntries = entries.slice(0, 50);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3 w-16">#</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Farm Name</th>
                            <th className="px-6 py-3">Neighborhood</th>
                            <th className="px-6 py-3 text-right">Total Bars</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {recentEntries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No activity yet
                                </td>
                            </tr>
                        ) : (
                            recentEntries.map((entry, index) => {
                                const isDonation = entry.type === 'donation';
                                const totalBars = Object.values(entry.bars).reduce((a, b) => a + b, 0);

                                return (
                                    <tr key={`${entry.type}-${entry.id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isDonation
                                                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                }`}>
                                                {isDonation ? (
                                                    <ArrowUpRight className="w-3 h-3" />
                                                ) : (
                                                    <ArrowDownLeft className="w-3 h-3" />
                                                )}
                                                {isDonation ? 'Donation' : 'Request'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {new Date(entry.timestamp).toLocaleDateString('en-US')}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {entry.farmName}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {entry.neighborhood}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                            {totalBars.toLocaleString('en-US')}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
