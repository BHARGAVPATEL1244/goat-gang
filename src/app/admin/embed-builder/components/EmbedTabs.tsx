import React from 'react';
import { Plus, X, Layers } from 'lucide-react';

interface EmbedTabsProps {
    count: number;
    activeIndex: number;
    onSelect: (index: number) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

export default function EmbedTabs({ count, activeIndex, onSelect, onAdd, onRemove }: EmbedTabsProps) {
    return (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    onClick={() => onSelect(i)}
                    className={`
                        group flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all duration-200 border select-none
                        ${activeIndex === i
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750 hover:border-gray-600'
                        }
                        min-w-fit
                    `}
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="font-medium text-sm whitespace-nowrap">Embed {i + 1}</span>

                    {count > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(i);
                            }}
                            className={`
                                p-0.5 rounded-full transition-colors ml-1
                                ${activeIndex === i
                                    ? 'hover:bg-blue-500 text-blue-200 hover:text-white'
                                    : 'hover:bg-gray-700 text-gray-500 hover:text-red-400'
                                }
                            `}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ))}

            {count < 10 && (
                <button
                    onClick={onAdd}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-green-400 transition-all duration-200 flex-shrink-0"
                    title="Add Embed"
                >
                    <Plus className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
