'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { LoginButton } from './LoginButton';
import { User } from '@supabase/supabase-js';
import JoinGuildModal from './JoinGuildModal';
import { PERMISSIONS } from '@/utils/permissions';
import { CommandMenu } from './CommandMenu';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [dbPermissions, setDbPermissions] = useState<any[]>([]);

    const pathname = usePathname();
    const supabase = createClient();

    const openCommand = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    };

    // Mapping for admin check (now handled via PERMISSIONS.hasAdminAccess with user ID)
    // const ADMIN_ROLE_IDS = process.env.NEXT_PUBLIC_DISCORD_ADMIN_ROLE_IDS?.split(',') || [];

    // Check membership and roles
    const checkMembershipAndRoles = async (currentUser: User) => {
        if (!currentUser) return;
        const providerId = currentUser.app_metadata?.provider === 'discord'
            ? currentUser.user_metadata?.provider_id
            : null;

        if (providerId) {
            try {
                setLoadingRoles(true);
                const res = await fetch(`/api/bot/membership?userId=${providerId}`);
                const data = await res.json();

                if (data.success) {
                    if (data.isMember === false) {
                        setShowJoinModal(true);
                    }
                    if (data.user?.roles) {
                        setUserRoles(data.user.roles);
                    }
                }
            } catch (e) {
                console.error('Membership/Role check failed', e);
            } finally {
                setLoadingRoles(false);
            }
        }
    };

    useEffect(() => {
        const getUser = async () => {
            // Fetch DB Rules
            try {
                const { getRolePermissions } = await import('@/app/actions/permissions');
                const rules = await getRolePermissions();
                setDbPermissions(rules);
            } catch (error) {
                console.error('Failed to load permissions', error);
            }

            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) checkMembershipAndRoles(user);
        };
        getUser();

        // Poll for role updates every 5 seconds
        const intervalId = setInterval(() => {
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session?.user) {
                    checkMembershipAndRoles(session.user);
                }
            });
        }, 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                checkMembershipAndRoles(currentUser);
            } else {
                setUserRoles([]);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearInterval(intervalId);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserRoles([]);
    };

    const isActive = (path: string) => pathname === path;

    // --- Access Control Logic ---
    // Check if user has ANY admin privileges using the centralized permission utility
    // This allows Co-Leaders/Leaders to seeing the menu if they have access to at least one module
    const hasAdminAccess = React.useMemo(() => {
        // providerId is derived from the current user (if logged in)
        const providerId = user?.user_metadata?.provider_id;
        return PERMISSIONS.hasAdminAccess(userRoles, providerId || '', dbPermissions);
    }, [userRoles, user, dbPermissions]);

    // Role Admin (If matches ANY of the ADMIN_ROLE_IDS)
    // kept for legacy simple check if needed, but UI switching uses hasAdminAccess
    const isAdmin = hasAdminAccess;

    // --- Menu Structure ---
    const links = [
        { href: '/neighborhoods', label: 'Hoods' },
        { href: '/events', label: 'Events' },
        { href: '/guides', label: 'Wiki' },
        { href: '/contact', label: 'Join' },
    ];

    // Admin links moved to Dashboard page directly

    // Helper for Dropdowns
    const NavDropdown = ({ title, links }: { title: string, links: { href: string, label: string }[] }) => {
        return (
            <div className="relative group">
                <button className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${links.some(l => isActive(l.href))
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}>
                    <span>{title}</span>
                    <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`block px-4 py-2 text-sm ${isActive(link.href)
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white">
                            <NextImage
                                src="/logo.png"
                                alt="Goat Gang Logo"
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain"
                                priority
                            />
                            <span className="hidden sm:block">Goat Gang</span>
                            <span className="sm:hidden">Goat Gang</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            Home
                        </Link>

                        <NavDropdown title="Community" links={links} />

                        {hasAdminAccess && (
                            <Link href="/admin" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin')
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                Dashboard
                            </Link>
                        )}

                        <Link href="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard')
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                            Bar Vault
                        </Link>

                        {/* Search Trigger (Desktop) */}
                        <button
                            onClick={openCommand}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 group"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                            <span className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 hidden lg:block group-hover:border-gray-400 transition-colors">⌘K</span>
                        </button>

                        {user ? (
                            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-600">
                                <span className="text-sm font-bold text-white max-w-[150px] truncate">
                                    {user.user_metadata?.full_name || user.email}
                                </span>
                                {user.user_metadata?.avatar_url && (
                                    <NextImage
                                        src={user.user_metadata.avatar_url}
                                        alt="Avatar"
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full border border-gray-600"
                                    />
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-red-400 hover:text-red-300 font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="ml-4">
                                <LoginButton />
                            </div>
                        )}
                        <ThemeToggle />
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {/* Search Trigger (Mobile) */}
                        <button
                            onClick={openCommand}
                            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <ThemeToggle />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link href="/" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}>Home</Link>

                        {/* Community Links Mobile */}
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Community</div>
                        {links.map(link => (
                            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.href)
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                } pl-6 border-l-2 border-transparent hover:border-blue-500`}>{link.label}</Link>
                        ))}

                        {/* Bar Vault Mobile */}
                        <Link href="/dashboard" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/dashboard')
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}>Bar Vault</Link>

                        {/* Admin Link Mobile */}
                        {hasAdminAccess && (
                            <Link href="/admin" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/admin')
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}>Dashboard</Link>
                        )}

                        <div className="border-t border-gray-700 mt-2 pt-2">
                            {user ? (
                                <div className="space-y-2 px-3">
                                    <div className="flex items-center gap-2">
                                        {user.user_metadata?.avatar_url && (
                                            <NextImage
                                                src={user.user_metadata.avatar_url}
                                                alt="Avatar"
                                                width={32}
                                                height={32}
                                                className="w-8 h-8 rounded-full border border-gray-600"
                                            />
                                        )}
                                        <span className="text-white font-bold truncate">
                                            {user.user_metadata?.full_name || user.email}
                                        </span>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left text-red-400 hover:text-red-300 py-2">Logout</button>
                                </div>
                            ) : (
                                <div className="p-2"><LoginButton className="w-full justify-center" /></div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <JoinGuildModal isOpen={showJoinModal} />
            <CommandMenu />
        </nav>
    );
}
