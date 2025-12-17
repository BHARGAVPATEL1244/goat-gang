import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncNeighborhoodMembers } from '@/lib/sync';

// Use Service Role to fetch the list of hoods (bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        // 1. Security Check (Vercel Cron)
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch all Hoods with Discord Role IDs
        const { data: districts, error } = await supabaseAdmin
            .from('map_districts')
            .select('id, name, hood_id')
            .not('hood_id', 'is', null)
            .neq('hood_id', '');

        if (error) throw error;
        if (!districts || districts.length === 0) {
            return NextResponse.json({ message: 'No districts configured for sync' });
        }

        // 3. Sync Each
        const results = [];
        for (const d of districts) {
            try {
                const res = await syncNeighborhoodMembers(d.hood_id, d.id);
                results.push({ hood: d.name, success: true, count: res.count });
            } catch (err: any) {
                console.error(`Cron Sync Failed for ${d.name}:`, err);
                results.push({ hood: d.name, success: false, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            synced_count: results.filter(r => r.success).length,
            results
        });

    } catch (error: any) {
        console.error('Cron Job Fatal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
