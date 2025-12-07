'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Reusing SearchableSelect (Ideally should be a shared component)
function SearchableSelect({ options, value, onChange, placeholder }: { options: any[], value: string, onChange: (val: string) => void, placeholder: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
    const selected = options.find(o => o.id === value);

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-700 p-3 rounded cursor-pointer flex justify-between items-center text-sm border border-gray-600 hover:border-gray-500 transition-colors"
            >
                <span className={selected ? 'text-white' : 'text-gray-400'}>
                    {selected ? selected.name : placeholder}
                </span>
                <span className="text-xs text-gray-400">▼</span>
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-600 z-50 max-h-60 overflow-y-auto rounded-b shadow-xl mt-1">
                    <input
                        className="w-full p-2 bg-gray-900 border-b border-gray-700 sticky top-0 text-sm outline-none focus:bg-gray-950 transition-colors"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search..."
                        autoFocus
                    />
                    {filtered.length > 0 ? filtered.map(opt => (
                        <div
                            key={opt.id}
                            onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(''); }}
                            className="p-2 hover:bg-blue-600 cursor-pointer text-sm transition-colors"
                        >
                            {opt.name}
                        </div>
                    )) : (
                        <div className="p-2 text-gray-500 text-sm">No results</div>
                    )}
                </div>
            )}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    );
}

export default function CreateGiveawayPage() {
    const router = useRouter();
    const [guilds, setGuilds] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        guildId: '',
        channelId: '',
        title: '🎉 New Giveaway',
        description: 'React with 🎉 to enter!',
        prize: '',
        winners: 1,
        durationValue: 1,
        durationUnit: 'h'
    });

    const [status, setStatus] = useState('');

    useEffect(() => {
        fetch('/api/bot/guilds')
            .then(res => res.json())
            .then(data => {
                if (data.success) setGuilds(data.data);
            });
    }, []);

    useEffect(() => {
        if (formData.guildId) {
            fetch(`/api/bot/guilds/${formData.guildId}/channels`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setChannels(data.data);
                });
        }
    }, [formData.guildId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.guildId || !formData.channelId || !formData.prize) {
            setStatus('Error: Please fill in all required fields.');
            return;
        }

        setStatus('Creating...');

        // Calculate duration in ms
        let multiplier = 60 * 1000; // minutes
        if (formData.durationUnit === 'h') multiplier = 60 * 60 * 1000;
        if (formData.durationUnit === 'd') multiplier = 24 * 60 * 60 * 1000;
        const duration = formData.durationValue * multiplier;

        try {
            const res = await fetch('/api/giveaways', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guildId: formData.guildId,
                    channelId: formData.channelId,
                    title: formData.title,
                    description: formData.description,
                    prize: formData.prize,
                    winners: formData.winners,
                    duration,
                    createdBy: 'Admin' // Should be dynamic
                })
            });

            const data = await res.json();
            if (data.success) {
                setStatus('Success! Redirecting...');
                setTimeout(() => router.push('/admin/giveaways'), 1000);
            } else {
                setStatus(`Error: ${data.error}`);
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold mb-8">Create Giveaway</h1>

                <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Guild</label>
                            <SearchableSelect
                                options={guilds}
                                value={formData.guildId}
                                onChange={val => setFormData({ ...formData, guildId: val })}
                                placeholder="Select Guild"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Channel</label>
                            <SearchableSelect
                                options={channels}
                                value={formData.channelId}
                                onChange={val => setFormData({ ...formData, channelId: val })}
                                placeholder="Select Channel"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Prize</label>
                        <input
                            type="text"
                            className="w-full bg-gray-700 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 1 Month Nitro"
                            value={formData.prize}
                            onChange={e => setFormData({ ...formData, prize: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Title</label>
                            <input
                                type="text"
                                className="w-full bg-gray-700 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Winners</label>
                            <input
                                type="number" min="1"
                                className="w-full bg-gray-700 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.winners}
                                onChange={e => setFormData({ ...formData, winners: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Description</label>
                        <textarea
                            className="w-full bg-gray-700 rounded p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-400">Duration</label>
                        <div className="flex gap-2">
                            <input
                                type="number" min="1"
                                className="flex-1 bg-gray-700 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.durationValue || ''}
                                onChange={e => setFormData({ ...formData, durationValue: parseInt(e.target.value) || 0 })}
                            />
                            <select
                                className="bg-gray-700 rounded p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.durationUnit}
                                onChange={e => setFormData({ ...formData, durationUnit: e.target.value })}
                            >
                                <option value="m">Minutes</option>
                                <option value="h">Hours</option>
                                <option value="d">Days</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={!!status && status.startsWith('Creating')}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-3 rounded-lg font-bold text-lg transition-all shadow-lg shadow-blue-900/20"
                        >
                            {status && status.startsWith('Creating') ? 'Creating...' : 'Launch Giveaway 🚀'}
                        </button>
                        {status && (
                            <p className={`mt-4 text-center font-medium ${status.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                                {status}
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
