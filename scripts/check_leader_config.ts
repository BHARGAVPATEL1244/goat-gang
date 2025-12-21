
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    console.log('--- Checking Map Districts (Leaders) ---');
    const { data: districts } = await supabase.from('map_districts').select('id, name, leader_name, leader_discord_id');
    console.table(districts);

    if (districts && districts.length > 0) {
        // Check the first one, or specifically one if known
        const hood = districts[0];
        console.log(`\n--- Inspecting Hood: ${hood.name} (${hood.id}) ---`);

        const { data: members } = await supabase
            .from('hood_memberships')
            .select('*')
            .eq('hood_id', hood.id);

        console.log(`Total Members: ${members?.length}`);
        if (members && members.length > 0) {
            console.table(members);
        } else {
            console.log('No members found in DB for this hood.');
        }
    }
}

check();
