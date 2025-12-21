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
import {
    Users, Map, Calendar, BookOpen, Shield, Settings,
    Activity, LayoutDashboard, Trophy, FileText, Lock
} from 'lucide-react';

function AdminDashboardContent() {
    const router = useRouter();
    const supabase = createClient();
    const searchParams = useSearchParams();

    // Default to 'dashboard' if no view is specified
    const initialView = (searchParams.get('view') as any) || 'dashboard';
    const [activeView, setActiveView] = useState<string>(initialView);

    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [dbPermissions, setDbPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Stats State
    const [stats, setStats] = useState({
        hoods: 0,
        members: 0,
        events: 0,
        guides: 0
    });

    useEffect(() => {
        const view = searchParams.get('view');
        if (view) setActiveView(view);
        else setActiveView('dashboard');
    }, [searchParams]);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                // 1. Fetch Permissions
                const rules = await getRolePermissions();
                if (isMounted) setDbPermissions(rules);

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    const providerId = session.user.app_metadata?.provider === 'discord'
                        ? session.user.user_metadata?.provider_id
                        : null;

                    if (providerId) {
                        // Fetch roles from Bot
                        try {
                            const res = await fetch(`/api/bot/membership?userId=${providerId}`);
                            const data = await res.json();
                            if (isMounted && data.user?.roles) {
                                let finalRoles = data.user.roles;
                                // Super Admin Override
                                const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',');
                                if (ADMIN_USER_IDS.includes(providerId)) {
                                    const adminRoleId = PERMISSIONS.ROLES.ADMIN[0] || 'admin_override';
                                    finalRoles = [...finalRoles, adminRoleId];
                                }
                                setUserRoles(finalRoles);
                            }
                        } catch (e) {
                            console.warn('Bot role fetch failed', e);
                        }
                    }
                }

                // 2. Fetch Stats (Parallel)
                const [hoods, members, events, guides] = await Promise.all([
                    supabase.from('map_districts').select('id', { count: 'exact', head: true }),
                    supabase.from('hood_memberships').select('user_id', { count: 'exact', head: true }),
                    supabase.from('events').select('id', { count: 'exact', head: true }),
                    supabase.from('wiki_pages').select('id', { count: 'exact', head: true })
                ]);

                if (isMounted) {
                    setStats({
                        hoods: hoods.count || 0,
                        members: members.count || 0,
                        events: events.count || 0,
                        guides: guides.count || 0
                    });
                }

            } catch (error) {
                console.error('Error fetching admin data:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Access Control
    const showData = PERMISSIONS.canManageData(userRoles, dbPermissions);
    const showNeighborhoods = PERMISSIONS.canManageNeighborhoods(userRoles, dbPermissions);
    const showBarLeaderboard = PERMISSIONS.canViewBarLeaderboard(userRoles, dbPermissions);
    const showEvents = PERMISSIONS.canManageEvents(userRoles, dbPermissions);
    const showFarmNames = PERMISSIONS.canManageFarmNames(userRoles, dbPermissions); // Kept for completeness, not used in current cards
    const showEmbeds = PERMISSIONS.canManageEmbeds(userRoles, dbPermissions); // Kept for completeness, not used in current cards
    const showGiveaways = PERMISSIONS.canManageGiveaways(userRoles, dbPermissions); // Kept for completeness, not used in current cards
    const showPermissions = PERMISSIONS.canManagePermissions(userRoles, dbPermissions); // Kept for completeness, not used in current cards
    const showWiki = PERMISSIONS.canManageWiki(userRoles, dbPermissions);
    const showAudit = PERMISSIONS.canViewAudit(userRoles, dbPermissions);

    // Navigation Handler
    const navigateTo = (view: string, externalUrl?: string) => {
        if (externalUrl) {
            router.push(externalUrl);
        } else {
            setActiveView(view);
            router.push(`/admin?view=${view}`); // Sync URL
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-400 font-mono text-sm animate-pulse">Initializing Command Center...</span>
        </div>
    );

    // Check if user has ANY access (Internal OR External)
    const hasAnyAccess = showData || showNeighborhoods || showBarLeaderboard || showEvents || showFarmNames || showEmbeds || showGiveaways || showPermissions || showWiki || showAudit;

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
                    <p>Neighborhoods: {showNeighborhoods ? 'YES' : 'NO'}</p>
                    <p>Events: {showEvents ? 'YES' : 'NO'}</p>
                    <p>Wiki: {showWiki ? 'YES' : 'NO'}</p>
                    <p>Audit: {showAudit ? 'YES' : 'NO'}</p>
                </div>
            </div>
        );
    }

    // Dashboard Grid View
    const renderDashboard = () => (
        <div className="p-6 md:p-12 animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <LayoutDashboard className="text-blue-500" size={36} />
                        Command Center
                    </h1>
                    <p className="text-gray-400 mt-2">Welcome back, Admin. System is operational.</p>
                </div>
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-4 py-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-mono text-gray-400">Database Connected</span>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <StatsCard label="Members" value={stats.members} icon={Users} color="blue" />
                <StatsCard label="Hoods" value={stats.hoods} icon={Map} color="yellow" />
                <StatsCard label="Active Events" value={stats.events} icon={Calendar} color="purple" />
                <StatsCard label="Wiki Guides" value={stats.guides} icon={BookOpen} color="green" />
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Hood Manager */}
                {showNeighborhoods && (
                    <ModuleCard
                        title="Hood Manager"
                        desc="Manage neighborhood cards, leaders, and custom colors."
                        icon={Map}
                        color="from-yellow-500 to-orange-600"
                        bg="bg-yellow-900/10 hover:bg-yellow-900/20"
                        border="border-yellow-500/20 hover:border-yellow-500/50"
                        onClick={() => navigateTo('neighborhoods')}
                    />
                )}

                {/* 2. Event Planner */}
                {showEvents && (
                    <ModuleCard
                        title="Event Planner"
                        desc="Schedule derbies, main events, and track winners."
                        icon={Calendar}
                        color="from-purple-500 to-pink-600"
                        bg="bg-purple-900/10 hover:bg-purple-900/20"
                        border="border-purple-500/20 hover:border-purple-500/50"
                        onClick={() => navigateTo('events')}
                    />
                )}

                {/* 3. Wiki Studio */}
                {showWiki && (
                    <ModuleCard
                        title="Wiki Studio"
                        desc="Write and publish guides and articles."
                        icon={BookOpen}
                        color="from-green-500 to-emerald-600"
                        bg="bg-green-900/10 hover:bg-green-900/20"
                        border="border-green-500/20 hover:border-green-500/50"
                        onClick={() => navigateTo('wiki', '/admin/wiki')} // External Route
                    />
                )}

                {/* 4. Bar Vault */}
                {showBarLeaderboard && (
                    <ModuleCard
                        title="Bar Vault"
                        desc="Manage bar submissions (Legacy Dashboard)."
                        icon={Trophy}
                        color="from-blue-500 to-indigo-600"
                        bg="bg-blue-900/10 hover:bg-blue-900/20"
                        border="border-blue-500/20 hover:border-blue-500/50"
                        onClick={() => navigateTo('leaderboard')}
                    />
                )}

                {/* 5. Audit Logs */}
                {showAudit && (
                    <ModuleCard
                        title="Audit Logs"
                        desc="View security logs and admin actions."
                        icon={Shield}
                        color="from-red-500 to-rose-600"
                        bg="bg-red-900/10 hover:bg-red-900/20"
                        border="border-red-500/20 hover:border-red-500/50"
                        onClick={() => navigateTo('audit', '/admin/audit')} // External Route
                    />
                )}

                {/* 6. System Settings */}
                {showData && ( // Using showData as proxy for general settings
                    <ModuleCard
                        title="System Settings"
                        desc="Configure global roles and integrations."
                        icon={Settings}
                        color="from-gray-500 to-slate-600"
                        bg="bg-gray-800/50 hover:bg-gray-800"
                        border="border-gray-700 hover:border-gray-500"
                        onClick={() => navigateTo('management')}
                    />
                )}
            </div>
        </div>
    );

    // If active view is NOT dashboard, render the specific component wrapped in a container
    // We add a "Back to Dashboard" button
    const renderSubView = (component: React.ReactNode) => (
        <div className="p-4 md:p-8 animate-in slide-in-from-right-4 duration-300">
            <button
                onClick={() => navigateTo('dashboard')}
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
                <div className="p-1 rounded bg-gray-800 group-hover:bg-gray-700 transition-colors">
                    <ArrowLeftIcon />
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">Back to Dashboard</span>
            </button>
            {component}
        </div>
    );

    return (
        <div className="min-h-screen bg-black">
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'management' && renderSubView(<AdminPanel />)}
            {activeView === 'leaderboard' && renderSubView(<Leaderboard allowRequestView={true} isAdmin={true} />)}
            {activeView === 'neighborhoods' && renderSubView(<AdminNeighborhoods />)}
            {activeView === 'events' && renderSubView(<AdminEvents />)}
        </div>
    );
}

// --- Helper Components ---

function StatsCard({ label, value, icon: Icon, color }: any) {
    const colorMap: any = {
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
    };
    const style = colorMap[color] || colorMap.blue;

    return (
        <div className={`p-4 rounded-xl border ${style.split(' ')[2]} bg-gray-900/50 backdrop-blur-sm flex items-center gap-4`}>
            <div className={`p-3 rounded-lg ${style}`}>
                <Icon size={24} />
            </div>
            <div>
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
            </div>
        </div>
    );
}

function ModuleCard({ title, desc, icon: Icon, color, bg, border, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`group text-left p-6 rounded-2xl border ${border} ${bg} backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col h-full`}
        >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-white/20 transition-all group-hover:scale-110`}>
                <Icon size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>

            <div className="mt-auto pt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 group-hover:text-white transition-colors">
                Open Module <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </button>
    );
}

function ArrowLeftIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
        </svg>
    )
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Dashboard...</div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}
