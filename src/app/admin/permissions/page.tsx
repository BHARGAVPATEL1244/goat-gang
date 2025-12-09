'use client';

import React from 'react';
import AdminPermissionsManager from '@/components/AdminPermissionsManager';

export default function AdminPermissionsPage() {
    return (
        <div className="p-6 md:p-12">
            <div className="max-w-7xl mx-auto space-y-8">
                <AdminPermissionsManager />
            </div>
        </div>
    );
}
