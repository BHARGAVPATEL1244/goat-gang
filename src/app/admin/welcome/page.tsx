'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import SearchableSelect from '@/components/admin/SearchableSelect';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    embed_color: string;
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
    embed_color: '#FACC15',
    embed_image_url: '',
    show_user_pfp: true,
    is_enabled: true
};

export default function WelcomeManagerPage() {
    const router = useRouter();
    const [config, setConfig] = useState<WelcomeConfig>(DEFAULT_CONFIG);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);

    // We assume a single "Main" guild for now, or fetch active guild ID context.
    const [guildId, setGuildId] = useState<string | null>(null);
    const [guilds, setGuilds] = useState<{ id: string, name: string }[]>([]);

    // 1. Fetch Guilds
    useEffect(() => {
        const fetchGuilds = async () => {
            try {
                const gRes = await fetch('/api/bot/guilds');
                const gData = await gRes.json();

                // Unpack API response (supports {success: true, data: []} or raw [])
                const guildsList = Array.isArray(gData) ? gData : (gData.success && Array.isArray(gData.data) ? gData.data : null);

                if (guildsList && guildsList.length > 0) {
                    setGuilds(guildsList);
                    setGuildId(guildsList[0].id); // Default to first
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

                // Unpack (supports {success: true, data: []} or raw [])
                const channelsList = Array.isArray(cData) ? cData : (cData.success && Array.isArray(cData.data) ? cData.data : []);

                if (channelsList.length > 0) {
                    setChannels(channelsList);
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
                    // Merge with default to ensure new fields like embed_color exist if DB record is old
                    setConfig({ ...DEFAULT_CONFIG, ...data });
                } else {
                    // Reset to default if no config found for this guild
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
            const res = await fetch('/api/bot/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guildId: guildId,
                    channelId: config.channel_id,
                    content: config.message_content.replace('{user}', '@TestUser'),
                    embeds: [{
                        title: config.embed_title.replace('{user}', 'TestUser'),
                        description: config.embed_description,
                        footer: { text: config.embed_footer },
                        image: config.embed_image_url ? { url: config.embed_image_url } : undefined,
                        thumbnail: config.show_user_pfp ? { url: 'https://cdn.discordapp.com/embed/avatars/0.png' } : undefined,
                        color: parseInt(config.embed_color.replace('#', ''), 16) || 0xFACC15
                    }]
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to send');
            }

            toast.success("Test message sent!");
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to send test: " + e.message);
        }
        setTesting(false);
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

    return (
        <div className="p-6 md:p-12 min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* --- Left Column: Configuration Form --- */}
                <div>
                    <button
                        onClick={() => router.push('/admin')}
                        className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold mb-2 text-white">
                        Welcome Embed Manager
                    </h1>
                    <p className="text-gray-400 mb-8">
                        Configure the automated welcome message for new members.
                    </p>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">

                        {/* Enable/Disable Switch */}
                        <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
                            <div>
                                <h3 className="text-white font-bold">Enable Welcome Message</h3>
                                <p className="text-xs text-gray-400">Toggle the automated welcome message for this server.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={config.is_enabled}
                                    onChange={e => setConfig({ ...config, is_enabled: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                            </label>
                        </div>

                        {/* Server Selection */}
                        <SearchableSelect
                            label="Select Server"
                            options={guilds}
                            value={guildId || ''}
                            onChange={(val) => setGuildId(val)}
                            placeholder="Select a Server"
                            className="mb-6"
                        />

                        {/* Channel Selection */}
                        <SearchableSelect
                            label="Welcome Channel"
                            options={channels}
                            value={config.channel_id}
                            onChange={(val) => setConfig({ ...config, channel_id: val })}
                            placeholder="Select Channel"
                            className="mb-6"
                            disabled={!guildId}
                        />

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

                        {/* Embed Color Picker */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Embed Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={config.embed_color || '#FACC15'}
                                    onChange={e => setConfig({ ...config, embed_color: e.target.value })}
                                    className="h-10 w-20 bg-transparent border-0 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={config.embed_color || '#FACC15'}
                                    onChange={e => setConfig({ ...config, embed_color: e.target.value })}
                                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono w-32 uppercase"
                                />
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
                        <div
                            className="ml-[52px] bg-[#2B2D31] rounded border-l-4 p-4 max-w-full overflow-hidden"
                            style={{ borderLeftColor: config.embed_color || '#FACC15' }}
                        >
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
                                <img
                                    src={config.embed_image_url}
                                    alt="Embed Media"
                                    className="mt-2 rounded-lg overflow-hidden max-h-60 w-full object-cover"
                                    style={{ display: config.embed_image_url ? 'block' : 'none' }}
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />

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
