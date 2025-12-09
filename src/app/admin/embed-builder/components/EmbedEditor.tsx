import React from 'react';
import EmbedFields from './EmbedFields';
import { User, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

interface EmbedData {
    title: string;
    description: string;
    color: number;
    url: string;
    timestamp: string;
    footer: { text: string; icon_url: string };
    image: { url: string };
    thumbnail: { url: string };
    author: { name: string; icon_url: string; url: string };
    fields: { name: string; value: string; inline: boolean }[];
}

interface EmbedEditorProps {
    embed: EmbedData;
    onChange: (data: EmbedData) => void;
}

export default function EmbedEditor({ embed, onChange }: EmbedEditorProps) {
    const update = (key: string, value: any) => {
        const newData = { ...embed };
        if (key.includes('.')) {
            const [parent, child] = key.split('.') as [keyof EmbedData, string];
            // @ts-ignore
            newData[parent] = { ...newData[parent], [child]: value };
        } else {
            // @ts-ignore
            newData[key] = value;
        }
        onChange(newData);
    };

    return (
        <div className="space-y-6">
            {/* Context/Author Section */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Author</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text" placeholder="Author Name"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm focus:border-blue-500 focus:outline-none transition-colors"
                        value={embed.author.name}
                        onChange={e => update('author.name', e.target.value)}
                    />
                    <input
                        type="text" placeholder="Author Icon URL"
                        className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm focus:border-blue-500 focus:outline-none transition-colors"
                        value={embed.author.icon_url}
                        onChange={e => update('author.icon_url', e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                <input
                    type="text" placeholder="Embed Title"
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 w-full font-bold text-lg focus:border-blue-500 focus:outline-none transition-colors"
                    value={embed.title}
                    onChange={e => update('title', e.target.value)}
                />
                <textarea
                    placeholder="Description (Markdown supported)"
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 w-full h-32 resize-none focus:border-blue-500 focus:outline-none transition-colors"
                    value={embed.description}
                    onChange={e => update('description', e.target.value)}
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Color</label>
                        <div className="flex gap-2">
                            <div className="relative">
                                <input
                                    type="color"
                                    className="h-10 w-12 rounded cursor-pointer opacity-0 absolute inset-0 z-10"
                                    value={`#${embed.color.toString(16).padStart(6, '0')}`}
                                    onChange={e => update('color', parseInt(e.target.value.replace('#', ''), 16))}
                                />
                                <div
                                    className="h-10 w-12 rounded border border-gray-600 shadow-inner"
                                    style={{ backgroundColor: `#${embed.color.toString(16).padStart(6, '0')}` }}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Hex Color (e.g. 0099ff)"
                                className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full uppercase font-mono text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                value={embed.color.toString(16).padStart(6, '0')}
                                onChange={e => {
                                    const hex = e.target.value.replace('#', '');
                                    if (/^[0-9A-F]{0,6}$/i.test(hex)) {
                                        update('color', parseInt(hex.padEnd(6, '0'), 16));
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Thumbnail</label>
                        <input
                            type="text" placeholder="https://example.com/image.png"
                            className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm focus:border-blue-500 focus:outline-none transition-colors"
                            value={embed.thumbnail.url}
                            onChange={e => update('thumbnail.url', e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Main Image</label>
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        <input
                            type="text" placeholder="https://example.com/large-image.png"
                            className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm focus:border-blue-500 focus:outline-none transition-colors"
                            value={embed.image.url}
                            onChange={e => update('image.url', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Fields */}
            <EmbedFields
                fields={embed.fields}
                onChange={fields => update('fields', fields)}
            />

            {/* Footer */}
            <div className="border-t border-gray-700 pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <LinkIcon className="w-4 h-4 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-200">Footer</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text" placeholder="Footer Text"
                            className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm focus:border-blue-500 focus:outline-none transition-colors"
                            value={embed.footer.text}
                            onChange={e => update('footer.text', e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="text" placeholder="Icon URL"
                            className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm focus:border-blue-500 focus:outline-none transition-colors"
                            value={embed.footer.icon_url}
                            onChange={e => update('footer.icon_url', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
