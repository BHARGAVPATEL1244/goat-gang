'use client';

import React, { useState, useEffect } from 'react';
import { Entry, BarCounts } from '@/lib/types';
import { Plus, Trash2, Edit2, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminPanel() {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
    const [formData, setFormData] = useState<Partial<Entry>>({
        type: 'donation',
        bars: { silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0 }
    });

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, type: string } | null>(null);

    const fetchEntries = async () => {
        const res = await fetch('/api/entries', { cache: 'no-store' });
        const data = await res.json();
        setEntries(data);
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingEntry ? 'PUT' : 'POST';
        const body = {
            ...formData,
            id: editingEntry ? editingEntry.id : crypto.randomUUID(),
            timestamp: editingEntry ? editingEntry.timestamp : new Date().toISOString(),
        };

        try {
            const res = await fetch('/api/entries', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingEntry(null);
                setFormData({
                    type: 'donation',
                    bars: { silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0 }
                });
                fetchEntries();
            }
        } catch (error) {
            console.error('Failed to save entry', error);
        }
    };

    const handleDeleteClick = (id: string, type: string) => {
        setDeleteConfirmation({ id, type });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;

        try {
            const res = await fetch(`/api/entries?id=${deleteConfirmation.id}&type=${deleteConfirmation.type}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                fetchEntries();
                setDeleteConfirmation(null);
            }
        } catch (error) {
            console.error('Failed to delete entry', error);
        }
    };

    const openModal = (type: 'donation' | 'request', entry?: Entry) => {
        if (entry) {
            setEditingEntry(entry);
            setFormData(entry);
        } else {
            setEditingEntry(null);
            setFormData({
                type,
                bars: { silver: 0, gold: 0, platinum: 0, iron: 0, coal: 0 },
                farmName: '',
                username: '',
                neighborhood: ''
            });
        }
        setIsModalOpen(true);
    };

    const updateBarCount = (type: keyof BarCounts, value: string) => {
        const numValue = parseInt(value) || 0;
        setFormData(prev => ({
            ...prev,
            bars: {
                ...prev.bars!,
                [type]: numValue
            }
        }));
    };

    const handleExport = () => {
        const data = entries.map(e => ({
            Date: new Date(e.timestamp).toLocaleDateString('en-US'),
            Type: e.type,
            'Farm Name': e.farmName,
            Username: e.username,
            Neighborhood: e.neighborhood,
            Silver: e.bars.silver,
            Gold: e.bars.gold,
            Platinum: e.bars.platinum,
            Iron: e.bars.iron,
            Coal: e.bars.coal
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
        XLSX.writeFile(wb, "goat_gang_inventory.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h2>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export Excel
                    </button>
                    <button
                        onClick={() => openModal('request')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Request
                    </button>
                    <button
                        onClick={() => openModal('donation')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Donation
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-3 py-3 w-12">#</th>
                                <th className="px-3 py-3 hidden md:table-cell">Date</th>
                                <th className="px-3 py-3 hidden sm:table-cell">Type</th>
                                <th className="px-3 py-3">Farm Name</th>
                                <th className="px-3 py-3 hidden xl:table-cell">Username</th>
                                <th className="px-3 py-3 hidden lg:table-cell">Neighborhood</th>
                                {/* Individual bars on very large screens (2xl), Total on others */}
                                <th className="px-3 py-3 text-right hidden 2xl:table-cell">Silver</th>
                                <th className="px-3 py-3 text-right hidden 2xl:table-cell">Gold</th>
                                <th className="px-3 py-3 text-right hidden 2xl:table-cell">Plat</th>
                                <th className="px-3 py-3 text-right hidden 2xl:table-cell">Iron</th>
                                <th className="px-3 py-3 text-right hidden 2xl:table-cell">Coal</th>
                                <th className="px-3 py-3 text-right 2xl:hidden">Total Bars</th>
                                <th className="px-3 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {entries.map((entry, index) => {
                                const totalBars = Object.values(entry.bars).reduce((a, b) => a + b, 0);
                                return (
                                    <tr key={`${entry.type}-${entry.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-3 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                            {index + 1}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300 hidden md:table-cell">
                                            {new Date(entry.timestamp).toLocaleDateString('en-US')}
                                        </td>
                                        <td className="px-3 py-3 hidden sm:table-cell">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${entry.type === 'donation' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                }`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 font-medium text-gray-900 dark:text-white max-w-[150px] truncate" title={entry.farmName}>
                                            <div className="flex flex-col">
                                                <span className="truncate">{entry.farmName}</span>
                                                {/* Show username/hood on mobile if needed, or just hide to save space */}
                                                <span className="text-xs text-gray-400 lg:hidden truncate">{entry.neighborhood}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300 hidden xl:table-cell max-w-[120px] truncate" title={entry.username}>{entry.username}</td>
                                        <td className="px-3 py-3 text-gray-600 dark:text-gray-300 hidden lg:table-cell max-w-[120px] truncate" title={entry.neighborhood}>{entry.neighborhood}</td>

                                        {/* Individual bars */}
                                        <td className="px-3 py-3 text-right text-gray-400 dark:text-gray-500 hidden 2xl:table-cell">{entry.bars.silver}</td>
                                        <td className="px-3 py-3 text-right text-gray-400 dark:text-gray-500 hidden 2xl:table-cell">{entry.bars.gold}</td>
                                        <td className="px-3 py-3 text-right text-gray-400 dark:text-gray-500 hidden 2xl:table-cell">{entry.bars.platinum}</td>
                                        <td className="px-3 py-3 text-right text-gray-400 dark:text-gray-500 hidden 2xl:table-cell">{entry.bars.iron}</td>
                                        <td className="px-3 py-3 text-right text-gray-400 dark:text-gray-500 hidden 2xl:table-cell">{entry.bars.coal}</td>

                                        {/* Total bars */}
                                        <td className="px-3 py-3 text-right font-medium text-gray-900 dark:text-white 2xl:hidden">
                                            {totalBars}
                                        </td>

                                        <td className="px-3 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openModal(entry.type, entry)}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(entry.id, entry.type)}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm Deletion</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Are you sure you want to delete this entry? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 m-4 sm:m-0">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingEntry ? 'Edit Entry' : `Add ${formData.type === 'donation' ? 'Donation' : 'Request'}`}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Farm Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.farmName}
                                        onChange={e => setFormData(prev => ({ ...prev, farmName: e.target.value }))}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.username}
                                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Neighborhood</label>
                                    <select
                                        required
                                        value={formData.neighborhood}
                                        onChange={e => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Neighborhood</option>
                                        <option value="Goat Meadows">Goat Meadows</option>
                                        <option value="Goat Elysian">Goat Elysian</option>
                                        <option value="Goat Springs">Goat Springs</option>
                                        <option value="Goat Peak">Goat Peak</option>
                                        <option value="Goat Haven">Goat Haven</option>
                                        <option value="Goat Heath">Goat Heath</option>
                                        <option value="Goat Vista">Goat Vista</option>
                                        <option value="Goat Amity">Goat Amity</option>
                                        <option value="Goat Oblivion">Goat Oblivion</option>
                                        <option value="Goat Solace">Goat Solace</option>
                                        <option value="Visitor">Visitor</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Bar Quantities</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {(['silver', 'gold', 'platinum', 'iron', 'coal'] as const).map(type => (
                                        <div key={type}>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 capitalize">{type}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.bars?.[type]}
                                                onChange={e => updateBarCount(type, e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingEntry ? 'Save Changes' : 'Create Entry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
