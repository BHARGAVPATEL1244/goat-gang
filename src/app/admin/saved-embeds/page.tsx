'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit, Send } from 'lucide-react';

export default function SavedEmbedsPage() {
    const [embeds, setEmbeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmbeds();
    }, []);

    const fetchEmbeds = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('saved_embeds')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching embeds:', error);
        else setEmbeds(data || []);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this embed?')) return;

        const { error } = await supabase
            .from('saved_embeds')
            .delete()
            .eq('id', id);

        if (error) alert('Error deleting embed');
        else fetchEmbeds();
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Saved Embeds</h1>
                    <Link
                        href="/admin/embed-builder"
                        className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-bold transition-colors border border-gray-600"
                    >
                        ← Back to Builder
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading...</div>
                ) : embeds.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-gray-800 rounded-xl border border-gray-700">
                        No saved embeds found. Create one!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {embeds.map((item) => (
                            <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                                    <h3 className="font-bold text-lg truncate">{item.name}</h3>
                                    <p className="text-xs text-gray-400">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="p-4 flex-1">
                                    <div className="text-sm text-gray-400 line-clamp-3">
                                        {item.data.embeds?.[0]?.description || 'No description'}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        {item.data.embeds?.length || 0} Embeds • {item.data.attachments?.length || 0} Attachments
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-900/50 flex justify-between items-center gap-2">
                                    <Link
                                        href={`/admin/embed-builder?id=${item.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm transition-colors"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
