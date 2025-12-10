'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Save, User, Shield, Star, Crown } from 'lucide-react';

function MemberManagerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const hoodId = searchParams.get('hood_id');
    const hoodName = searchParams.get('name');

    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (hoodId) fetchMembers();
    }, [hoodId]);

    const fetchMembers = async () => {
        setLoading(true);
        // Assuming hood_id in memberships links to map_districts.hood_id (Discord Role ID)
        // We need to query by that column.
        const { data, error } = await supabase
            .from('hood_memberships')
            .select('*')
            .eq('hood_id', hoodId)
            .order('rank', { ascending: false }); // Sort might need custom logic 

        if (data) {
            // Custom sort: Leader > CoLeader > Elder > Member
            const rankOrder: Record<string, number> = { 'Leader': 0, 'CoLeader': 1, 'Elder': 2, 'Member': 3 };
            const sorted = data.sort((a, b) => (rankOrder[a.rank] || 99) - (rankOrder[b.rank] || 99));
            setMembers(sorted);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRank: string) => {
        try {
            const res = await fetch('/api/admin/update-member-rank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    hood_id: hoodId,
                    rank: newRank
                })
            });

            if (!res.ok) throw new Error('Failed to update');

            // Optimistic update
            setMembers(prev => prev.map(m =>
                m.user_id === userId ? { ...m, rank: newRank } : m
            ));

        } catch (err) {
            alert('Error updating role');
        }
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'Leader': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            case 'CoLeader': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
            case 'Elder': return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
            default: return 'text-gray-400 border-gray-700 bg-gray-800';
        }
    };

    if (!hoodId) return <div className="text-white p-10">Invalid Hood ID</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Map Manager
            </button>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <User className="text-blue-500" />
                        Managing Members
                    </h1>
                    <p className="text-xl text-gray-400 mt-2">{hoodName} <span className="text-sm opacity-50 font-mono">({hoodId})</span></p>
                </div>
                <div className="text-sm text-gray-500">
                    Total: {members.length} members
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20">Loading members...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {members.map((member) => (
                        <div key={member.user_id} className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex items-center justify-between hover:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
                                    {member.avatar_url ? (
                                        <img src={member.avatar_url} alt={member.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{member.nickname || member.username}</h3>
                                    <p className="text-sm text-gray-500 font-mono">@{member.username}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRankColor(member.rank)}`}>
                                    {member.rank}
                                </div>

                                <select
                                    value={member.rank}
                                    onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                    className="bg-black/40 border border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Leader">Leader (Castle)</option>
                                    <option value="CoLeader">Co-Leader (Market)</option>
                                    <option value="Elder">Elder (Advanced)</option>
                                    <option value="Member">Member (House)</option>
                                </select>
                            </div>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="text-center py-10 text-gray-500 bg-gray-800/20 rounded-xl border border-dashed border-gray-700">
                            No members found. Try syncing first!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function HoodMembersPage() {
    return (
        <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
            <MemberManagerContent />
        </Suspense>
    );
}
