'use server';

import { createClient } from "@/utils/supabase/server";

export async function getTopBumpers() {
    const supabase = await createClient();

    // Fetch Top 50 (plenty to show top 10 and list)
    const { data: bumps, error } = await supabase
        .from('leaderboard_bumps')
        .select('*')
        .order('count', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching bumps:', error);
        return [];
    }

    if (!bumps || bumps.length === 0) return [];

    // Enhance with User Names from hood_memberships if possible
    // We collect all user IDs
    const userIds = bumps.map(b => b.user_id);

    // Fetch profiles/memberships
    const { data: members } = await supabase
        .from('hood_memberships')
        .select('user_id, nickname, username')
        .in('user_id', userIds);

    const memberMap = new Map();
    members?.forEach(m => {
        memberMap.set(m.user_id, m.nickname || m.username);
    });

    // Merge Data
    return bumps.map(bump => ({
        user_id: bump.user_id,
        count: bump.count,
        last_bumped_at: bump.last_bumped_at,
        name: memberMap.get(bump.user_id) || 'Anonymous Goat'
    }));
}
