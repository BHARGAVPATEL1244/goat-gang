import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { hood_id, hood_db_id } = await req.json();

        if (!hood_id || !hood_db_id) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
        }

        // 1. Verify Admin (Basic Check, relying on Middleware for security mostly)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Fetch Members from Discord Bot
        // NOTE: We use the server-to-bot internal URL if possible, or public
        const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3000/api';
        const BOT_API_KEY = process.env.BOT_API_KEY;

        // In production this might need to range, assuming user has configured it correctly

        const response = await fetch(`${BOT_API_URL}/members/list?roleId=${hood_id}`, {
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
            return NextResponse.json({ message: 'No members found with that role', count: 0 });
        }

        // 3. Sync to Supabase

        // 3. Sync to Supabase

        // 3a. Fetch Global Config (Role IDs)
        const { data: configRows } = await supabase
            .from('app_config')
            .select('key, value')
            .in('key', ['role_id_coleader', 'role_id_elder']);

        const config = new Map(configRows?.map(r => [r.key, r.value]));
        const roleIdCoLeader = config.get('role_id_coleader');
        const roleIdElder = config.get('role_id_elder');

        console.log(`[SYNC] Config (Global): CoLeader=${roleIdCoLeader}, Elder=${roleIdElder}`);

        // 3b. Fetch Local Hood Config (Fixed IDs)
        const { data: hoodConfig } = await supabase
            .from('map_districts')
            .select('leader_discord_id, coleader_discord_ids')
            .eq('id', hood_db_id)
            .single();

        const fixedLeaderId = hoodConfig?.leader_discord_id;
        const fixedCoLeaderIds = hoodConfig?.coleader_discord_ids || [];

        console.log(`[SYNC] Hood ${hood_db_id}: Leader=${fixedLeaderId}, CoLeaders=${fixedCoLeaderIds.length}`);

        // 3c. Prepare Data
        const upsertData = members.map((m: any) => {
            // Determine Rank
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
                hood_id: hood_id, // Discord Role ID linking
                rank: rank,
                nickname: m.nickname || m.displayName,
                username: m.username,
                avatar_url: m.avatar
            };
        });

        // 3d. Merge with Existing (Preserve Manual Promotions ONLY if Discord doesn't enforce rank)
        // DECISION: If we have specific Role IDs configured, we Enforce them.
        // If not configured, we default to Member but respect existing DB rank (for manual edits).

        const { data: existing } = await supabase.from('hood_memberships').select('user_id, rank').eq('hood_id', hood_id);
        const existingMap = new Map(existing?.map(e => [e.user_id, e.rank]));

        const finalData = upsertData.map((m: any) => {
            // If Logic dictated a specific rank, use it.
            if (m.rank !== 'Member') {
                return m;
            }

            // If logic says 'Member', but user was previously promoted manually AND no global/fixed rules force otherwise...
            // Actually, we want Dynamic Sync. If they lost the role, they lose the rank.
            // BUT for simple "Member" vs "Elder" where Elder isn't configured, we might want to keep it?
            // "if no global role configured, keep existing"
            if (!roleIdCoLeader && !roleIdElder) {
                return { ...m, rank: existingMap.get(m.user_id) || 'Member' };
            }

            return m;
        });

        const { error } = await supabase.from('hood_memberships').upsert(finalData, {
            onConflict: 'user_id,hood_id'
        });

        if (error) throw error;

        return NextResponse.json({ success: true, count: members.length });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
