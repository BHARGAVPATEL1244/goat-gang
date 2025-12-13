'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';

interface Channel {
    id: string;
    name: string;
    type: number;
}

interface WelcomeConfig {
    guild_id: string; // "default" or specific ID
    channel_id: string;
    message_content: string;
    embed_title: string;
    embed_description: string;
    embed_footer: string;
    embed_image_url: string;
    show_user_pfp: boolean;
    is_enabled: boolean;
}

const DEFAULT_CONFIG: WelcomeConfig = {
    guild_id: 'default',
    channel_id: '',
    message_content: 'Welcome to the Goat Gang, {user}!',
    embed_title: 'Welcome, {user}!',
    embed_description: 'We are glad to have you here. Please familiarize yourself with the rules and enjoy your stay!',
    embed_footer: 'Goat Gang Management',
    embed_image_url: '',
    show_user_pfp: true,
    is_enabled: true
};

export default function WelcomeManagerPage() {
    const [config, setConfig] = useState<WelcomeConfig>(DEFAULT_CONFIG);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    // We assume a single "Main" guild for now, or fetch active guild ID context.
    // For this implementation, we'll fetch channels for a hardcoded guild ID or first available one.
    // TODO: Ideally context provides this. For now let's fetch guilds first.
    const [guildId, setGuildId] = useState<string | null>(null);
    const [guilds, setGuilds] = useState<{ id: string, name: string }[]>([]);

    // 1. Fetch Guilds
    useEffect(() => {
        const fetchGuilds = async () => {
            try {
                const gRes = await fetch('/api/bot/guilds');
                const gData = await gRes.json();

                if (Array.isArray(gData) && gData.length > 0) {
                    setGuilds(gData);
                    setGuildId(gData[0].id); // Default to first
                } else {
                    console.warn("Invalid guilds data:", gData);
                    setGuilds([]);
                    const errMsg = gData?.error || "Bot is not in any guilds or API error";
                    toast.error(errMsg);
                    setLoading(false);
                }
            } catch (e) {
                console.error("Error fetching guilds:", e);
                toast.error("Failed to load servers");
                setLoading(false);
            }
        };
        fetchGuilds();
    }, []);

    // 2. Fetch Channels & Config when Guild Changes
    useEffect(() => {
        if (!guildId) return;
        setLoading(true);

        const fetchData = async () => {
            try {
                // Fetch Channels
                const cRes = await fetch(`/api/bot/guilds/${guildId}/channels`);
                const cData = await cRes.json();
                if (cData && cData.data) {
                    setChannels(cData.data);
                } else {
                    setChannels([]);
                }

                // Fetch Config
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('welcome_configs')
                    .select('*')
                    .eq('guild_id', guildId)
                    .single();

                if (data) {
                    setConfig(data);
                } else {
                    // Reset to default if no config found for this guild
                    // Preserve guild_id
                    setConfig({ ...DEFAULT_CONFIG, guild_id: guildId });
                }
            } catch (error) {
                console.error("Error loading guild data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [guildId]);

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();

        // Upsert
        const { error } = await supabase
            .from('welcome_configs')
            .upsert({ ...config, guild_id: guildId || 'default' });

        if (error) {
            toast.error('Failed to save config');
            console.error(error);
        } else {
            toast.success('Welcome config saved!');
        }
        setSaving(false);
    };

    const handleTest = async () => {
        if (!config.channel_id) {
            toast.error("Please select a channel first");
            return;
        }
        setTesting(true);
        try {
            await fetch('/api/bot/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: config.channel_id,
                    content: config.message_content.replace('{user}', '@TestUser'),
                    embeds: [{
                        title: config.embed_title.replace('{user}', 'TestUser'),
                        description: config.embed_description,
                        footer: { text: config.embed_footer },
                        image: config.embed_image_url ? { url: config.embed_image_url } : undefined,
                        thumbnail: config.show_user_pfp ? { url: 'https://cdn.discordapp.com/embed/avatars/0.png' } : undefined,
                        color: 0xFACC15 // Yellow-400 equivalent
                    }]
                })
            });
            toast.success("Test message sent!");
        } catch (e) {
            toast.error("Failed to send test");
        }
        setTesting(false);
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-6 md:p-12 min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* --- Left Column: Configuration Form --- */}
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">
                        Welcome Embed Manager
                    </h1>
                    <p className="text-gray-400 mb-8">
                        Configure the automated welcome message for new members.
                    </p>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">

                        {/* Server Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Select Server</label>
                            <select
                                value={guildId || ''}
                                onChange={e => setGuildId(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                            >
                                {guilds.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Channel Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Welcome Channel</label>
                            <select
                                value={config.channel_id}
                                onChange={e => setConfig({ ...config, channel_id: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                            >
                                <option value="">-- Select Channel --</option>
                                {channels.map(c => (
                                    <option key={c.id} value={c.id}>#{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Top Message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Message Content <span className="text-gray-500 text-xs">(Outside Embed)</span>
                            </label>
                            <textarea
                                value={config.message_content}
                                onChange={e => setConfig({ ...config, message_content: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 h-20 text-sm"
                                placeholder="Welcome to the server {user}!"
                            />
                            <p className="text-xs text-gray-500 mt-1">Use <code>{'{user}'}</code> to mention the new member.</p>
                        </div>

                        {/* Embed Title */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Headline (Title)</label>
                                <input
                                    type="text"
                                    value={config.embed_title}
                                    onChange={e => setConfig({ ...config, embed_title: e.target.value })}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                                />
                            </div>
                            <div className="w-1/3 flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.show_user_pfp}
                                        onChange={e => setConfig({ ...config, show_user_pfp: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-700"
                                    />
                                    <span className="text-sm text-gray-300">Show User PFP</span>
                                </label>
                            </div>
                        </div>

                        {/* Embed Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Small Text (Description)</label>
                            <textarea
                                value={config.embed_description}
                                onChange={e => setConfig({ ...config, embed_description: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 h-24 text-sm"
                            />
                        </div>

                        {/* Embed Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Image/GIF URL</label>
                            <input
                                type="text"
                                value={config.embed_image_url}
                                onChange={e => setConfig({ ...config, embed_image_url: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Footer */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Bottom Text (Footer)</label>
                            <textarea
                                value={config.embed_footer}
                                onChange={e => setConfig({ ...config, embed_footer: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 h-16 text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-gray-800">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition shadow-lg shadow-yellow-900/20"
                            >
                                {saving ? 'Saving...' : '💾 Save Configuration'}
                            </button>
                            <button
                                onClick={handleTest}
                                disabled={testing}
                                className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
                            >
                                {testing ? 'Sending...' : '📨 Send Test'}
                            </button>
                        </div>

                    </div>
                </div>

                {/* --- Right Column: Live Preview --- */}
                <div className="lg:sticky lg:top-12 h-fit">
                    <h2 className="text-xl font-bold mb-4 text-gray-400">Live Preview</h2>

                    {/* Discord Message Preview Container */}
                    <div className="bg-[#313338] rounded p-4 font-sans text-gray-100 max-w-md mx-auto lg:mx-0 shadow-2xl border border-gray-800">

                        {/* Avatar & Username Header */}
                        <div className="flex gap-3 mb-1">
                            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">Bot</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-white">Goat Gang Bot</span>
                                    <span className="bg-[#5865F2] text-[10px] px-1 rounded text-white font-medium">BOT</span>
                                    <span className="text-xs text-gray-400">Today at 12:00 PM</span>
                                </div>
                                <div className="text-gray-300 whitespace-pre-wrap">
                                    {config.message_content.replace('{user}', '@TestUser')}
                                </div>
                            </div>
                        </div>

                        {/* Embed */}
                        <div className="ml-[52px] bg-[#2B2D31] rounded border-l-4 border-yellow-400 p-4 max-w-full overflow-hidden">
                            <div className="grid gap-2">
                                {/* Author/Title & Thumbnail */}
                                <div className="flex justify-between items-start gap-4">
                                    <div className="font-bold text-white text-md">
                                        {config.embed_title.replace('{user}', 'TestUser')}
                                    </div>
                                    {config.show_user_pfp && (
                                        <div className="w-12 h-12 rounded-full bg-gray-600 flex-shrink-0 overflow-hidden">
                                            <img src="https://cdn.discordapp.com/embed/avatars/0.png" alt="User PFP" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                    {config.embed_description || 'Small text description goes here...'}
                                </div>

                                {/* Main Image */}
                                {config.embed_image_url && (
                                    <div className="mt-2 rounded-lg overflow-hidden max-h-60">
                                        <img
                                            src={config.embed_image_url}
                                            alt="Embed Media"
                                            className="w-full h-full object-cover"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}

                                {/* Footer */}
                                {config.embed_footer && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                        <span>{config.embed_footer}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <p className="text-center text-gray-600 text-xs mt-4">
                        * This is an approximation. Actual rendering may vary slightly on Discord.
                    </p>
                </div>
            </div>
        </div>
    );
}
