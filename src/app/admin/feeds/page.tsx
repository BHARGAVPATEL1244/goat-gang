'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { Rss, Youtube, MessageSquare, Trash, Save, Plus, ChevronRight, ChevronDown, Clock, Filter } from 'lucide-react';
import SearchableSelect from '@/components/admin/SearchableSelect';

interface FeedConfig {
    id?: string;
    guild_id: string;
    channel_id: string;
    platform: 'youtube' | 'reddit' | 'rss' | 'reddit_comments';
    source: string;
    message_template: string;
    is_enabled: boolean;
    check_interval_minutes: number;
    meta?: {
        min_length?: number;
        keywords?: string; // Comma separated
        ignore_automod?: boolean;
    };
}

const DEFAULT_TEMPLATE = {
    'youtube': "**New Video!** 🎥\n{title}\n{url}",
    'reddit': "**New Post in r/{subreddit}** 🔴\n{title}\n{url}",
    'rss': "**New Article** 📰\n{title}\n{url}",
    'reddit_comments': "**New Comment!** 💬\nOn: {title}\nBy: u/{author}\n\n{body}\n\n{url}"
};

export default function FeedManagerPage() {
    const supabase = createClient();
    const [feeds, setFeeds] = useState<FeedConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [guilds, setGuilds] = useState<{ id: string, name: string }[]>([]);
    const [channels, setChannels] = useState<{ id: string, name: string }[]>([]);

    // Editor State
    const [selectedGuild, setSelectedGuild] = useState<string>('');
    const [editingFeed, setEditingFeed] = useState<FeedConfig | null>(null);

    // 1. Fetch Guilds & Feeds
    useEffect(() => {
        loadInitialData();
    }, []);

    // 2. Fetch Channels when Guild Selected
    useEffect(() => {
        if (selectedGuild) fetchChannels(selectedGuild);
    }, [selectedGuild]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            // Fetch Guilds from Bot API
            const gRes = await fetch('/api/bot/guilds');
            const gData = await gRes.json();

            // Unpack
            const guildsList = Array.isArray(gData) ? gData : (gData.success && Array.isArray(gData.data) ? gData.data : null);

            if (guildsList && guildsList.length > 0) {
                setGuilds(guildsList);
                if (guildsList.length > 0) setSelectedGuild(guildsList[0].id);
            } else {
                console.warn("Invalid guilds data:", gData);
                setGuilds([]);
                toast.error(gData?.error || "Failed to load servers");
            }

            // Fetch Feeds from DB
            const { data } = await supabase.from('feed_configs').select('*');
            if (data) setFeeds(data);
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to load data: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchChannels = async (guildId: string) => {
        try {
            const res = await fetch(`/api/bot/guilds/${guildId}/channels`);
            const data = await res.json();

            // Unpack
            const channelsList = Array.isArray(data) ? data : (data.success && Array.isArray(data.data) ? data.data : null);

            if (channelsList) {
                setChannels(channelsList);
            } else {
                console.warn("Invalid channels data:", data);
                setChannels([]);
                toast.error(data?.error || "Failed to load channels");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error loading channels");
        }
    };

    const handleSave = async () => {
        if (!editingFeed) return;
        if (!editingFeed.channel_id || !editingFeed.source) {
            toast.error("Please fill required fields");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('feed_configs')
                .upsert({ ...editingFeed, guild_id: selectedGuild })
                .select()
                .single();

            if (error) throw error;

            toast.success("Feed Saved");
            setFeeds(prev => {
                const existing = prev.findIndex(f => f.id === data.id);
                if (existing >= 0) {
                    const newFeeds = [...prev];
                    newFeeds[existing] = data;
                    return newFeeds;
                }
                return [...prev, data];
            });
            setEditingFeed(null);
        } catch (e: any) {
            toast.error("Error saving: " + e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this feed?")) return;
        await supabase.from('feed_configs').delete().eq('id', id);
        setFeeds(prev => prev.filter(f => f.id !== id));
        toast.success("Deleted");
    };

    const startNewFeed = () => {
        setEditingFeed({
            guild_id: selectedGuild,
            channel_id: '',
            platform: 'youtube',
            source: '',
            message_template: DEFAULT_TEMPLATE['youtube'],
            is_enabled: true,
            check_interval_minutes: 15,
            meta: {}
        });
    };

    const getPlatformIcon = (vals: string) => {
        if (vals === 'youtube') return <Youtube className="text-red-500" />;
        if (vals === 'reddit') return <MessageSquare className="text-orange-500" />;
        if (vals === 'reddit_comments') return <MessageSquare className="text-orange-400" />;
        return <Rss className="text-blue-500" />;
    };

    const filteredFeeds = feeds.filter(f => f.guild_id === selectedGuild);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading Feeds...</div>;

    return (
        <div className="p-8 min-h-screen bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Rss className="text-yellow-500" /> Feed Manager
            </h1>

            {/* Server Selector */}
            <div className="mb-8 max-w-md">
                <SearchableSelect
                    label="Selected Server"
                    options={guilds}
                    value={selectedGuild}
                    onChange={setSelectedGuild}
                    placeholder="Select a Server"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIST COLUMN */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">Your Feeds</h2>
                        <button onClick={startNewFeed} className="bg-yellow-600 hover:bg-yellow-500 text-black px-3 py-1 rounded text-sm font-bold flex items-center gap-1">
                            <Plus size={16} /> New
                        </button>
                    </div>

                    {filteredFeeds.length === 0 && (
                        <div className="p-4 border border-gray-800 rounded bg-gray-900/50 text-gray-500 text-center text-sm">
                            No feeds configured for this server.
                        </div>
                    )}

                    {filteredFeeds.map(feed => (
                        <div
                            key={feed.id}
                            onClick={() => setEditingFeed(feed)}
                            className={`p-4 rounded border cursor-pointer transition-colors flex items-center justify-between group
                                ${editingFeed?.id === feed.id ? 'bg-gray-800 border-yellow-500' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {getPlatformIcon(feed.platform)}
                                <div>
                                    <div className="font-bold text-sm truncate w-40">
                                        {feed.platform === 'reddit_comments' ? 'Comments: ' : ''}
                                        {feed.source}
                                    </div>
                                    <div className="text-xs text-gray-500 flex gap-2">
                                        <span>#{channels.find(c => c.id === feed.channel_id)?.name || feed.channel_id}</span>
                                        <span>• {feed.check_interval_minutes}m</span>
                                    </div>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${feed.is_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                    ))}
                </div>

                {/* EDITOR COLUMN */}
                <div className="lg:col-span-2">
                    {editingFeed ? (
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-700 flex justify-between">
                                <span>{editingFeed.id ? 'Edit Feed' : 'New Feed'}</span>
                                {editingFeed.id && (
                                    <button onClick={() => handleDelete(editingFeed.id!)} className="text-red-500 hover:text-red-400">
                                        <Trash size={18} />
                                    </button>
                                )}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Platform</label>
                                    <select
                                        value={editingFeed.platform}
                                        onChange={e => {
                                            const plat = e.target.value as any;
                                            setEditingFeed({
                                                ...editingFeed,
                                                platform: plat,
                                                message_template: DEFAULT_TEMPLATE[plat as 'youtube'] || DEFAULT_TEMPLATE['youtube']
                                            });
                                        }}
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                                    >
                                        <option value="youtube">YouTube</option>
                                        <option value="reddit">Reddit Posts</option>
                                        <option value="reddit_comments">Reddit Comments</option>
                                        <option value="rss">RSS Feed</option>
                                    </select>
                                </div>
                                <div>
                                    <SearchableSelect
                                        label="Target Channel"
                                        options={channels}
                                        value={editingFeed.channel_id}
                                        onChange={(val) => setEditingFeed({ ...editingFeed, channel_id: val })}
                                        placeholder="Select Channel"
                                        disabled={!selectedGuild}
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">
                                    {editingFeed.platform === 'youtube' ? 'Channel ID or User' :
                                        editingFeed.platform.startsWith('reddit') ? (editingFeed.platform === 'reddit_comments' ? 'Reddit Post URL' : 'Subreddit Name') :
                                            'RSS URL'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={
                                        editingFeed.platform === 'youtube' ? 'UC12345...' :
                                            editingFeed.platform === 'reddit' ? 'webdev' :
                                                editingFeed.platform === 'reddit_comments' ? 'https://reddit.com/r/...' : 'https://...'
                                    }
                                    value={editingFeed.source}
                                    onChange={e => setEditingFeed({ ...editingFeed, source: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 font-mono text-white"
                                />
                            </div>

                            {/* Advanced Filters for Reddit Comments */}
                            {editingFeed.platform === 'reddit_comments' && (
                                <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                                    <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                                        <Filter size={14} /> Comment Filters
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Min Character Length</label>
                                            <input
                                                type="number"
                                                value={editingFeed.meta?.min_length || 0}
                                                onChange={e => setEditingFeed({ ...editingFeed, meta: { ...editingFeed.meta, min_length: parseInt(e.target.value) || 0 } })}
                                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Ignore AutoMod</label>
                                            <div className="flex items-center h-10">
                                                <input
                                                    type="checkbox"
                                                    checked={editingFeed.meta?.ignore_automod !== false} // Default to true if undefined
                                                    onChange={e => setEditingFeed({ ...editingFeed, meta: { ...editingFeed.meta, ignore_automod: e.target.checked } })}
                                                    className="w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-700"
                                                />
                                                <span className="ml-2 text-sm text-gray-400">Yes, ignore bots</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Keywords (Optional, Comma Separated)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. giveaway, help, urgent"
                                                value={editingFeed.meta?.keywords || ''}
                                                onChange={e => setEditingFeed({ ...editingFeed, meta: { ...editingFeed.meta, keywords: e.target.value } })}
                                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 font-mono text-sm text-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Message Template</label>
                                <textarea
                                    value={editingFeed.message_template}
                                    onChange={e => setEditingFeed({ ...editingFeed, message_template: e.target.value })}
                                    rows={4}
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 font-mono text-sm text-white"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    Variables: <code>{'{title}'}, {'{url}'}, {'{author}'}, {'{body}'}</code>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                                <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded font-bold flex justify-center items-center gap-2 text-white">
                                    <Save size={18} /> Save Feed
                                </button>

                                {/* Interval Setting */}
                                <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded border border-gray-600">
                                    <Clock size={16} className="text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        value={editingFeed.check_interval_minutes || 15}
                                        onChange={e => setEditingFeed({ ...editingFeed, check_interval_minutes: parseInt(e.target.value) || 15 })}
                                        className="w-12 bg-transparent text-center focus:outline-none text-white font-mono"
                                        title="Check interval in minutes"
                                    />
                                    <span className="text-xs text-gray-500">min</span>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer bg-gray-900 px-4 py-2 rounded border border-gray-600 text-white">
                                    <input
                                        type="checkbox"
                                        checked={editingFeed.is_enabled}
                                        onChange={e => setEditingFeed({ ...editingFeed, is_enabled: e.target.checked })}
                                    />
                                    <span className="text-sm">Enabled</span>
                                </label>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 border border-dashed border-gray-700 rounded-xl p-12">
                            <Rss size={48} className="mb-4 opacity-20" />
                            <p>Select a feed to edit or create a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
