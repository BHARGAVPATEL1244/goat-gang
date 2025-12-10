'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit, Trash, Save, Hexagon } from 'lucide-react';
import NeighborhoodCard from '@/components/NeighborhoodCard'; // Added import

import { useRouter } from 'next/navigation'; // Added import

export default function MapManagerPage() {
    const supabase = createClient();
    const router = useRouter(); // Hook must be here
    const [districts, setDistricts] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        hood_id: '',
        tag: '',
        derby_req: '',
        level_req: 0,
        type: 'Expansion',
        q: 0,
        r: 0,
        hood_reqs_text: '',
        derby_reqs_text: '',
        leader_name: '',
        leader_model: 'castle', // New Field
        coleader_model: 'market' // New Field
    });

    useEffect(() => {
        loadDistricts();
    }, []);

    const loadDistricts = async () => {
        setLoading(true);
        const { data } = await supabase.from('map_districts').select('*').order('created_at');
        if (data) setDistricts(data);
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: formData.name,
                hood_id: formData.hood_id,
                tag: formData.tag,
                derby_req: formData.derby_req,
                level_req: formData.level_req,
                type: formData.type,
                q: formData.q,
                r: formData.r,
                hood_reqs_text: formData.hood_reqs_text,
                derby_reqs_text: formData.derby_reqs_text,
                leader_name: formData.leader_name,
                leader_model: formData.leader_model,
                coleader_model: formData.coleader_model
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
            setFormData({
                name: '', hood_id: '', tag: '', derby_req: '', level_req: 0, type: 'Expansion', q: 0, r: 0,
                hood_reqs_text: '', derby_reqs_text: '', leader_name: '', leader_model: 'castle', coleader_model: 'market'
            });
            loadDistricts();
        } catch (error) {
            alert('Error saving district: ' + JSON.stringify(error));
        }
    };

    const handleDelete = async (hood: any) => {
        if (!confirm('Delete this district?')) return;
        await supabase.from('map_districts').delete().eq('id', hood.id);
        loadDistricts();
    };

    const startEdit = (d: any) => {
        setEditingId(d.id);
        const safeData = {
            ...d,
            hood_reqs_text: d.hood_reqs_text || '',
            derby_reqs_text: d.derby_reqs_text || '',
            leader_name: d.leader_name || '',
            leader_model: d.leader_model || 'castle',
            coleader_model: d.coleader_model || 'market'
        };
        setFormData(safeData);
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

    // Helper to adapt District to NeighborhoodDB for Card
    const adaptToCard = (d: any) => ({
        id: d.id.toString(), // Fix: Convert number ID to string
        name: d.name || 'Unnamed',
        image: '', // No image support in UI anymore
        // Use leader_name for leader
        leader: d.leader_name || 'None',
        tag: d.tag || '',
        // text_color not in map_districts, use white or add col later
        text_color: '#ffffff',
        // splitting raw text into arrays for card
        requirements: d.hood_reqs_text ? d.hood_reqs_text.split('\n') : [],
        derby_requirements: d.derby_reqs_text ? d.derby_reqs_text.split('\n') : [],
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
                    <input
                        type="text" placeholder="Hood Name"
                        className="bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <input
                        type="text" placeholder="Leader Name"
                        className="bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.leader_name} onChange={e => setFormData({ ...formData, leader_name: e.target.value })}
                    />
                    <input
                        type="text" placeholder="Tag (#XYZ)"
                        className="bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })}
                    />
                    <select
                        className="bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                        <option value="Capital">Capital (Center)</option>
                        <option value="Expansion">Expansion (Outer)</option>
                    </select>

                    {/* Hex Coordinates */}
                    <div className="flex gap-2">
                        <input
                            type="number" placeholder="Q"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full"
                            value={formData.q} onChange={e => setFormData({ ...formData, q: parseInt(e.target.value) })}
                        />
                        <input
                            type="number" placeholder="R"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full"
                            value={formData.r} onChange={e => setFormData({ ...formData, r: parseInt(e.target.value) })}
                        />
                    </div>

                    <input
                        type="text" placeholder="Discord Role ID"
                        className="bg-gray-900 border border-gray-700 rounded p-2 font-mono text-sm"
                        value={formData.hood_id} onChange={e => setFormData({ ...formData, hood_id: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

                {/* VISUAL CUSTOMIZATION */}
                <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 text-xs tracking-wider">House Visuals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Leader House</label>
                            <select
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                                value={formData.leader_model}
                                onChange={e => setFormData({ ...formData, leader_model: e.target.value })}
                            >
                                <option value="castle">Castle (Default)</option>
                                <option value="keep">Keep / Fort</option>
                                <option value="watchtower">Watchtower</option>
                                <option value="barracks">Barracks</option>
                                <option value="lumbermill">Lumbermill</option>
                                <option value="mine">Mine</option>
                                <option value="archeryrange">Archery Range</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Co-Leader House</label>
                            <select
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                                value={formData.coleader_model}
                                onChange={e => setFormData({ ...formData, coleader_model: e.target.value })}
                            >
                                <option value="market">Market (Default)</option>
                                <option value="mill">Windmill</option>
                                <option value="watermill">Watermill</option>
                                <option value="barracks">Barracks</option>
                                <option value="watchtower">Watchtower</option>
                                <option value="lumbermill">Lumbermill</option>
                                <option value="mine">Mine</option>
                                <option value="archeryrange">Archery Range</option>
                                <option value="house">Standard House</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save
                    </button>
                    {editingId && (
                        <button onClick={() => { setEditingId(null); setFormData({ name: '', hood_id: '', tag: '', derby_req: '', level_req: 0, type: 'Expansion', q: 0, r: 0, hood_reqs_text: '', derby_reqs_text: '', leader_name: '', leader_model: 'castle', coleader_model: 'market' }); }} className="bg-gray-700 px-4 py-2 rounded text-sm">
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Render List using NeighborhoodCard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {districts.map((d, index) => (
                    // We must adapt 'd' (map district) to 'NeighborhoodDB' shape for the card
                    <div key={d.id} className="h-full">
                        <NeighborhoodCard
                            neighborhood={adaptToCard(d)}
                            index={index}
                            onEdit={() => startEdit(d)}
                            onSync={() => handleSync(d)}
                            onDelete={() => handleDelete(d)}
                            onManageMembers={() => router.push(`/admin/hood-members?hood_id=${d.hood_id}&name=${encodeURIComponent(d.name)}`)}
                        />
                        {/* Optional small text for debug info not in card */}
                        <div className="text-center mt-2 text-xs text-mono text-gray-600">
                            Coords: ({d.q}, {d.r}) | ID: {d.hood_id || 'NaN'}
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
