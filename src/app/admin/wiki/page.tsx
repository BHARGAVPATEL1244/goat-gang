'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { logAdminAction } from '@/app/actions/audit';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface WikiPage {
    id: string;
    slug: string;
    title: string;
    image_url?: string;
    excerpt: string;
    content: string;
    is_published: boolean;
    updated_at: string;
}

export default function AdminWikiPage() {
    const [pages, setPages] = useState<WikiPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<WikiPage>>({
        slug: '',
        title: '',
        excerpt: '',
        content: '',
        image_url: '',
        is_published: true
    });

    const supabase = createClient();
    const router = useRouter();

    const fetchPages = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('wiki_pages')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            toast.error('Failed to load wiki pages');
        } else {
            setPages(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleSave = async () => {
        if (!formData.slug || !formData.title || !formData.content) {
            toast.error('Please fill in required fields (Slug, Title, Content)');
            return;
        }

        const payload = {
            slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
            title: formData.title,
            excerpt: formData.excerpt,
            content: formData.content,
            image_url: formData.image_url,
            is_published: formData.is_published
        };

        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('wiki_pages')
                .update(payload)
                .eq('id', editingId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('wiki_pages')
                .insert([payload]);
            error = insertError;
        }

        if (error) {
            console.error(error);
            toast.error('Failed to save guide: ' + error.message);
        } else {
            const action = editingId ? 'UPDATE_GUIDE' : 'CREATE_GUIDE';
            await logAdminAction(action, { title: payload.title, slug: payload.slug });

            toast.success(editingId ? 'Guide updated!' : 'Guide created!');
            if (!editingId) {
                // Keep form open if editing, close/reset if new? Actually reset is better
                setFormData({ slug: '', title: '', excerpt: '', content: '', image_url: '', is_published: true });
            }
            // If we were editing, maybe keep it open or close? Let's close for now as per previous logic
            setEditingId(null);
            fetchPages();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this guide?')) return;

        const { error } = await supabase
            .from('wiki_pages')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete guide');
        } else {
            await logAdminAction('DELETE_GUIDE', { id });
            toast.success('Guide deleted');
            fetchPages();
        }
    };

    const startEdit = (page: WikiPage) => {
        setEditingId(page.id);
        setFormData(page);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({ slug: '', title: '', excerpt: '', content: '', image_url: '', is_published: true });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 pt-24">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wiki Manager</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Editor Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingId ? 'Edit Guide' : 'Create New Guide'}
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Guide Title"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug (URL)</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="guide-url-slug"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover Image URL</label>
                                <input
                                    type="text"
                                    value={formData.image_url || ''}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Excerpt (Short Description)</label>
                                <textarea
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20"
                                    placeholder="Brief summary for the card..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-gray-900 dark:text-white">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={(value) => setFormData({ ...formData, content: value })}
                                        className="h-64 mb-12"
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                ['link', 'image'],
                                                ['clean']
                                            ],
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_published"
                                    checked={formData.is_published}
                                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_published" className="text-sm text-gray-700 dark:text-gray-300">Published</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                {editingId && (
                                    <button
                                        onClick={cancelEdit}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <Save className="w-4 h-4" />
                                    {editingId ? 'Update Guide' : 'Create Guide'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List Column */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit max-h-[80vh] overflow-y-auto">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Existing Guides</h2>
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">Loading...</div>
                                ) : pages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No guides found.</div>
                                ) : (
                                    pages.map(page => (
                                        <div key={page.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 group hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{page.title}</h3>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(page)} className="p-1 hover:text-blue-500 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(page.id)} className="p-1 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className={`px-2 py-0.5 rounded-full ${page.is_published ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}>
                                                    {page.is_published ? 'Published' : 'Draft'}
                                                </span>
                                                <span>{new Date(page.updated_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
