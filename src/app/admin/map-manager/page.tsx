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

    const [globalConfig, setGlobalConfig] = useState({
        role_id_coleader: '',
        role_id_elder: ''
    });

    useEffect(() => {
        loadDistricts();
        loadGlobalConfig();
    }, []);

    const loadGlobalConfig = async () => {
        const { data } = await supabase.from('app_config').select('*');
        if (data) {
            const config: any = {};
            data.forEach((row: any) => { config[row.key] = row.value; });
            setGlobalConfig(prev => ({ ...prev, ...config }));
        }
    };

    const saveGlobalConfig = async () => {
        try {
            const updates = [
                { key: 'role_id_coleader', value: globalConfig.role_id_coleader },
                { key: 'role_id_elder', value: globalConfig.role_id_elder }
            ];

            const { error } = await supabase.from('app_config').upsert(updates);
            if (error) throw error;
            alert('Global Settings Saved!');
        } catch (error: any) {
            alert('Error saving settings: ' + error.message);
        }
    };

    const loadDistricts = async () => {
        // ... existing loadDistricts ...

        const handleSave = async () => {
            // ... existing handleSave ...
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
                // REMOVED per-district role IDs
                type: 'District'
            };
            // ... existing save logic ...

            const resetForm = () => {
                setFormData({
                    name: '', hood_id: '', tag: '', derby_req: '', level_req: 0,
                    hood_reqs_text: '', derby_reqs_text: '', leader_name: '',
                    image_url: '', sort_order: 0, trophy_gold: 0, trophy_silver: 0, trophy_bronze: 0
                    // REMOVED per-district role IDs
                });
            };

            // ... existing handleDelete ...

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
                    // REMOVED per-district role IDs
                });
                document.getElementById('editor-form')?.scrollIntoView({ behavior: 'smooth' });
            };

            // ... existing handlers ...

            return (
                <div className="p-8 text-white min-h-screen">
                    <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                        <Hexagon className="text-yellow-500" /> Map Manager
                    </h1>

                    {/* GLOBAL CONFIGURATION */}
                    <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-500/30 mb-8">
                        <h2 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
                            Global Configuration
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                            <div>
                                <label className="text-xs text-orange-400 uppercase font-bold mb-1 block">Global Co-Leader Role ID</label>
                                <input
                                    type="text" placeholder="Discord Role ID"
                                    className="bg-gray-900 border border-gray-700 rounded p-2 w-full font-mono text-xs"
                                    value={globalConfig.role_id_coleader}
                                    onChange={e => setGlobalConfig(prev => ({ ...prev, role_id_coleader: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-purple-400 uppercase font-bold mb-1 block">Global Elder Role ID</label>
                                <input
                                    type="text" placeholder="Discord Role ID"
                                    className="bg-gray-900 border border-gray-700 rounded p-2 w-full font-mono text-xs"
                                    value={globalConfig.role_id_elder}
                                    onChange={e => setGlobalConfig(prev => ({ ...prev, role_id_elder: e.target.value }))}
                                />
                            </div>
                            <div>
                                <button onClick={saveGlobalConfig} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded font-bold text-sm w-full">
                                    Save Global Settings
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            * These Role IDs will be used for ALL neighborhoods to automatically assign Co-Leader and Elder ranks during Sync.
                        </p>
                    </div>

                    {/* Editor Form */}
                    <div id="editor-form" className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
                        {/* ... existing header ... */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* ... existing fields: Sort Order, Hood Name, Leader Name, Tag, Discord Role ID ... */}
                            {/* REMOVED Role ID Inputs that were here */}
                        </div>


                        <div className="mt-6 border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-bold text-yellow-500 uppercase mb-3 text-xs tracking-wider flex items-center gap-2">
                                <Trophy size={14} /> Trophies & Image
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-gray-900 p-2 rounded border border-gray-700 text-center">
                                    <label className="text-xs text-yellow-500 block mb-1">GOLD</label>
                                    <input
                                        type="number"
                                        className="bg-transparent border-none text-center w-full font-bold text-xl"
                                        value={formData.trophy_gold} onChange={e => setFormData({ ...formData, trophy_gold: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="bg-gray-900 p-2 rounded border border-gray-700 text-center">
                                    <label className="text-xs text-gray-400 block mb-1">SILVER</label>
                                    <input
                                        type="number"
                                        className="bg-transparent border-none text-center w-full font-bold text-xl"
                                        value={formData.trophy_silver} onChange={e => setFormData({ ...formData, trophy_silver: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="bg-gray-900 p-2 rounded border border-gray-700 text-center">
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
                    {/* Render List using NeighborhoodCard */}
                    <div className="flex flex-col gap-1">
                        {districts.map((d, index) => (
                            <div key={d.id} className="relative group">
                                <NeighborhoodCard
                                    neighborhood={adaptToCard(d)}
                                    index={index}
                                    variant="row"
                                    onEdit={() => startEdit(d)}
                                    onSync={() => handleSync(d)}
                                    onDelete={() => handleDelete(d)}
                                />
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

