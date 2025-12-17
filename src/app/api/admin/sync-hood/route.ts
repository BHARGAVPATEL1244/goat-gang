import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { syncNeighborhoodMembers } from '@/lib/sync';

export async function POST(req: Request) {
    try {
        const { hood_id, hood_db_id } = await req.json();

        if (!hood_id || !hood_db_id) {
            return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
        }

        // 1. Verify Admin
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // 2. Call Shared Sync Logic
        const result = await syncNeighborhoodMembers(hood_id, hood_db_id);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
