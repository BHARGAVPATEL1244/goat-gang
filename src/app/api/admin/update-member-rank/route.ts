
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { user_id, hood_id, rank } = await req.json();

        // Validation
        const validRanks = ['Leader', 'CoLeader', 'Elder', 'Member'];
        if (!validRanks.includes(rank)) {
            return NextResponse.json({ error: 'Invalid rank' }, { status: 400 });
        }

        const supabase = await createClient();

        // verify admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // TODO: Strict Admin Check (e.g. check user_roles table) if needed. 
        // For now, assuming middleware protects /admin routes or basic auth check is enough.

        // Update Rank
        const { error } = await supabase
            .from('hood_memberships')
            .update({ rank: rank })
            .match({ user_id, hood_id });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
