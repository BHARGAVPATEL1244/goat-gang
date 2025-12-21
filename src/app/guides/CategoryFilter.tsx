'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const CATEGORIES = ['All', 'General', 'Strategy', 'Derby', 'Money Making', 'Events'];

export default function CategoryFilter() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const currentCategory = searchParams.get('category') || 'All';

    const handleSelect = (category: string) => {
        const params = new URLSearchParams(searchParams);
        if (category === 'All') {
            params.delete('category');
        } else {
            params.set('category', category);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap justify-center gap-3 mb-12">
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => handleSelect(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all
                        ${currentCategory === cat
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'}
                    `}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
