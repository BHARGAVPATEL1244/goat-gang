'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import AdminPanel from '@/components/AdminPanel';
import Leaderboard from '@/components/Leaderboard';
import AdminNeighborhoods from '@/components/AdminNeighborhoods';
import AdminEvents from '@/components/AdminEvents';
import { PERMISSIONS } from '@/utils/permissions';
import { getRolePermissions } from '@/app/actions/permissions';

import { useSearchParams } from 'next/navigation';

export default function AdminPage() {
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

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
    );

    const showData = PERMISSIONS.canManageData(userRoles);
    const showNeighborhoods = PERMISSIONS.canManageNeighborhoods(userRoles);
    const showBarLeaderboard = PERMISSIONS.canViewBarLeaderboard(userRoles);
    const showEvents = PERMISSIONS.canManageEvents(userRoles);
    const showFarmNames = PERMISSIONS.canManageFarmNames(userRoles);

    // Check if user has ANY access
    const hasAnyAccess = showData || showNeighborhoods || showBarLeaderboard || showEvents || showFarmNames;

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
                    <p className="mt-2 text-blue-400">Required Config:</p>
                    <p>Admin IDs: {PERMISSIONS.ROLES.ADMIN.join(', ')}</p>
                    <p>Leader ID: {PERMISSIONS.ROLES.LEADER}</p>
                    <p>Co-Leader ID: {PERMISSIONS.ROLES.CO_LEADER}</p>
                    <p>Can Manage Farm Names: {showFarmNames ? 'YES' : 'NO'}</p>
                    <p>Can View Bar Leaderboard: {showBarLeaderboard ? 'YES' : 'NO'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12">
            <div className="mb-4 text-xs font-mono bg-black text-gray-300 p-2 rounded">
                <span className="text-yellow-500 font-bold">DEBUG:</span> Level: {PERMISSIONS.getRoleLevel(userRoles)} | Roles: {userRoles.length}
            </div>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Content Area */}
                <div>
                    {activeView === 'management' && showData && <AdminPanel />}
                    {activeView === 'leaderboard' && showBarLeaderboard && <Leaderboard allowRequestView={true} isAdmin={true} />}
                    {activeView === 'neighborhoods' && showNeighborhoods && <AdminNeighborhoods />}
                    {activeView === 'events' && showEvents && <AdminEvents />}
                </div>
            </div>
        </div>
    );
}
