'use client';

import React, { useState, useEffect } from 'react';
import { NeighborhoodDB } from '@/lib/types';
import { getNeighborhoods, createNeighborhood, updateNeighborhood, deleteNeighborhood } from '@/app/actions/neighborhoods';
import { Plus, Trash2, Save, Edit2, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminNeighborhoods() {
    const [neighborhoods, setNeighborhoods] = useState<NeighborhoodDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [newHood, setNewHood] = useState<Partial<NeighborhoodDB>>({
        name: '',
        image: '',
        text_color: '#ffffff',
        requirements: [],
        derby_requirements: [],
        tag: '',
        leader: '',
    });
    const [reqInput, setReqInput] = useState('');
    const [derbyReqInput, setDerbyReqInput] = useState('');
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('neighborhoods')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('neighborhoods')
                .getPublicUrl(filePath);

            setNewHood(prev => ({ ...prev, image: publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Make sure the storage bucket exists.');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        loadNeighborhoods();
    }, []);

    const loadNeighborhoods = async () => {
        setLoading(true);
        const data = await getNeighborhoods();
        setNeighborhoods(data);
        setLoading(false);
    };

    const handleAddRequirement = () => {
        if (reqInput.trim()) {
            setNewHood({
                ...newHood,
                requirements: [...(newHood.requirements || []), reqInput.trim()]
            });
            setReqInput('');
        }
    };

    const handleAddDerbyRequirement = () => {
        if (derbyReqInput.trim()) {
            setNewHood({
                ...newHood,
                derby_requirements: [...(newHood.derby_requirements || []), derbyReqInput.trim()]
            });
            setDerbyReqInput('');
        }
    };

    const handleEdit = (hood: NeighborhoodDB) => {
        setNewHood({
            name: hood.name,
            image: hood.image,
            text_color: hood.text_color,
            requirements: hood.requirements,
            derby_requirements: hood.derby_requirements,
            tag: hood.tag,
            leader: hood.leader,
        });
        setEditingId(hood.id);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewHood({
            name: '',
            image: '',
            text_color: '#ffffff',
            requirements: [],
            derby_requirements: [],
            tag: '',
            leader: '',
        });
    };

    const handleSave = async () => {
        if (!newHood.name || !newHood.image) {
            alert('Please fill in Name and Image URL');
            return;
        }

        let result;
        if (editingId) {
            result = await updateNeighborhood(editingId, newHood);
        } else {
            result = await createNeighborhood(newHood);
        }

        if (result && !result.success) {
            alert(`Error saving neighborhood: ${result.error}`);
            return;
        }

        await loadNeighborhoods();
        handleCancel();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this neighborhood?')) {
            await deleteNeighborhood(id);
            await loadNeighborhoods();
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Neighborhoods</h2>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Neighborhood
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{editingId ? 'Edit Neighborhood' : 'New Neighborhood Details'}</h3>
                        <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                type="text"
                                value={newHood.name}
                                onChange={e => setNewHood({ ...newHood, name: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="Big Bold Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Neighborhood Image</label>
                            <div className="space-y-2">
                                {/* Preview */}
                                {newHood.image && (
                                    <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                        <img src={newHood.image} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setNewHood({ ...newHood, image: '' })}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {/* Upload Button */}
                                {!newHood.image && (
                                    <div className="relative group">
                                        <div className={`flex items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg appearance-none cursor-pointer hover:border-blue-500 focus:outline-none ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <div className="flex flex-col items-center space-y-2">
                                                {uploading ? (
                                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                ) : (
                                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                                                )}
                                                <span className="font-medium text-gray-600 dark:text-gray-400 group-hover:text-blue-500">
                                                    {uploading ? 'Uploading...' : 'Click to Upload Image'}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={uploading}
                                                onChange={handleImageUpload}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    <span>Supported: JPG, PNG, WEBP</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Text Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={newHood.text_color}
                                    onChange={e => setNewHood({ ...newHood, text_color: e.target.value })}
                                    className="h-10 w-10 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={newHood.text_color}
                                    onChange={e => setNewHood({ ...newHood, text_color: e.target.value })}
                                    className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tag</label>
                            <input
                                type="text"
                                value={newHood.tag}
                                onChange={e => setNewHood({ ...newHood, tag: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="#TAG123"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Leader</label>
                            <input
                                type="text"
                                value={newHood.leader}
                                onChange={e => setNewHood({ ...newHood, leader: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Derby Requirements (Multiple)</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={derbyReqInput}
                                onChange={e => setDerbyReqInput(e.target.value)}
                                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="Add a derby requirement..."
                                onKeyDown={e => e.key === 'Enter' && handleAddDerbyRequirement()}
                            />
                            <button onClick={handleAddDerbyRequirement} type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {newHood.derby_requirements?.map((req, idx) => (
                                <span key={idx} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                    {req}
                                    <button onClick={() => setNewHood({ ...newHood, derby_requirements: newHood.derby_requirements?.filter((_, i) => i !== idx) })} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Requirements (Multiple)</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={reqInput}
                                onChange={e => setReqInput(e.target.value)}
                                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="Add a requirement..."
                                onKeyDown={e => e.key === 'Enter' && handleAddRequirement()}
                            />
                            <button onClick={handleAddRequirement} type="button" className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {newHood.requirements?.map((req, idx) => (
                                <span key={idx} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                    {req}
                                    <button onClick={() => setNewHood({ ...newHood, requirements: newHood.requirements?.filter((_, i) => i !== idx) })} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'} Neighborhood
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {neighborhoods.map((hood) => (
                    <div key={hood.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img src={hood.image} alt={hood.name} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1">
                            <h4 className="font-bold text-lg">{hood.name}</h4>
                            <p className="text-sm text-gray-500">Leader: {hood.leader} | Tag: {hood.tag}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(hood)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(hood.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {neighborhoods.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-8">No neighborhoods found. Add one!</div>
                )}
            </div>
        </div>
    );
}
