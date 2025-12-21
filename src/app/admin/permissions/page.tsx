'use client';

import React from 'react';
import AdminPermissionsManager from '@/components/AdminPermissionsManager';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPermissionsPage() {
    const router = useRouter();

    return (
        <div className="p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <button
                    onClick={() => router.push('/admin')}
                    className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
                <AdminPermissionsManager />
            </div>
        </div>
    );
}
