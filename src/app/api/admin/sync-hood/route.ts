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

        // 3b. Prepare Data
        const upsertData = members.map((m: any) => {
            // Determine Rank from Discord Roles
            let rank = 'Member';
            if (roleIdCoLeader && m.roles.includes(roleIdCoLeader)) {
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

        // 3c. Merge with Existing (Preserve Manual Promotions ONLY if Discord doesn't enforce rank)
        // DECISION: If we have specific Role IDs configured, we Enforce them.
        // If not configured, we default to Member but respect existing DB rank (for manual edits).

        const { data: existing } = await supabase.from('hood_memberships').select('user_id, rank').eq('hood_id', hood_id);
        const existingMap = new Map(existing?.map(e => [e.user_id, e.rank]));

        const finalData = upsertData.map((m: any) => {
            // If Discord Role dictated a specific rank (CoLeader/Elder), use it.
            if (m.rank !== 'Member') {
                return m;
            }

            // If Discord says 'Member', checking if we should keep existing rank?
            // If user lost the role in Discord, they should be demoted.
            // But if we haven't configured Role IDs at all, we must rely on Manual or Existing.
            if (!roleIdCoLeader && !roleIdElder) {
                return { ...m, rank: existingMap.get(m.user_id) || 'Member' };
            }

            // If Role IDs are configured, and user has neither, they are Member.
            // Demotion Logic: Discord State is Truth.
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
