import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types'; // Assuming you have types, if not use 'any'

// Use Service Role for Cron/Backend operations to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function syncNeighborhoodMembers(hood_discord_role_id: string, hood_db_id: string) {
    const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3000/api';
    const BOT_API_KEY = process.env.BOT_API_KEY;

    // 1. Fetch Members from Discord Bot
    const response = await fetch(`${BOT_API_URL}/members/list?roleId=${hood_discord_role_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': BOT_API_KEY || ''
        }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Bot API Error: ${err}`);
    }

    const data = await response.json();
    const members = data.members; // Array of { id, username, nickname, ... }

    if (!members || members.length === 0) {
        return { success: true, count: 0, message: 'No members found in Discord with that role' };
    }

    // 2. Fetch Global Config (Role IDs)
    const { data: configRows } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['role_id_coleader', 'role_id_elder']);

    const config = new Map(configRows?.map((r: any) => [r.key, r.value]));
    const roleIdCoLeader = config.get('role_id_coleader');
    const roleIdElder = config.get('role_id_elder');

    // 3. Fetch Local Hood Config (Fixed IDs)
    const { data: hoodConfig } = await supabaseAdmin
        .from('map_districts')
        .select('leader_discord_id, coleader_discord_ids')
        .eq('id', hood_db_id)
        .single();

    const fixedLeaderId = hoodConfig?.leader_discord_id;
    const fixedCoLeaderIds = hoodConfig?.coleader_discord_ids || [];

    // 4. Prepare Data
    const upsertData = members.map((m: any) => {
        let rank = 'Member';

        // Priority 1: Fixed Leader
        if (fixedLeaderId && m.id === fixedLeaderId) {
            rank = 'Leader';
        }
        // Priority 2: Fixed Co-Leaders
        else if (fixedCoLeaderIds.includes(m.id)) {
            rank = 'CoLeader';
        }
        // Priority 3: Global Discord Roles
        else if (roleIdCoLeader && m.roles.includes(roleIdCoLeader)) {
            rank = 'CoLeader';
        } else if (roleIdElder && m.roles.includes(roleIdElder)) {
            rank = 'Elder';
        }

        return {
            user_id: m.id,
            hood_id: hood_discord_role_id,
            rank: rank,
            nickname: m.nickname || m.displayName,
            username: m.username,
            avatar_url: m.avatar
        };
    });

    // 5. Merge with Existing (Preserve Manual Promotions if no global rules override)
    const { data: existing } = await supabaseAdmin
        .from('hood_memberships')
        .select('user_id, rank')
        .eq('hood_id', hood_discord_role_id);

    const existingMap = new Map(existing?.map((e: any) => [e.user_id, e.rank]));

    const finalData = upsertData.map((m: any) => {
        if (m.rank !== 'Member') return m;

        // If no global rules configured, respect existing rank? 
        // Or strictly enforce 'Member' if they don't have roles?
        // Let's stick to strict sync for now, unless specific requirement. 
        // But the previous code had a check:
        if (!roleIdCoLeader && !roleIdElder) {
            return { ...m, rank: existingMap.get(m.user_id) || 'Member' };
        }
        return m;
    });

    // 6. Upsert
    const { error } = await supabaseAdmin.from('hood_memberships').upsert(finalData, {
        onConflict: 'user_id,hood_id'
    });

    if (error) throw error;

    return { success: true, count: members.length };
}
