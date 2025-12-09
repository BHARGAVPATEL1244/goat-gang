'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { PERMISSIONS } from '@/utils/permissions';
import { getRolePermissions } from '@/app/actions/permissions';
import { Loader2 } from 'lucide-react';

export default function GiveawaysPage() {
    const router = useRouter();
    const supabase = createClient();
    const [giveaways, setGiveaways] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Access Control
    const [loadingAccess, setLoadingAccess] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.replace('/');
                return;
            }

            const dbPerms = await getRolePermissions();
            let userRoles: string[] = [];

            const pid = session.user.app_metadata?.provider === 'discord' ? session.user.user_metadata?.provider_id : null;
            if (pid) {
                const ADMIN_USER_IDS = (process.env.NEXT_PUBLIC_ADMIN_USER_IDS || '').split(',');
                if (ADMIN_USER_IDS.includes(pid)) userRoles.push(PERMISSIONS.ROLES.ADMIN[0]);

                try {
                    const res = await fetch(`/api/bot/membership?userId=${pid}`);
                    const data = await res.json();
                    if (data.user?.roles) userRoles = [...userRoles, ...data.user.roles];
                } catch (e) { console.error(e); }
            }

            if (!PERMISSIONS.canManageGiveaways(userRoles, dbPerms)) {
                router.replace('/admin');
            } else {
                setHasAccess(true);
                setLoadingAccess(false);
            }
        };
        checkAccess();
    }, []);

    useEffect(() => {
        if (!hasAccess) return;

        fetchGiveaways();

        // Realtime subscription
        const channel = supabase
            .channel('giveaways_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'giveaways' }, (payload) => {
                fetchGiveaways();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [hasAccess]);

    const fetchGiveaways = async () => {
        const res = await fetch('/api/giveaways');
        const data = await res.json();
        if (data.success) {
            setGiveaways(data.data);
        }
        setLoading(false);
    };

    const handleEndGiveaway = async (giveawayId: string, messageId: string, winnersCount: number) => {
        if (!confirm('Are you sure you want to end this giveaway?')) return;

        // 1. Fetch entries to pick winners
        const { data: entries } = await supabase
            .from('giveaway_entries')
            .select('user_id')
            .eq('giveaway_id', giveawayId);

        if (!entries || entries.length === 0) {
            alert('No entries found for this giveaway.');
            // Still mark as ended? Maybe not.
            return;
        }

        // 2. Pick random winners
        const winners = [];
        const entriesCopy = [...entries];
        for (let i = 0; i < winnersCount && entriesCopy.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * entriesCopy.length);
            winners.push(entriesCopy.splice(randomIndex, 1)[0].user_id);
        }

        // 3. Call API to announce on Discord
        // We need the guildId and channelId too, but let's see if we can get them from the giveaway object in the list
        const giveaway = giveaways.find(g => g.id === giveawayId);
        if (!giveaway) return;

        try {
            const res = await fetch('/api/giveaways/end', { // We need to implement this endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guildId: giveaway.guild_id,
                    channelId: giveaway.channel_id,
                    messageId: messageId,
                    winners: winners
                })
            });

            const data = await res.json();
            if (data.success) {
                // 4. Update DB status
                await supabase.from('giveaways').update({ status: 'ended' }).eq('id', giveawayId);
                alert('Giveaway ended and winners announced!');
                fetchGiveaways();
            } else {
                alert('Error ending giveaway: ' + data.error);
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    if (loadingAccess) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (!hasAccess) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                    Giveaways
                </h1>
                <button
                    onClick={() => router.push('/admin/giveaways/create')}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-bold transition-colors"
                >
                    + Create Giveaway
                </button>
            </div>

            {loading ? (
                <div className="text-center text-gray-400">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {giveaways.map((g) => (
                        <div key={g.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 relative overflow-hidden group hover:border-blue-500 transition-colors">
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold uppercase rounded-bl-xl ${g.status === 'running' ? 'bg-green-600 text-white' :
                                g.status === 'ended' ? 'bg-gray-600 text-gray-300' : 'bg-yellow-600 text-white'
                                }`}>
                                {g.status}
                            </div>

                            <h3 className="text-xl font-bold mb-2 truncate">{g.title}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{g.description}</p>

                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between">
                                    <span>Prize:</span>
                                    <span className="font-semibold text-yellow-400">{g.prize}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Winners:</span>
                                    <span>{g.winners}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Ends:</span>
                                    <span>{new Date(g.end_time).toLocaleDateString()} {new Date(g.end_time).toLocaleTimeString()}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm font-bold transition-colors">
                                    View Entries
                                </button>
                                {g.status === 'running' && (
                                    <button
                                        onClick={() => handleEndGiveaway(g.id, g.message_id, g.winners)}
                                        className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 py-2 rounded text-sm font-bold transition-colors border border-red-800"
                                    >
                                        End Now
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {giveaways.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                            No giveaways found. Create one to get started!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
