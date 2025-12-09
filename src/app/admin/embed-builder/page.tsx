'use client';

import React, { useState, useEffect, Suspense } from 'react';
import EmbedPreview from '@/components/EmbedPreview';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { PERMISSIONS } from '@/utils/permissions';
import { getRolePermissions } from '@/app/actions/permissions';
import { Loader2 } from 'lucide-react';

// Searchable Select Component
function SearchableSelect({ options, value, onChange, placeholder }: { options: any[], value: string, onChange: (val: string) => void, placeholder: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
    const selected = options.find(o => o.id === value);

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="bg-gray-700 p-2 rounded cursor-pointer flex justify-between items-center text-sm border border-gray-600 hover:border-gray-500 transition-colors"
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

function EmbedBuilderContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const embedId = searchParams.get('id');

    // Access Control State
    const [loadingAccess, setLoadingAccess] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    // Existing State
    const [guilds, setGuilds] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [selectedGuild, setSelectedGuild] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('');
    const [messageId, setMessageId] = useState('');
    const [attachments, setAttachments] = useState<{ name: string, data: string }[]>([]);

    // Permission Check Effect
    useEffect(() => {
        const checkAccess = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                router.replace('/');
                return;
            }

            // 1. Fetch DB Permissions
            const dbPerms = await getRolePermissions();

            // 2. Fetch User Roles (Bot)
            let userRoles: string[] = [];
            const pid = session.user.app_metadata?.provider === 'discord'
                ? session.user.user_metadata?.provider_id
                : null;

            if (pid) {
                // Check Super Admin Override first
                const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',');
                if (ADMIN_USER_IDS.includes(pid)) {
                    // Inject Admin Role
                    userRoles = [...userRoles, PERMISSIONS.ROLES.ADMIN[0]];
                }

                try {
                    const res = await fetch(`/api/bot/membership?userId=${pid}`);
                    const data = await res.json();
                    if (data.user?.roles) {
                        userRoles = [...userRoles, ...data.user.roles];
                    }
                } catch (e) {
                    console.error('Bot role fetch failed', e);
                }
            }

            // 3. Verify Access
            const canManage = PERMISSIONS.canManageEmbeds(userRoles, dbPerms);
            if (!canManage) {
                router.replace('/admin'); // Redirect to dashboard which handles its own access logic or shows denied
            } else {
                setHasAccess(true);
                setLoadingAccess(false);
            }
        };

        checkAccess();
    }, []);

    if (loadingAccess) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!hasAccess) return null; // Should have redirected

    // ... rest of component ...

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
        fields: [] as { name: string, value: string, inline: boolean }[]
    }]);

    const [status, setStatus] = useState('');

    useEffect(() => {
        fetch('/api/bot/guilds')
            .then(res => res.json())
            .then(data => {
                if (data.success) setGuilds(data.data);
                else console.error(data.error);
            })
            .catch(err => console.error('Fetch Error:', err));
    }, []);

    useEffect(() => {
        if (selectedGuild) {
            fetch(`/api/bot/guilds/${selectedGuild}/channels`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setChannels(data.data);
                });
        }
    }, [selectedGuild]);

    // Load saved embed if ID is present
    useEffect(() => {
        if (embedId) {
            loadEmbed(embedId);
        }
    }, [embedId]);

    const loadEmbed = async (id: string) => {
        const { data, error } = await supabase
            .from('saved_embeds')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setEmbeds(data.data.embeds || []);
            setAttachments(data.data.attachments || []);
            setStatus(`Loaded: ${data.name}`);
        } else if (error) {
            console.error('Error loading embed:', error);
            setStatus(`Error loading embed: ${error.message}`);
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

        let error;
        if (embedId) {
            const res = await supabase.from('saved_embeds').update(payload).eq('id', embedId);
            error = res.error;
        } else {
            const res = await supabase.from('saved_embeds').insert([payload]);
            error = res.error;
        }

        if (error) {
            alert('Error saving: ' + error.message);
        } else {
            alert('Saved successfully!');
            router.push('/admin/saved-embeds');
        }
    };

    const updateActiveEmbed = (key: string, value: any) => {
        const newEmbeds = [...embeds];
        // @ts-ignore
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            // @ts-ignore
            newEmbeds[activeEmbedIndex][parent] = { ...newEmbeds[activeEmbedIndex][parent], [child]: value };
        } else {
            // @ts-ignore
            newEmbeds[activeEmbedIndex][key] = value;
        }
        setEmbeds(newEmbeds);
    };

    const addField = () => {
        const newEmbeds = [...embeds];
        newEmbeds[activeEmbedIndex].fields.push({ name: 'Field Name', value: 'Field Value', inline: false });
        setEmbeds(newEmbeds);
    };

    const updateField = (index: number, key: string, value: any) => {
        const newEmbeds = [...embeds];
        // @ts-ignore
        newEmbeds[activeEmbedIndex].fields[index][key] = value;
        setEmbeds(newEmbeds);
    };

    const removeField = (index: number) => {
        const newEmbeds = [...embeds];
        newEmbeds[activeEmbedIndex].fields = newEmbeds[activeEmbedIndex].fields.filter((_, i) => i !== index);
        setEmbeds(newEmbeds);
    };

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

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const addEmbed = () => {
        if (embeds.length >= 10) return alert('Max 10 embeds allowed');
        setEmbeds([...embeds, {
            title: 'New Embed',
            description: '',
            color: 0x0099ff,
            url: '',
            timestamp: '',
            footer: { text: '', icon_url: '' },
            image: { url: '' },
            thumbnail: { url: '' },
            author: { name: '', icon_url: '', url: '' },
            fields: []
        }]);
        setActiveEmbedIndex(embeds.length);
    };

    const removeEmbed = (index: number) => {
        if (embeds.length <= 1) return;
        const newEmbeds = embeds.filter((_, i) => i !== index);
        setEmbeds(newEmbeds);
        if (activeEmbedIndex >= newEmbeds.length) setActiveEmbedIndex(newEmbeds.length - 1);
    };

    const getPayload = () => {
        const payload: any = {
            guildId: selectedGuild,
            channelId: selectedChannel,
            embeds: embeds
        };

        if (attachments.length > 0) {
            payload.files = attachments.map(att => ({
                name: att.name,
                data: att.data.split(',')[1] // Strip prefix
            }));
        }
        return payload;
    };

    const handleSend = async () => {
        setStatus('Sending...');
        try {
            const res = await fetch('/api/bot/messages/send', {
                method: 'POST',
                body: JSON.stringify(getPayload())
            });
            const data = await res.json();
            if (data.success) {
                setStatus(`Sent! ID: ${data.data.messageId}`);
                setMessageId(data.data.messageId);
            } else {
                setStatus(`Error: ${data.error}`);
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    };

    const handleEdit = async () => {
        if (!messageId) return setStatus('No Message ID to edit');
        setStatus('Editing...');
        try {
            const payload = getPayload();
            payload.messageId = messageId;

            const res = await fetch('/api/bot/messages/edit', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) setStatus('Edited successfully!');
            else setStatus(`Error: ${data.error}`);
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    };

    const handleResend = async () => {
        if (!messageId) return setStatus('No Message ID to resend');
        setStatus('Resending...');
        try {
            const payload = getPayload();
            payload.messageId = messageId;

            const res = await fetch('/api/bot/messages/resend', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                setStatus(`Resent! New ID: ${data.data.messageId}`);
                setMessageId(data.data.messageId);
            } else {
                setStatus(`Error: ${data.error}`);
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    };

    const handleDelete = async () => {
        if (!messageId) return setStatus('No Message ID to delete');
        if (!confirm('Are you sure you want to delete this message from Discord?')) return;

        setStatus('Deleting...');
        try {
            const res = await fetch('/api/bot/messages/delete', {
                method: 'POST',
                body: JSON.stringify({
                    guildId: selectedGuild,
                    channelId: selectedChannel,
                    messageId
                })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('Deleted successfully!');
                setMessageId('');
            } else {
                setStatus(`Error: ${data.error}`);
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Embed Builder
                </h1>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-bold transition-colors">
                        Save Config
                    </button>
                    <button onClick={() => router.push('/admin/saved-embeds')} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold transition-colors">
                        View Saved
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Column */}
                <div className="space-y-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Select Guild</label>
                            <SearchableSelect
                                options={guilds}
                                value={selectedGuild}
                                onChange={setSelectedGuild}
                                placeholder="Select Guild"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-400">Select Channel</label>
                            <SearchableSelect
                                options={channels}
                                value={selectedChannel}
                                onChange={setSelectedChannel}
                                placeholder="Select Channel"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {embeds.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveEmbedIndex(i)}
                                className={`
                                    group flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-200 border
                                    ${activeEmbedIndex === i
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:border-gray-600'
                                    }
                                    min-w-fit
                                `}
                            >
                                <span className="font-medium text-sm whitespace-nowrap">Embed {i + 1}</span>
                                {embeds.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeEmbed(i);
                                        }}
                                        className={`
                                            p-0.5 rounded-full transition-colors
                                            ${activeEmbedIndex === i
                                                ? 'hover:bg-blue-500 text-blue-200 hover:text-white'
                                                : 'hover:bg-gray-700 text-gray-500 hover:text-red-400'
                                            }
                                        `}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                        {embeds.length < 10 && (
                            <button
                                onClick={addEmbed}
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-green-400 transition-all duration-200 flex-shrink-0"
                                title="Add Embed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold mb-3">Author</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text" placeholder="Author Name"
                                className="bg-gray-700 rounded p-2 w-full"
                                value={embeds[activeEmbedIndex].author.name}
                                onChange={e => updateActiveEmbed('author.name', e.target.value)}
                            />
                            <input
                                type="text" placeholder="Author Icon URL"
                                className="bg-gray-700 rounded p-2 w-full"
                                value={embeds[activeEmbedIndex].author.icon_url}
                                onChange={e => updateActiveEmbed('author.icon_url', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold mb-3">Top Images (Attachments)</h3>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-600 file:text-white
                                hover:file:bg-blue-500"
                            onChange={handleFileChange}
                        />
                        <div className="mt-2 space-y-1">
                            {attachments.map((att, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                                    <span className="text-xs text-gray-300 truncate">{att.name}</span>
                                    <button onClick={() => removeAttachment(i)} className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold mb-3">Content</h3>
                        <input
                            type="text" placeholder="Title"
                            className="bg-gray-700 rounded p-2 w-full mb-3 font-bold"
                            value={embeds[activeEmbedIndex].title}
                            onChange={e => updateActiveEmbed('title', e.target.value)}
                        />
                        <textarea
                            placeholder="Description"
                            className="bg-gray-700 rounded p-2 w-full h-32"
                            value={embeds[activeEmbedIndex].description}
                            onChange={e => updateActiveEmbed('description', e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    className="h-10 w-12 rounded cursor-pointer"
                                    value={`#${embeds[activeEmbedIndex].color.toString(16).padStart(6, '0')}`}
                                    onChange={e => updateActiveEmbed('color', parseInt(e.target.value.replace('#', ''), 16))}
                                />
                                <input
                                    type="text"
                                    placeholder="#0099ff"
                                    className="bg-gray-700 rounded p-2 w-full uppercase"
                                    value={`#${embeds[activeEmbedIndex].color.toString(16).padStart(6, '0')}`}
                                    onChange={e => {
                                        const hex = e.target.value.replace('#', '');
                                        if (/^[0-9A-F]{6}$/i.test(hex)) {
                                            updateActiveEmbed('color', parseInt(hex, 16));
                                        }
                                    }}
                                />
                            </div>
                            <input
                                type="text" placeholder="Thumbnail URL"
                                className="bg-gray-700 rounded p-2 w-full"
                                value={embeds[activeEmbedIndex].thumbnail.url}
                                onChange={e => updateActiveEmbed('thumbnail.url', e.target.value)}
                            />
                        </div>
                        <input
                            type="text" placeholder="Main Image URL"
                            className="bg-gray-700 rounded p-2 w-full mt-3"
                            value={embeds[activeEmbedIndex].image.url}
                            onChange={e => updateActiveEmbed('image.url', e.target.value)}
                        />
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">Fields</h3>
                            <button onClick={addField} className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm">
                                + Add Field
                            </button>
                        </div>
                        <div className="space-y-3">
                            {embeds[activeEmbedIndex].fields.map((field, i) => (
                                <div key={i} className="bg-gray-900 p-3 rounded flex gap-2 items-start">
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="text" placeholder="Name"
                                            className="bg-gray-700 rounded p-1 w-full text-sm"
                                            value={field.name}
                                            onChange={e => updateField(i, 'name', e.target.value)}
                                        />
                                        <textarea
                                            placeholder="Value"
                                            className="bg-gray-700 rounded p-1 w-full text-sm h-16"
                                            value={field.value}
                                            onChange={e => updateField(i, 'value', e.target.value)}
                                        />
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={field.inline}
                                                onChange={e => updateField(i, 'inline', e.target.checked)}
                                            /> Inline
                                        </label>
                                    </div>
                                    <button onClick={() => removeField(i)} className="text-red-400 hover:text-red-300">✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="text-lg font-semibold mb-3">Footer</h3>
                        <div className="flex gap-4">
                            <input
                                type="text" placeholder="Footer Text"
                                className="bg-gray-700 rounded p-2 w-full"
                                value={embeds[activeEmbedIndex].footer.text}
                                onChange={e => updateActiveEmbed('footer.text', e.target.value)}
                            />
                            <input
                                type="text" placeholder="Icon URL"
                                className="bg-gray-700 rounded p-2 w-1/3"
                                value={embeds[activeEmbedIndex].footer.icon_url}
                                onChange={e => updateActiveEmbed('footer.icon_url', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="space-y-6">
                    <div className="sticky top-8">
                        <h3 className="text-xl font-bold mb-4 text-gray-400">Preview</h3>
                        <EmbedPreview embeds={embeds} attachments={attachments} />

                        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mt-8">
                            <h3 className="text-lg font-semibold mb-4">Actions</h3>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Message ID (for Edit/Resend)"
                                        className="bg-gray-700 rounded p-2 flex-1 text-sm"
                                        value={messageId}
                                        onChange={e => setMessageId(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleSend} className="bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold">
                                        SEND NEW
                                    </button>
                                    <button onClick={handleEdit} className="bg-yellow-600 hover:bg-yellow-500 py-2 rounded font-bold">
                                        EDIT
                                    </button>
                                    <button onClick={handleResend} className="bg-purple-600 hover:bg-purple-500 py-2 rounded font-bold">
                                        RESEND
                                    </button>
                                    <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 py-2 rounded font-bold">
                                        DELETE
                                    </button>
                                </div>
                                {status && (
                                    <div className={`p-3 rounded text-center text-sm font-bold ${status.startsWith('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                                        {status}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EmbedBuilderPage() {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
            <EmbedBuilderContent />
        </Suspense>
    );
}
