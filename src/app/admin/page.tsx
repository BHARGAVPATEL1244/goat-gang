'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import AdminPanel from '@/components/AdminPanel';
import Leaderboard from '@/components/Leaderboard';
import AdminNeighborhoods from '@/components/AdminNeighborhoods';
import AdminEvents from '@/components/AdminEvents';
import { PERMISSIONS } from '@/utils/permissions';
import { getRolePermissions } from '@/app/actions/permissions';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { Suspense } from 'react';

function AdminDashboardContent() {
    const router = useRouter();
    const supabase = createClient();
    const searchParams = useSearchParams();
    // Default view or from query param
    const initialView = (searchParams.get('view') as 'management' | 'leaderboard' | 'neighborhoods' | 'events') || 'management';
    const [activeView, setActiveView] = useState<'management' | 'leaderboard' | 'neighborhoods' | 'events'>(initialView);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [dbPermissions, setDbPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const viewInitialized = React.useRef(false);

    // Sync state if URL changes (e.g. clicking nav links)
    useEffect(() => {
        const view = searchParams.get('view') as 'management' | 'leaderboard' | 'neighborhoods' | 'events';
        if (view) setActiveView(view);
    }, [searchParams]);

    useEffect(() => {
        let isMounted = true;

        const fetchPermissions = async () => {
            try {
                // Fetch DB Rules
                const rules = await getRolePermissions();
                if (isMounted) setDbPermissions(rules);

                // Fetch roles from our Bot API or re-use session logic
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    const providerId = session.user.app_metadata?.provider === 'discord'
                        ? session.user.user_metadata?.provider_id
                        : null;

                    if (!providerId) {
                        console.error('[AdminPage] No provider ID found for user');
                        setLoading(false);
                        return;
                    }

                    let finalRoles: string[] = [];

                    // 1. Try fetching from Bot
                    try {
                        const res = await fetch(`/api/bot/membership?userId=${providerId}`);
                        const data = await res.json();
                        if (isMounted && data.user?.roles) {
                            finalRoles = data.user.roles;
                        }
                    } catch (e) {
                        console.warn('Bot role fetch failed', e);
                    }

                    if (!isMounted) return;

                    // 2. Super Admin Override
                    const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',');

                    if (providerId && ADMIN_USER_IDS.includes(providerId)) {
                        const adminRoleId = PERMISSIONS.ROLES.ADMIN[0];
                        if (adminRoleId && !finalRoles.includes(adminRoleId)) {
                            finalRoles = [...finalRoles, adminRoleId];
                        }
                    }

                    setUserRoles(finalRoles);
                }
            } catch (error) {
                console.error('Error fetching permissions:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPermissions();

        // Real-time Poll: Refresh roles/permissions every 10s to pick up server changes
        const pollInterval = setInterval(fetchPermissions, 10000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
        };
    }, []);

    // --- Access Control & Redirection Logic ---
    const showData = PERMISSIONS.canManageData(userRoles, dbPermissions);
    const showNeighborhoods = PERMISSIONS.canManageNeighborhoods(userRoles, dbPermissions);
    const showBarLeaderboard = PERMISSIONS.canViewBarLeaderboard(userRoles, dbPermissions);
    const showEvents = PERMISSIONS.canManageEvents(userRoles, dbPermissions);
    const showFarmNames = PERMISSIONS.canManageFarmNames(userRoles, dbPermissions);
    const showEmbeds = PERMISSIONS.canManageEmbeds(userRoles, dbPermissions);
    const showGiveaways = PERMISSIONS.canManageGiveaways(userRoles, dbPermissions);
    const showPermissions = PERMISSIONS.canManagePermissions(userRoles, dbPermissions); // or just roles if no DB perm key yet

    useEffect(() => {
        if (loading) return;

        // 1. Identify Valid Internal Views (Tabs on this page)
        const validInternalViews: string[] = [];
        if (showData) validInternalViews.push('management');
        if (showBarLeaderboard) validInternalViews.push('leaderboard');
        if (showNeighborhoods) validInternalViews.push('neighborhoods');
        if (showEvents) validInternalViews.push('events');

        // 2. Identify Valid External Routes (Separate pages)
        const validExternalRoutes: string[] = [];
        if (showFarmNames) validExternalRoutes.push('/admin/farm-names');
        if (showEmbeds) validExternalRoutes.push('/admin/embed-builder');
        if (showGiveaways) validExternalRoutes.push('/admin/giveaways');
        if (showPermissions) validExternalRoutes.push('/admin/permissions');

        // 3. check if current view is valid
        const isCurrentViewValid = validInternalViews.includes(activeView);

        if (!isCurrentViewValid) {
            if (validInternalViews.length > 0) {
                // If we have other internal views, switch to the first one
                const fallback = validInternalViews[0] as 'management' | 'leaderboard' | 'neighborhoods' | 'events';
                console.log(`[AdminPage] Redirecting to internal view: ${fallback}`);
                setActiveView(fallback);
                // Optional: Update URL without full reload if desired, but state update is enough for rendering
            } else if (validExternalRoutes.length > 0) {
                // No internal views, but we have external ones? Redirect away!
                console.log(`[AdminPage] Redirecting to external route: ${validExternalRoutes[0]}`);
                router.push(validExternalRoutes[0]);
            }
        }
    }, [loading, activeView, showData, showNeighborhoods, showBarLeaderboard, showEvents, showFarmNames, showEmbeds, showGiveaways, showPermissions]);


    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] text-gray-500 font-mono text-sm">
            Loading Admin Panel...
        </div>
    );

    // Check if user has ANY access (Internal OR External)
    const hasAnyAccess = showData || showNeighborhoods || showBarLeaderboard || showEvents || showFarmNames || showEmbeds || showGiveaways || showPermissions;

    if (!hasAnyAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-gray-900 rounded-3xl mt-12 mb-12 border border-gray-800">
                <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-gray-400 max-w-md">
                    You do not have the required roles to view any Admin Dashboard modules.
                </p>
                <div className="mt-6 text-xs text-gray-500 font-mono text-left bg-black p-4 rounded max-w-lg overflow-auto">
                    <p className="font-bold text-yellow-500 mb-2">Debug Info:</p>
                    <p>Your Roles: {userRoles.join(', ') || 'None'}</p>
                    <p className="font-bold text-green-400">Your Level: {PERMISSIONS.getRoleLevel(userRoles)}</p>
                    <p className="mt-2 text-blue-400">Access Check:</p>
                    <p>Data: {showData ? 'YES' : 'NO'}</p>
                    <p>Farm Names: {showFarmNames ? 'YES' : 'NO'}</p>
                    <p>Leaderboard: {showBarLeaderboard ? 'YES' : 'NO'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12">
            {/* Debug Banner (Dev only ideally, keeping for user testing) */}
            <div className="mb-4 text-xs font-mono bg-black text-gray-300 p-2 rounded flex justify-between">
                <span><span className="text-yellow-500 font-bold">DEBUG:</span> Level: {PERMISSIONS.getRoleLevel(userRoles)}</span>
                <span>Active View: {activeView}</span>
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                <Link
                    href="/admin/wiki"
                    className="group block p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Wiki / Guides</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Create, edit, and publish wiki articles and guides.
                    </p>
                </Link>

                <Link
                    href="/admin/audit"
                    className="group block p-6 bg-gray-800 rounded-xl border border-gray-700 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">Audit Logs</h3>
                    </div>
                    <p className="text-gray-400 text-sm">
                        View security logs and track admin actions.
                    </p>
                </Link>

                {/* Content Area */}
                <div>
                    {activeView === 'management' && showData && <AdminPanel />}
                    {activeView === 'leaderboard' && showBarLeaderboard && <Leaderboard allowRequestView={true} isAdmin={true} />}
                    {activeView === 'neighborhoods' && showNeighborhoods && <AdminNeighborhoods />}
                    {activeView === 'events' && showEvents && <AdminEvents />}

                    {/* Fallback for when we stay on this page but have no internal view selected yet (should be caught by useEffect redirect above) */}
                    {!['management', 'leaderboard', 'neighborhoods', 'events'].includes(activeView) && (
                        <div className="text-center text-gray-500 py-12">
                            Redirecting...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Dashboard...</div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}
