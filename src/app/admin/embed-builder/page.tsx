'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { PERMISSIONS } from '@/utils/permissions';
import { getRolePermissions } from '@/app/actions/permissions';
import { Loader2, Upload, X, Save } from 'lucide-react';

import EmbedPreview from '@/components/EmbedPreview';
import GuildSelector from './components/GuildSelector';
import EmbedTabs from './components/EmbedTabs';
import EmbedEditor from './components/EmbedEditor';
import ActionPanel from './components/ActionPanel';

interface Attachment {
    name: string;
    data: string;
}

export default function EmbedBuilderPage() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const embedId = searchParams.get('id');

    // --- Access Control ---
    const [loadingAccess, setLoadingAccess] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.replace('/');
                return;
            }

            const dbPerms = await getRolePermissions();
            let userRoles: string[] = [];
            const pid = session.user.app_metadata?.provider === 'discord' ? session.user.user_metadata?.provider_id : null;

            if (pid) {
                const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',');
                if (ADMIN_USER_IDS.includes(pid)) userRoles.push(PERMISSIONS.ROLES.ADMIN[0]);
                try {
                    const res = await fetch(`/api/bot/membership?userId=${pid}`);
                    const data = await res.json();
                    if (data.user?.roles) userRoles = [...userRoles, ...data.user.roles];
                } catch (e) {
                    console.error('Bot role check failed', e);
                }
            }

            if (!PERMISSIONS.canManageEmbeds(userRoles, dbPerms)) {
                router.replace('/admin');
            } else {
                setHasAccess(true);
                setLoadingAccess(false);
            }
        };
        checkAccess();
    }, []);

    // --- State ---
    const [guilds, setGuilds] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [selectedGuild, setSelectedGuild] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('');
    const [messageId, setMessageId] = useState('');

    // Embed State
    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const [embeds, setEmbeds] = useState([{
        title: 'New Embed',
        description: 'This is a description.',
        color: 0x0099ff,
        url: '',
        timestamp: '',
        footer: { text: '', icon_url: '' },
        image: { url: '' },
        thumbnail: { url: '' },
        author: { name: '', icon_url: '', url: '' },
        fields: []
    }]);

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        if (!hasAccess) return;
        fetch('/api/bot/guilds')
            .then(res => res.json())
            .then(data => {
                if (data.success) setGuilds(data.data);
            })
            .catch(console.error);
    }, [hasAccess]);

    useEffect(() => {
        if (selectedGuild) {
            setChannels([]);
            setSelectedChannel(''); // Reset channel on guild change
            fetch(`/api/bot/guilds/${selectedGuild}/channels`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setChannels(data.data);
                });
        }
    }, [selectedGuild]);

    // Load Saved Embed
    useEffect(() => {
        if (embedId && hasAccess) {
            const load = async () => {
                const { data, error } = await supabase
                    .from('saved_embeds')
                    .select('*')
                    .eq('id', embedId)
                    .single();

                if (data) {
                    setEmbeds(data.data.embeds || []);
                    setAttachments(data.data.attachments || []);
                    setStatus(`Loaded: ${data.name}`);
                }
            };
            load();
        }
    }, [embedId, hasAccess]);

    // --- Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAttachments(prev => [...prev, {
                        name: file.name,
                        data: reader.result as string
                    }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSave = async () => {
        const name = prompt('Enter a name for this embed configuration:');
        if (!name) return;

        const payload = {
            name,
            data: { embeds, attachments },
            updated_at: new Date().toISOString()
        };

        const { error } = embedId
            ? await supabase.from('saved_embeds').update(payload).eq('id', embedId)
            : await supabase.from('saved_embeds').insert([payload]);

        if (error) alert('Error saving: ' + error.message);
        else {
            alert('Saved successfully!');
            router.push('/admin/saved-embeds');
        }
    };

    const apiCall = async (endpoint: string, extraData = {}) => {
        if (!selectedGuild || !selectedChannel) return setStatus('Error: Select Guild & Channel');
        setLoading(true);
        setStatus('Processing...');

        try {
            const payload: any = {
                guildId: selectedGuild,
                channelId: selectedChannel,
                embeds,
                ...extraData
            };

            if (attachments.length > 0) {
                payload.files = attachments.map(att => ({
                    name: att.name,
                    data: att.data.split(',')[1]
                }));
            }

            const res = await fetch(`/api/bot/messages/${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                setStatus('Success!');
                if (data.data?.messageId) setMessageId(data.data.messageId);
                if (endpoint === 'delete') setMessageId('');
            } else {
                setStatus(`Error: ${data.error}`);
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingAccess) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!hasAccess) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Embed Builder
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Create and manage Discord embeds</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm shadow-lg shadow-green-900/20"
                        >
                            <Save className="w-4 h-4" />
                            Save Config
                        </button>
                        <button
                            onClick={() => router.push('/admin/saved-embeds')}
                            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg font-bold transition-colors text-sm"
                        >
                            View Saved
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: Editor */}
                    <div className="space-y-6">
                        {/* 1. Global Settings */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
                            <h2 className="text-lg font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2">Target Destination</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <GuildSelector
                                    label="Select Guild"
                                    options={guilds}
                                    value={selectedGuild}
                                    onChange={setSelectedGuild}
                                    placeholder="Choose a Server"
                                />
                                <GuildSelector
                                    label="Select Channel"
                                    options={channels}
                                    value={selectedChannel}
                                    onChange={setSelectedChannel}
                                    placeholder="Choose a Channel"
                                    disabled={!selectedGuild}
                                />
                            </div>
                        </div>

                        {/* 2. Embed Editor */}
                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
                            <h2 className="text-lg font-semibold mb-6 text-gray-200 border-b border-gray-700 pb-2">Embed Content</h2>

                            <EmbedTabs
                                count={embeds.length}
                                activeIndex={activeEmbedIndex}
                                onSelect={setActiveEmbedIndex}
                                onAdd={() => {
                                    if (embeds.length >= 10) return alert('Max 10 embeds');
                                    setEmbeds([...embeds, { ...embeds[0], title: 'New Embed', fields: [] }]); // Clone basic structure
                                    setActiveEmbedIndex(embeds.length);
                                }}
                                onRemove={(idx) => {
                                    const newEmbeds = embeds.filter((_, i) => i !== idx);
                                    setEmbeds(newEmbeds);
                                    if (activeEmbedIndex >= newEmbeds.length) setActiveEmbedIndex(newEmbeds.length - 1);
                                }}
                            />

                            <EmbedEditor
                                embed={embeds[activeEmbedIndex]}
                                onChange={(updatedEmbed) => {
                                    const newEmbeds = [...embeds];
                                    newEmbeds[activeEmbedIndex] = updatedEmbed;
                                    setEmbeds(newEmbeds);
                                }}
                            />

                            {/* Attachments Section */}
                            <div className="mt-8 border-t border-gray-700 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Attachments</h3>
                                    <label className="bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-2">
                                        <Upload className="w-3.5 h-3.5" />
                                        Upload Image
                                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                                    </label>
                                </div>

                                {attachments.length > 0 ? (
                                    <div className="space-y-2">
                                        {attachments.map((att, i) => (
                                            <div key={i} className="flex items-center justify-between bg-gray-900/50 p-2.5 rounded-lg border border-gray-700">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded bg-gray-800 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${att.data})` }} />
                                                    <span className="text-sm text-gray-300 truncate">{att.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}
                                                    className="text-gray-500 hover:text-red-400 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 border-2 border-dashed border-gray-700/50 rounded-lg text-xs text-gray-500">
                                        No files attached
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Preview & Actions */}
                    <div className="space-y-6">
                        <div className="sticky top-24">
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Preview</h3>
                                <EmbedPreview embeds={embeds} attachments={attachments} />
                            </div>

                            <ActionPanel
                                messageId={messageId}
                                setMessageId={setMessageId}
                                onSend={() => apiCall('send')}
                                onEdit={() => apiCall('edit', { messageId })}
                                onResend={() => apiCall('resend', { messageId })}
                                onDelete={() => apiCall('delete', { messageId })}
                                status={status}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
