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
        // In production this might need to range, assuming user has configured it correctly

        const response = await fetch(`${BOT_API_URL}/members/list?roleId=${hood_id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
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
        // We want to upsert them into hood_memberships
        // Default Rank = 'Member'

        const upsertData = members.map((m: any) => ({
            user_id: m.id,
            hood_id: hood_id, // This links to map_districts.hood_id (Discord Role ID)
            rank: 'Member',   // Default rank, will be overriden if exists
            nickname: m.nickname || m.displayName, // Use nickname if available, else display name
            username: m.username,
            avatar_url: m.avatar
            // plot_index: managed automatically or null
        }));

        // We use "ignoreDuplicates: true" to avoid overwriting Custom Ranks (Leader/Elder)
        // Actually, we SHOULD overwrite if they exist to update plots, but we don't want to demote Leaders
        // Strategy: Only insert if not exists? Or upsert but keep rank?
        // Supabase upsert with "onConflict" can basically Update everything except...

        // Simpler approach:
        // 1. Get existing members for this hood
        const { data: existing } = await supabase.from('hood_memberships').select('user_id, rank').eq('hood_id', hood_id);
        const existingMap = new Map(existing?.map(e => [e.user_id, e.rank]));

        const finalData = upsertData.map((m: any) => ({
            ...m,
            rank: existingMap.get(m.user_id) || 'Member' // Preserve existing rank
        }));

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
