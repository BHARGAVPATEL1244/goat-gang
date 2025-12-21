'use client';

import FarmNamesManager from '@/components/FarmNamesManager';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FarmNamesPage() {
    const router = useRouter();

    return (
        <div className="p-6 md:p-12 min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/admin')}
                        className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors group"
                    >
                        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-white">
                        Neighborhood Management
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Manage farm names for "Goat" neighborhood members directly on Discord.
                    </p>
                </div>

                <FarmNamesManager />
            </div>
        </div>
    );
}
