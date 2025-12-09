'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import AdminNav from '@/components/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Allowed Roles (Admin, Leader, Co-Leader, Bar Collector)
    const ALLOWED_ROLE_IDS = [
        ...(process.env.NEXT_PUBLIC_DISCORD_ADMIN_ROLE_IDS?.split(',') || []),
        process.env.NEXT_PUBLIC_DISCORD_LEADER_ROLE_ID,
        process.env.NEXT_PUBLIC_DISCORD_COLEADER_ROLE_ID,
        process.env.NEXT_PUBLIC_DISCORD_BAR_COLLECTOR_ROLE_ID
    ].filter(Boolean) as string[];

    // Master Admin User IDs (Bypass Role Check)
    const ADMIN_USER_IDS = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || [];

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/');
                    return;
                }

                // Get Discord Provider ID
                const providerId = user.app_metadata?.provider === 'discord'
                    ? user.user_metadata?.provider_id
                    : null;

                if (!providerId) {
                    router.push('/');
                    return;
                }

                // 1. Check User ID Bypass
                if (ADMIN_USER_IDS.includes(providerId)) {
                    setIsAuthorized(true);
                    setIsLoading(false);
                    return;
                }

                // 2. Verify Roles via Bot API
                const res = await fetch(`/api/bot/membership?userId=${providerId}`);
                const data = await res.json();

                if (data.success && data.user?.roles) {
                    const userRoles: string[] = data.user.roles;
                    const hasAllowedRole = userRoles.some(roleId => ALLOWED_ROLE_IDS.includes(roleId));

                    if (hasAllowedRole) {
                        setIsAuthorized(true);
                    } else {
                        router.push('/'); // Redirect unauthorized
                    }
                } else {
                    router.push('/'); // Failed to fetch or no roles
                }

            } catch (error) {
                console.error('Admin Guard Check Failed:', error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">Verifying Admin Access...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null; // Router will handle redirect
    }

    return (
        <>
            <div className="sticky top-0 z-40 bg-gray-900">
                <Suspense fallback={<div className="h-16 bg-gray-800 animate-pulse" />}>
                    <AdminNav />
                </Suspense>
            </div>
            {children}
        </>
    );
}
