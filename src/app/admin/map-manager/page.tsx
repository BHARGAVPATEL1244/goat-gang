'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, Edit, Trash, Save, Hexagon } from 'lucide-react';

export default function MapManagerPage() {
    const supabase = createClient();
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
        leader_name: ''
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
                leader_name: formData.leader_name
            };

            if (editingId) {
                await supabase.from('map_districts').update(payload).eq('id', editingId);
            } else {
                await supabase.from('map_districts').insert([payload]);
            }

            setEditingId(null);
            setFormData({
                name: '', hood_id: '', tag: '', derby_req: '', level_req: 0, type: 'Expansion', q: 0, r: 0,
                hood_reqs_text: '', derby_reqs_text: '', leader_name: ''
            });
            loadDistricts();
        } catch (error) {
            alert('Error saving district: ' + JSON.stringify(error));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this district?')) return;
        await supabase.from('map_districts').delete().eq('id', id);
        loadDistricts();
    };

    const startEdit = (d: any) => {
        setEditingId(d.id);
        const safeData = {
            ...d,
            hood_reqs_text: d.hood_reqs_text || '',
            derby_reqs_text: d.derby_reqs_text || '',
            leader_name: d.leader_name || ''
        };
        setFormData(safeData);
    };

    return (
        <div className="p-8 text-white min-h-screen">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <Hexagon className="text-yellow-500" /> Map Manager
            </h1>

            {/* Editor Form */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
                <h2 className="text-lg font-semibold mb-4 text-gray-300">
                    {editingId ? 'Edit District' : 'Add New District'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text" placeholder="Hood Name (e.g. Goat Alpha)"
                        className="bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <input
                        type="text" placeholder="Leader Name"
                        className="bg-gray-900 border border-gray-700 rounded p-2"
                        value={formData.leader_name} onChange={e => setFormData({ ...formData, leader_name: e.target.value })}
                    />
                    <input
                        type="text" placeholder="Tag (e.g. #XYZ)"
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
                            type="number" placeholder="Q" title="Hex Coordinate Q"
                            className="bg-gray-900 border border-gray-700 rounded p-2 w-full"
                            value={formData.q} onChange={e => setFormData({ ...formData, q: parseInt(e.target.value) })}
                        />
                        <input
                            type="number" placeholder="R" title="Hex Coordinate R"
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
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Hood Requirements (Detailed)</label>
                        <textarea
                            rows={4}
                            placeholder="Must be level 85+..."
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                            value={formData.hood_reqs_text} onChange={e => setFormData({ ...formData, hood_reqs_text: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Derby Requirements (Detailed)</label>
                        <textarea
                            rows={4}
                            placeholder="Must finish all tasks..."
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2"
                            value={formData.derby_reqs_text} onChange={e => setFormData({ ...formData, derby_reqs_text: e.target.value })}
                        />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save
                    </button>
                    {editingId && (
                        <button onClick={() => { setEditingId(null); setFormData({ name: '', hood_id: '', tag: '', derby_req: '', level_req: 0, type: 'Expansion', q: 0, r: 0, hood_reqs_text: '', derby_reqs_text: '', leader_name: '' }); }} className="bg-gray-700 px-4 py-2 rounded text-sm">
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {districts.map((d) => (
                    <div key={d.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex justify-between items-start group hover:border-gray-600 transition-colors">
                        <div>
                            <h3 className="font-bold text-lg text-white">{d.name || 'Unnamed Hood'}</h3>
                            <div className="text-xs text-blue-400 mb-1">Leader: {d.leader_name || 'None'}</div>
                            <div className="text-xs text-gray-500 mb-2 flex gap-2">
                                <span className={`px-1.5 rounded ${d.type === 'Capital' ? 'bg-yellow-900/50 text-yellow-500' : 'bg-green-900/50 text-green-500'}`}>
                                    {d.type}
                                </span>
                                <span>Tag: {d.tag}</span>
                            </div>
                            <div className="text-sm text-gray-400">
                                <div>Coords: ({d.q}, {d.r})</div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                            <button onClick={() => startEdit(d)} className="flex-1 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 py-2 rounded flex items-center justify-center gap-2 transition-colors">
                                <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => handleDelete(d.id)} className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 py-2 rounded flex items-center justify-center gap-2 transition-colors">
                                <Trash className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
