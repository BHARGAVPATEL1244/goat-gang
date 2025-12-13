'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit, Trash, Save, Hexagon, Upload, Trophy, ArrowUp } from 'lucide-react';
import NeighborhoodCard from '@/components/NeighborhoodCard';
import { useRouter } from 'next/navigation';

export default function MapManagerPage() {
    const supabase = createClient();
    const router = useRouter();
    const [districts, setDistricts] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        hood_id: '',
        tag: '',
        derby_req: '',
        level_req: 0,
        hood_reqs_text: '',
        derby_reqs_text: '',
        leader_name: '',
        image_url: '',
        sort_order: 0,
        trophy_gold: 0,
        trophy_silver: 0,
        trophy_bronze: 0
    });

    useEffect(() => {
        loadDistricts();
    }, []);

    const loadDistricts = async () => {
        setLoading(true);
        // Sort by sort_order
        const { data } = await supabase.from('map_districts').select('*').order('sort_order', { ascending: true });
        if (data) setDistricts(data);
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            // Find existing district to preserve invisible fields like q, r, created_at
            const existing = editingId ? districts.find(d => d.id === editingId) : null;

            const payload = {
                name: formData.name,
                hood_id: formData.hood_id,
                tag: formData.tag,
                derby_req: formData.derby_req,
                level_req: formData.level_req,
                hood_reqs_text: formData.hood_reqs_text,
                derby_reqs_text: formData.derby_reqs_text,
                leader_name: formData.leader_name,
                image_url: formData.image_url,
                sort_order: formData.sort_order,
                trophy_gold: formData.trophy_gold,
                trophy_silver: formData.trophy_silver,
                trophy_bronze: formData.trophy_bronze,
                // Ensure q and r are present to satisfy NOT NULL constraint
                q: existing ? existing.q : 0,
                r: existing ? existing.r : 0,
                type: 'District' // Default type (matches DB constraint 'Capital'/'District')
            };

            let error;
            if (editingId) {
                const res = await supabase.from('map_districts').update(payload).eq('id', editingId);
                error = res.error;
            } else {
                const res = await supabase.from('map_districts').insert([payload]);
                error = res.error;
            }

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            setEditingId(null);
            resetForm();
            loadDistricts();
        } catch (error: any) {
            alert('Error saving district: ' + (error.message || JSON.stringify(error)));
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', hood_id: '', tag: '', derby_req: '', level_req: 0,
            hood_reqs_text: '', derby_reqs_text: '', leader_name: '',
            image_url: '', sort_order: 0, trophy_gold: 0, trophy_silver: 0, trophy_bronze: 0
        });
    };

    const handleDelete = async (hood: any) => {
        if (!confirm('Delete this district?')) return;
        await supabase.from('map_districts').delete().eq('id', hood.id);
        loadDistricts();
    };

    const startEdit = (d: any) => {
        setEditingId(d.id);
        setFormData({
            name: d.name || '',
            hood_id: d.hood_id || '',
            tag: d.tag || '',
            derby_req: d.derby_req || '',
            level_req: d.level_req || 0,
            hood_reqs_text: d.hood_reqs_text || '',
            derby_reqs_text: d.derby_reqs_text || '',
            leader_name: d.leader_name || '',
            image_url: d.image_url || '',
            sort_order: d.sort_order || 0,
            trophy_gold: d.trophy_gold || 0,
            trophy_silver: d.trophy_silver || 0,
            trophy_bronze: d.trophy_bronze || 0
        });
        // Scroll to form
        document.getElementById('editor-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSync = async (d: any) => {
        if (!d.hood_id) return alert('No Discord Role ID set for this hood!');
        if (!confirm(`Sync members for ${d.name} from Discord?`)) return;

        try {
            const res = await fetch('/api/admin/sync-hood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hood_id: d.hood_id, hood_db_id: d.id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            alert(`Success! Synced ${data.count} members.`);
        } catch (err: any) {
            alert('Sync Failed: ' + err.message);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Trying 'images' bucket first, fall back to 'public' handled by error catch if needed
            // But we'll assume user followed directions to create a bucket
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, image_url: data.publicUrl }));

        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Helper to adapt District to NeighborhoodDB for Card
    const adaptToCard = (d: any) => ({
        id: d.id.toString(),
        name: d.name || 'Unnamed',
        image: d.image_url || '',
        leader: d.leader_name || 'None',
        tag: d.tag || '',
        text_color: '#ffffff',
        requirements: d.hood_reqs_text ? d.hood_reqs_text.split('\n') : [],
        derby_requirements: d.derby_reqs_text ? d.derby_reqs_text.split('\n') : [],
        // Pass extra data for card if we modify card later, but mainly for admin visualization now
        trophies: {
            gold: d.trophy_gold || 0,
            silver: d.trophy_silver || 0,
            bronze: d.trophy_bronze || 0
        },
        order: d.sort_order
    });

    return (
        <div className="p-8 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Hexagon className="text-yellow-500" /> Map Manager
            </h1>

            {/* Editor Form */}
            <div id="editor-form" className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-300">
                    {editingId ? 'Edit District' : 'Add New District'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-1">
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Sort Order</label>
                        <input
                            type="number"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full text-center font-mono text-yellow-500 font-bold"
                            value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="lg:col-span-3">
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Hood Name</label>
                        <input
                            type="text" placeholder="Hood Name"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full"
                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="lg:col-span-2">
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Leader Name</label>
                        <input
                            type="text" placeholder="Leader Name"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full"
                            value={formData.leader_name} onChange={e => setFormData({ ...formData, leader_name: e.target.value })}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Tag</label>
                        <input
                            type="text" placeholder="Tag (#XYZ)"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full"
                            value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Discord Role ID</label>
                        <input
                            type="text" placeholder="Role ID"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full font-mono text-sm"
                            value={formData.hood_id} onChange={e => setFormData({ ...formData, hood_id: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mt-6 border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase mb-3 text-xs tracking-wider flex items-center gap-2">
                        <Trophy size={14} /> Trophies & Image
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-yellow-900/20 p-2 rounded border border-yellow-700/30 text-center">
                            <label className="text-xs text-yellow-500 block mb-1">GOLD</label>
                            <input
                                type="number"
                                className="bg-transparent border-none text-center w-full font-bold text-xl"
                                value={formData.trophy_gold} onChange={e => setFormData({ ...formData, trophy_gold: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="bg-gray-400/20 p-2 rounded border border-gray-500/30 text-center">
                            <label className="text-xs text-gray-400 block mb-1">SILVER</label>
                            <input
                                type="number"
                                className="bg-transparent border-none text-center w-full font-bold text-xl"
                                value={formData.trophy_silver} onChange={e => setFormData({ ...formData, trophy_silver: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="bg-orange-900/20 p-2 rounded border border-orange-700/30 text-center">
                            <label className="text-xs text-orange-500 block mb-1">BRONZE</label>
                            <input
                                type="number"
                                className="bg-transparent border-none text-center w-full font-bold text-xl"
                                value={formData.trophy_bronze} onChange={e => setFormData({ ...formData, trophy_bronze: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="relative">
                            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Hood Image</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Image URL"
                                    className="bg-gray-900 border border-gray-700 rounded p-2 w-full text-xs"
                                    value={formData.image_url}
                                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                />
                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded flex items-center justify-center">
                                    <Upload size={16} />
                                    <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                </label>
                            </div>
                            {uploading && <div className="text-xs text-blue-400 mt-1">Uploading...</div>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <textarea
                        rows={3} placeholder="Requirements (one per line)"
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.hood_reqs_text} onChange={e => setFormData({ ...formData, hood_reqs_text: e.target.value })}
                    />
                    <textarea
                        rows={3} placeholder="Derby Rules (one per line)"
                        className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.derby_reqs_text} onChange={e => setFormData({ ...formData, derby_reqs_text: e.target.value })}
                    />
                </div>

                <div className="mt-6 flex gap-2">
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save District
                    </button>
                    {editingId && (
                        <button onClick={() => { setEditingId(null); resetForm(); }} className="bg-gray-700 px-4 py-2 rounded">
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Render List using NeighborhoodCard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {districts.map((d, index) => (
                    <div key={d.id} className="h-full relative group">
                        {/* Order Badge */}
                        <div className="absolute -top-3 -left-3 z-30 w-8 h-8 bg-yellow-500 text-black font-black rounded-full flex items-center justify-center border-2 border-black">
                            {d.sort_order}
                        </div>

                        <NeighborhoodCard
                            neighborhood={adaptToCard(d)}
                            index={index}
                            onEdit={() => startEdit(d)}
                            onSync={() => handleSync(d)}
                            onDelete={() => handleDelete(d)}
                            onManageMembers={() => router.push(`/admin/hood-members?hood_id=${d.hood_id}&name=${encodeURIComponent(d.name)}`)}
                        />
                        <div className="bg-gray-800 p-2 text-center text-xs text-gray-500 rounded-b-lg border-t border-gray-700">
                            ID: {d.hood_id || 'NaN'} | Trophies: {d.trophy_gold || 0}G / {d.trophy_silver || 0}S / {d.trophy_bronze || 0}B
                        </div>
                    </div>
                ))}
                {districts.length === 0 && (
                    <div className="col-span-3 text-center text-gray-500 py-10">
                        No districts found. Add one above!
                    </div>
                )}
            </div>
        </div >
    );
}

