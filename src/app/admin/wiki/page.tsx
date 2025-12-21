'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import dynamic from 'next/dynamic';
import { Save, Plus, Trash, Edit, ArrowLeft, Upload, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Import Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css'; // Import styles

export default function AdminWikiPage() {
    const supabase = createClient();
    const router = useRouter();

    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        category: 'General',
        image_url: '',
        content: ''
    });

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        setLoading(true);
        const { data } = await supabase.from('wiki_pages').select('*').order('created_at', { ascending: false });
        if (data) setPages(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.slug) return alert('Title and Slug are required!');

        try {
            const payload = { ...formData, updated_at: new Date().toISOString() };

            if (editingId) {
                const { error } = await supabase.from('wiki_pages').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('wiki_pages').insert([payload]);
                if (error) throw error;
            }

            setEditingId(null);
            resetForm();
            loadPages();
            alert('Guide saved successfully!');
        } catch (error: any) {
            alert('Error saving: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this guide?')) return;
        await supabase.from('wiki_pages').delete().eq('id', id);
        loadPages();
    };

    const startEdit = (p: any) => {
        setEditingId(p.id);
        setFormData({
            title: p.title,
            slug: p.slug,
            category: p.category || 'General',
            image_url: p.image_url || '',
            content: p.content || ''
        });
    };

    const resetForm = () => {
        setFormData({ title: '', slug: '', category: 'General', image_url: '', content: '' });
        setEditingId(null);
    };

    // Auto-generate slug from title
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        if (!editingId) {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, title, slug }));
        } else {
            setFormData(prev => ({ ...prev, title }));
        }
    };

    // Custom Toolbar for Quill
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="p-8 text-white min-h-screen">
            <button
                onClick={() => router.push('/admin')}
                className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors group"
            >
                <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <BookOpen className="text-purple-500" /> Wiki Manager
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIST COLUMN */}
                <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-4 h-[calc(100vh-150px)] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-400 uppercase tracking-wider text-sm">All Guides</h2>
                        <button onClick={resetForm} className="bg-green-600 p-2 rounded hover:bg-green-500">
                            <Plus size={16} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {pages.map(p => (
                            <div
                                key={p.id}
                                onClick={() => startEdit(p)}
                                className={`p-3 rounded-lg cursor-pointer border transition-colors ${editingId === p.id ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-800 border-transparent hover:bg-gray-750'}`}
                            >
                                <div className="font-bold truncate">{p.title}</div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">{p.category}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                        className="text-gray-600 hover:text-red-500"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {pages.length === 0 && !loading && <div className="text-gray-600 text-center py-10">No guides yet.</div>}
                    </div>
                </div>

                {/* EDITOR COLUMN */}
                <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col h-[calc(100vh-150px)]">
                    <div className="mb-4 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Title</label>
                            <input
                                type="text"
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 font-bold text-lg"
                                placeholder="Guide Title"
                                value={formData.title}
                                onChange={handleTitleChange}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm font-mono text-yellow-500"
                                placeholder="guide-url-slug"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Category</label>
                            <select
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option>General</option>
                                <option>Strategy</option>
                                <option>Derby</option>
                                <option>Money Making</option>
                                <option>Events</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Header Image URL</label>
                            <input
                                type="text"
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm"
                                placeholder="https://..."
                                value={formData.image_url}
                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Rich Text Editor */}
                    <div className="flex-1 bg-white text-black rounded overflow-hidden flex flex-col">
                        <ReactQuill
                            theme="snow"
                            value={formData.content}
                            onChange={(value) => setFormData({ ...formData, content: value })}
                            modules={modules}
                            className="h-full flex-1 flex flex-col"
                        />
                        {/* CSS Override for Quill Height in Flex Container */}
                        <style jsx global>{`
                            .quill { display: flex; flex-direction: column; height: 100%; }
                            .ql-container { flex: 1; overflow-y: auto; }
                        `}</style>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                        {editingId && (
                            <button onClick={resetForm} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                        )}
                        <button
                            onClick={handleSave}
                            className="bg-purple-600 hover:bg-purple-500 px-6 py-2 rounded font-bold shadow-lg flex items-center gap-2"
                        >
                            <Save size={18} /> {editingId ? 'Update Guide' : 'Publish Guide'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
