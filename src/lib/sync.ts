import { createClient } from '@supabase/supabase-js';

// Use Service Role for Cron/Backend operations to bypass RLS
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.warn('Missing Supabase Service Role credentials. Sync operations will fail.');
        return null;
    }

    return createClient<any>(url, key);
};

interface Member {
    user: {
        id: string;
        username: string;
        roles: string[];
    };
    roles: string[];
}

export async function syncNeighborhoodMembers(hoodId: string, roleId: string) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) throw new Error('Service Role Key missing');

    const BOT_API_URL = process.env.BOT_API_URL;
    const BOT_API_KEY = process.env.BOT_API_KEY;

    // 1. Fetch Members from Discord Bot
    const requestUrl = `${BOT_API_URL}/members/list?roleId=${roleId}`;
    console.log(`[Sync] Fetching from: ${requestUrl}`);

    const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': BOT_API_KEY || ''
        }
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error(`[Sync] Bot API Error (${response.status}): ${errText}`);
        throw new Error(`Bot API error: ${response.statusText}`);
    }

    const data: { members: Member[] } = await response.json();
    console.log(`[Sync] Bot Response: Found ${data.members?.length || 0} members`);
    const discordMembers = data.members || [];

    // 2. Fetch Global Config & Local Hood Config
    const { data: globalConfig } = await supabaseAdmin
        .from('app_config')
        .select('key, value')
        .in('key', ['coleader_role_id', 'elder_role_id']);

    const coLeaderRoleId = globalConfig?.find((c: any) => c.key === 'coleader_role_id')?.value;
    const elderRoleId = globalConfig?.find((c: any) => c.key === 'elder_role_id')?.value;

    const { data: hoodConfig } = await supabaseAdmin
        .from('map_districts')
        .select('leader_discord_id, coleader_discord_ids')
        .eq('id', hoodId)
        .single();

    const fixedLeaderId = hoodConfig?.leader_discord_id;
    const fixedCoLeaderIds = hoodConfig?.coleader_discord_ids || [];

    // 3. Process Members
    const processedMembers = discordMembers.map(m => {
        let rank = 'Member';

        // 3a. Fixed Overrides (Highest Priority)
        if (m.user.id === fixedLeaderId) {
            rank = 'Leader';
        } else if (fixedCoLeaderIds.includes(m.user.id)) {
            rank = 'Co-Leader';
        }
        // 3b. Global Roles (Fallback)
        else {
            if (coLeaderRoleId && m.roles.includes(coLeaderRoleId)) {
                rank = 'Co-Leader';
            } else if (elderRoleId && m.roles.includes(elderRoleId)) {
                rank = 'Elder';
            }
        }

        return {
            hood_id: hoodId,
            discord_id: m.user.id,
            username: m.user.username,
            rank: rank,
            joined_at: new Date().toISOString()
        };
    });

    // 6. Upsert
    const { error } = await supabaseAdmin.from('hood_memberships').upsert(processedMembers, {
        onConflict: 'user_id,hood_id'
    });

    if (error) throw error;

    return { success: true, count: discordMembers.length };
}
