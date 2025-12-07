import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface EmbedProps {
    embeds: any[];
    attachments?: { name: string, data: string }[];
}

export default function EmbedPreview({ embeds, attachments }: EmbedProps) {
    if (!embeds || embeds.length === 0) return null;

    const MarkdownComponents = {
        a: ({ node, ...props }: any) => <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" />,
        p: ({ node, ...props }: any) => <p {...props} className="mb-1 last:mb-0" />,
        strong: ({ node, ...props }: any) => <strong {...props} className="font-bold" />,
        em: ({ node, ...props }: any) => <em {...props} className="italic" />,
        u: ({ node, ...props }: any) => <u {...props} className="underline" />,
        code: ({ node, inline, ...props }: any) =>
            inline
                ? <code {...props} className="bg-[#2f3136] rounded px-1 py-0.5 font-mono text-sm" />
                : <code {...props} className="block bg-[#2f3136] rounded p-2 font-mono text-sm my-1 whitespace-pre-wrap" />,
        blockquote: ({ node, ...props }: any) => <blockquote {...props} className="border-l-4 border-gray-600 pl-2 my-1 text-gray-400" />,
    };

    return (
        <div className="max-w-lg space-y-4">
            {attachments && attachments.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                    {attachments.map((att, i) => (
                        <div key={i}>
                            <img src={att.data} alt={att.name} className="w-full rounded-md object-cover max-h-48" />
                        </div>
                    ))}
                </div>
            )}

            {embeds.map((embed, index) => {
                const color = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#202225';
                return (
                    <div key={index} className="bg-[#36393f] rounded-md p-4 font-sans text-gray-100 shadow-lg border-l-4" style={{ borderLeftColor: color }}>
                        <div className="flex gap-4">
                            <div className="flex-1 min-w-0">
                                {embed.author && (
                                    <div className="flex items-center gap-2 mb-2">
                                        {embed.author.icon_url && (
                                            <img src={embed.author.icon_url} alt="" className="w-6 h-6 rounded-full" />
                                        )}
                                        {embed.author.url ? (
                                            <a href={embed.author.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm hover:underline">
                                                {embed.author.name}
                                            </a>
                                        ) : (
                                            <span className="font-bold text-sm">{embed.author.name}</span>
                                        )}
                                    </div>
                                )}

                                {embed.title && (
                                    <div className={`font-bold text-base mb-2 ${embed.url ? 'text-blue-400 hover:underline cursor-pointer' : 'text-gray-100'}`}>
                                        {embed.url ? (
                                            <a href={embed.url} target="_blank" rel="noopener noreferrer">{embed.title}</a>
                                        ) : (
                                            embed.title
                                        )}
                                    </div>
                                )}

                                {embed.description && (
                                    <div className="text-sm text-gray-300 mb-2">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={MarkdownComponents}
                                        >
                                            {embed.description}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {embed.fields && embed.fields.length > 0 && (
                                    <div className="grid grid-cols-12 gap-2 mt-2">
                                        {embed.fields.map((field: any, i: number) => (
                                            <div key={i} className={`${field.inline ? 'col-span-4' : 'col-span-12'}`}>
                                                <div className="font-bold text-xs text-gray-400 mb-1">{field.name}</div>
                                                <div className="text-sm text-gray-300">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={MarkdownComponents}
                                                    >
                                                        {field.value}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {embed.thumbnail && embed.thumbnail.url && (
                                <div className="flex-shrink-0">
                                    <img src={embed.thumbnail.url} alt="" className="w-20 h-20 rounded object-cover" />
                                </div>
                            )}
                        </div>

                        {embed.image && embed.image.url && (
                            <div className="mt-3">
                                <img src={embed.image.url} alt="" className="w-full rounded object-cover" />
                            </div>
                        )}

                        {embed.footer && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
                                {embed.footer.icon_url && (
                                    <img src={embed.footer.icon_url} alt="" className="w-5 h-5 rounded-full" />
                                )}
                                <span>
                                    {embed.footer.text}
                                    {embed.timestamp && (
                                        <> • {new Date(embed.timestamp).toLocaleDateString()}</>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
