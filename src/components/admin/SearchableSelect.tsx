import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
    id: string;
    name: string;
    type?: any;
}

interface SearchableSelectProps {
    label: string;
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    disabled?: boolean;
    className?: string;
}

export default function SearchableSelect({
    label,
    options,
    value,
    onChange,
    placeholder,
    disabled,
    className
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
    const selected = options.find(o => o.id === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setSearch('');
        }
    }, [isOpen]);

    if (disabled) {
        return (
            <div className={`opacity-50 pointer-events-none ${className}`}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                <div className="bg-gray-800 p-2.5 rounded-lg border border-gray-700 text-sm text-gray-500">
                    {placeholder}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    bg-gray-800 p-2.5 rounded-lg cursor-pointer flex justify-between items-center text-sm border transition-all duration-200
                    ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-700 hover:border-gray-600'}
                `}
            >
                <span className={`truncate ${selected ? 'text-white font-medium' : 'text-gray-500'}`}>
                    {selected ? selected.name : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-gray-800 border border-gray-700 z-50 max-h-60 overflow-hidden rounded-lg shadow-xl mt-2 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm sticky top-0">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                            <input
                                ref={inputRef}
                                className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded text-sm text-white focus:border-blue-500 focus:outline-none placeholder-gray-600"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search..."
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                        {filtered.length > 0 ? (
                            filtered.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                    className={`
                                        px-3 py-2.5 cursor-pointer text-sm transition-colors flex items-center justify-between
                                        ${opt.id === value ? 'bg-blue-600/10 text-blue-400' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}
                                    `}
                                >
                                    <span className="truncate">{opt.name}</span>
                                    {opt.id === value && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-xs italic">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
