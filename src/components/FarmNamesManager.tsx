'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Role {
    id: string;
    name: string;
    color: string;
}

interface Member {
    id: string;
    username: string;
    discriminator: string;
    nickname: string | null;
    displayName: string;
    avatar: string;
}

export default function FarmNamesManager() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null); // Member ID being updated
    const [nicknames, setNicknames] = useState<{ [key: string]: string }>({}); // Local state for inputs

    const [roleSearch, setRoleSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Filter roles based on search
    const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(roleSearch.toLowerCase()));

    // Fetch Roles on Mount
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch('/api/bot/roles?prefix=Goat');
                const data = await res.json();
                if (data.roles) {
                    setRoles(data.roles);
                }
            } catch (error) {
                console.error('Failed to fetch roles:', error);
                toast.error('Failed to load roles');
            } finally {
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, []);

    // Fetch Members when Role Selected
    useEffect(() => {
        if (!selectedRole) {
            setMembers([]);
            return;
        }

        const fetchMembers = async () => {
            setLoadingMembers(true);
            try {
                const res = await fetch(`/api/bot/members/list?roleId=${selectedRole}`);
                const data = await res.json();
                if (data.members) {
                    setMembers(data.members);
                    // Initialize nickname inputs
                    const initialNicknames: { [key: string]: string } = {};
                    data.members.forEach((m: Member) => {
                        // If nickname is null/undefined, set to empty string so input describes "Enter Name"
                        // If it's set, pre-fill it.
                        initialNicknames[m.id] = m.nickname || '';
                    });
                    setNicknames(initialNicknames);
                } else {
                    setMembers([]); // Clear if no members returned
                }
            } catch (error) {
                console.error('Failed to fetch members:', error);
                toast.error('Failed to load members');
                setMembers([]);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, [selectedRole]);

    const handleNicknameChange = (id: string, value: string) => {
        setNicknames(prev => ({ ...prev, [id]: value }));
    };

    const handleUpdate = async (member: Member) => {
        if (!member.id) {
            toast.error("Critical Error: Member ID is missing!");
            return;
        }

        const newNickname = nicknames[member.id];
        if (newNickname === member.nickname) return; // No change
        // If nickname was null and newNickname is empty, also no change
        if (!member.nickname && !newNickname) return;

        setUpdating(member.id);
        try {
            const res = await fetch(`/api/bot/members/${member.id}/nickname`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: newNickname }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Updated ${member.username}`);
                // Update local member state to reflect "saved" state
                setMembers(prev => prev.map(m => m.id === member.id ? { ...m, nickname: newNickname || null } : m));
            } else {
                toast.error(data.error || 'Failed to update nickname');
            }
        } catch (error) {
            toast.error('Error updating nickname');
        } finally {
            setUpdating(null);
        }
    };

    const handleSelectRole = (roleId: string) => {
        setSelectedRole(roleId);
        setIsDropdownOpen(false);
        setRoleSearch(''); // Optional: clear search on select
    };

    const selectedRoleName = roles.find(r => r.id === selectedRole)?.name || '-- Select a Neighborhood --';

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 min-h-[400px]">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                Farm Name Manager
            </h2>

            {/* Combined Searchable Dropdown (Combobox) */}
            <div className="mb-8 relative w-full md:w-1/2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Neighborhood</label>

                {loadingRoles ? (
                    <div className="animate-pulse h-12 bg-gray-700 rounded-lg w-full"></div>
                ) : (
                    <div className="relative">
                        {/* Trigger Button */}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-left text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none flex justify-between items-center hover:bg-gray-800 transition-colors"
                        >
                            <span className={selectedRole ? "text-white" : "text-gray-500"}>
                                {selectedRoleName}
                            </span>
                            <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {/* Search Input Header */}
                                <div className="p-2 border-b border-gray-800 sticky top-0 bg-gray-900">
                                    <input
                                        type="text"
                                        autoFocus
                                        placeholder="Search neighborhoods..."
                                        value={roleSearch}
                                        onChange={(e) => setRoleSearch(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                                    />
                                </div>

                                {/* Options List */}
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredRoles.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">No matches found</div>
                                    ) : (
                                        filteredRoles.map(role => (
                                            <button
                                                key={role.id}
                                                onClick={() => handleSelectRole(role.id)}
                                                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0 flex items-center gap-2 ${selectedRole === role.id ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-300'
                                                    }`}
                                            >
                                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: role.color || '#ccc' }}></span>
                                                {role.name}
                                                {selectedRole === role.id && (
                                                    <span className="ml-auto">✓</span>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Overlay to close on click outside */}
                        {isDropdownOpen && (
                            <div
                                className="fixed inset-0 z-0"
                                onClick={() => setIsDropdownOpen(false)}
                            ></div>
                        )}
                    </div>
                )}
            </div>

            {/* Access Denied / Empty State */}
            {!selectedRole && !loadingRoles && (
                <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                    Please select a role to view members.
                </div>
            )}

            {/* Members List */}
            {selectedRole && (
                <div>
                    {loadingMembers ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse h-16 bg-gray-700 rounded-lg"></div>
                            ))}
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No members found with this role.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 border-b border-gray-700 text-sm uppercase">
                                        <th className="py-3 px-4">Farm Name (Server Name)</th>
                                        <th className="py-3 px-4">Edit Name</th>
                                        <th className="py-3 px-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {members.map(member => (
                                        <tr key={member.id} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={member.avatar || '/logo.png'}
                                                        alt={member.username}
                                                        className="w-10 h-10 rounded-full border border-gray-600"
                                                    />
                                                    <div>
                                                        <div className="font-semibold text-white text-lg">{member.displayName}</div>
                                                        <div className="text-xs text-gray-500">@{member.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <input
                                                    type="text"
                                                    maxLength={32}
                                                    value={nicknames[member.id] || ''}
                                                    onChange={(e) => handleNicknameChange(member.id, e.target.value)}
                                                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white w-full focus:border-yellow-500 focus:outline-none placeholder-gray-600"
                                                    placeholder={member.nickname ? "Edit Farm Name" : "Set Farm Name"}
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => handleUpdate(member)}
                                                    disabled={
                                                        updating === member.id ||
                                                        (nicknames[member.id] === (member.nickname || ''))
                                                    }
                                                    className={`px-4 py-2 rounded font-bold text-sm transition-all ${updating === member.id
                                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                                        : (nicknames[member.id] === (member.nickname || ''))
                                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                                            : 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20'
                                                        }`}
                                                >
                                                    {updating === member.id ? 'Saving...' : 'Update'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
