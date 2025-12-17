'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Search, FileText, MapPin, Calendar, LayoutDashboard, Globe, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SearchItem {
    id: string;
    title: string;
    type: 'guide' | 'hood' | 'page';
    slug: string; // url path
    description?: string;
}

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<SearchItem[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Fetch data when menu opens
    useEffect(() => {
        if (open && items.length <= 5) { // Only fetch if we haven't loaded much (basic caching)
            const fetchData = async () => {
                const newItems: SearchItem[] = [];

                // 1. Wiki Pages
                const { data: guides } = await supabase
                    .from('wiki_pages')
                    .select('title, slug, excerpt')
                    .eq('is_published', true)
                    .limit(10);

                if (guides) {
                    guides.forEach(g => {
                        newItems.push({
                            id: `guide-${g.slug}`,
                            title: g.title,
                            type: 'guide',
                            slug: `/guides/${g.slug}`,
                            description: g.excerpt?.substring(0, 50)
                        });
                    });
                }

                // 2. Neighborhoods
                const { data: hoods } = await supabase
                    .from('map_districts')
                    .select('name, hood_id, description')
                    .limit(10);

                if (hoods) {
                    hoods.forEach(h => {
                        newItems.push({
                            id: `hood-${h.hood_id}`,
                            title: h.name,
                            type: 'hood',
                            slug: `/neighborhoods/${h.hood_id}`, // Assuming hood_id is the URL param
                            description: 'Neighborhood'
                        });
                    });
                }

                setItems(prev => [...prev, ...newItems]);
            };
            fetchData();
        }
    }, [open]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[640px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-[9999] overflow-hidden p-0"
        >
            <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-4">
                <Search className="w-5 h-5 text-gray-400 mr-2" />
                <Command.Input
                    placeholder="Type a command or search..."
                    className="w-full py-4 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 font-medium text-lg"
                />
                <div className="flex gap-2 text-xs text-gray-400 font-mono border border-gray-200 dark:border-gray-800 px-2 py-1 rounded">
                    <span>ESC</span>
                </div>
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-2 scroll-py-2">
                <Command.Empty className="py-6 text-center text-sm text-gray-500">No results found.</Command.Empty>

                <Command.Group heading="Navigation" className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-2">
                    <CommandItem onSelect={() => runCommand(() => router.push('/'))} icon={Globe} title="Home" />
                    <CommandItem onSelect={() => runCommand(() => router.push('/events'))} icon={Calendar} title="Events" />
                    <CommandItem onSelect={() => runCommand(() => router.push('/guides'))} icon={FileText} title="Wiki" />
                    <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))} icon={LayoutDashboard} title="Bar Vault" />
                </Command.Group>

                {items.some(i => i.type === 'guide') && (
                    <Command.Group heading="Wiki Guides" className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-2 mt-4">
                        {items.filter(i => i.type === 'guide').map(item => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => runCommand(() => router.push(item.slug))}
                                icon={FileText}
                                title={item.title}
                                description={item.description}
                            />
                        ))}
                    </Command.Group>
                )}

                {items.some(i => i.type === 'hood') && (
                    <Command.Group heading="Neighborhoods" className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-2 mt-4">
                        {items.filter(i => i.type === 'hood').map(item => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => runCommand(() => router.push(item.slug))}
                                icon={MapPin}
                                title={item.title}
                            />
                        ))}
                    </Command.Group>
                )}

            </Command.List>

            <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 text-xs text-gray-400 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <span>Goat Gang Command</span>
                <span>Cmd+K</span>
            </div>
        </Command.Dialog>
    );
}

function CommandItem({ title, icon: Icon, description, onSelect }: { title: string, icon: any, description?: string, onSelect: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-gray-700 dark:text-gray-200 transition-colors aria-selected:bg-gray-100 aria-selected:dark:bg-gray-800 aria-selected:text-black aria-selected:dark:text-white"
        >
            <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                <Icon size={16} />
            </div>
            <div className="flex-1">
                <div className="font-medium text-sm">{title}</div>
                {description && <div className="text-xs text-gray-400 line-clamp-1">{description}</div>}
            </div>
        </Command.Item>
    );
}
