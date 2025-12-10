'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PERMISSIONS } from '@/utils/permissions';
import { getRolePermissions } from '@/app/actions/permissions';

import { Suspense } from 'react';

function AdminNavContent() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view');
    const supabase = createClient();
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [providerId, setProviderId] = useState<string>('');
    const [dbPermissions, setDbPermissions] = useState<any[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchPermissions = async () => {
            try {
                // Fetch DB Rules
                const rules = await getRolePermissions();
                if (isMounted) setDbPermissions(rules);

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    const pid = session.user.app_metadata?.provider === 'discord'
                        ? session.user.user_metadata?.provider_id
                        : null;
                    if (pid) setProviderId(pid);

                    let finalRoles: string[] = [];

                    // 1. Try fetching from Bot
                    if (pid) {
                        try {
                            const res = await fetch(`/api/bot/membership?userId=${pid}`);
                            const data = await res.json();
                            if (data.user?.roles) {
                                finalRoles = data.user.roles;
                            }
                        } catch (err) {
                            console.warn('Bot role fetch failed, falling back to basic checks', err);
                        }
                    }

                    // 2. Super Admin Override (Always Apply)
                    const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',');
                    if (pid && ADMIN_USER_IDS.includes(pid)) {
                        const adminRoleId = PERMISSIONS.ROLES.ADMIN[0];
                        // If configured, inject it. If not, we trust isAdmin check but roles might ideally need one.
                        if (adminRoleId && !finalRoles.includes(adminRoleId)) {
                            finalRoles = [...finalRoles, adminRoleId];
                        }
                    }

                    if (isMounted) setUserRoles(finalRoles);
                }
            } catch (error) {
                console.error('AdminNav permission checks failed', error);
            }
        };

        fetchPermissions();

        // Auto-refresh permissions every 10s
        const intervalId = setInterval(fetchPermissions, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const showData = PERMISSIONS.canManageData(userRoles, dbPermissions);
    const showNeighborhoods = PERMISSIONS.canManageNeighborhoods(userRoles, dbPermissions);
    const showBarLeaderboard = PERMISSIONS.canViewBarLeaderboard(userRoles, dbPermissions);
    const showEvents = PERMISSIONS.canManageEvents(userRoles, dbPermissions);
    const showFarmNames = PERMISSIONS.canManageFarmNames(userRoles, dbPermissions);
    const showEmbeds = PERMISSIONS.canManageEmbeds(userRoles, dbPermissions);
    const showGiveaways = PERMISSIONS.canManageGiveaways(userRoles, dbPermissions);

    console.log('AdminNav Debug:', {
        providerId,
        userRoles,
        showData,
        showNeighborhoods,
        showEmbeds,
        showGiveaways,
        adminUserIds: (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(','),
        adminRole: PERMISSIONS.ROLES.ADMIN[0],
        isAdmin: PERMISSIONS.isAdmin(userRoles),
        canManageEmbeds: PERMISSIONS.canManageEmbeds(userRoles, dbPermissions),
        canManageGiveaways: PERMISSIONS.canManageGiveaways(userRoles, dbPermissions),
        dbPermissions: dbPermissions,
        roleLevel: PERMISSIONS.getRoleLevel(userRoles)
    });

    const isTabActive = (view: string) => pathname === '/admin' && currentView === view;
    // Default: if on /admin and no view is set, 'management' is usually default permissions permitting
    // But strictly highlighting explicit matches is safer visually.

    const isPageActive = (path: string) => pathname === path;

    return (
        <div className="bg-gray-800 border-b border-gray-700 sticky top-16 z-30 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-wrap gap-2 items-center">

                    {/* Dashboard Tabs (Deep Links) */}
                    {showData && (
                        <Link
                            href="/admin?view=management"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isTabActive('management') || (pathname === '/admin' && !currentView)
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Data Management
                        </Link>
                    )}

                    {showBarLeaderboard && (
                        <Link
                            href="/admin?view=leaderboard"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isTabActive('leaderboard')
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Bar Leaderboard
                        </Link>
                    )}

                    {showNeighborhoods && (
                        <Link
                            href="/admin/map-manager"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isPageActive('/admin/map-manager')
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Map Manager
                        </Link>
                    )}

                    {showEvents && (
                        <Link
                            href="/admin?view=events"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isTabActive('events')
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Events
                        </Link>
                    )}

                    <div className="w-px h-6 bg-gray-700 mx-2 hidden sm:block"></div>

                    {/* External Pages */}
                    {showFarmNames && (
                        <Link
                            href="/admin/farm-names"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${isPageActive('/admin/farm-names')
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Farm Names
                        </Link>
                    )}

                    {PERMISSIONS.canManagePermissions(userRoles) && (
                        <Link
                            href="/admin/permissions"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${isPageActive('/admin/permissions')
                                ? 'bg-purple-900/50 text-purple-200 border border-purple-700 shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Permissions
                        </Link>
                    )}

                    {showEmbeds && (
                        <Link
                            href="/admin/embed-builder"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${pathname.startsWith('/admin/embed-builder')
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Embed Builder
                        </Link>
                    )}

                    {showGiveaways && (
                        <Link
                            href="/admin/giveaways"
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${pathname.startsWith('/admin/giveaways')
                                ? 'bg-gray-700 text-white shadow-sm'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            Giveaways
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminNav() {
    return (
        <Suspense fallback={<div className="h-14 bg-gray-800 animate-pulse border-b border-gray-700" />}>
            <AdminNavContent />
        </Suspense>
    );
}
