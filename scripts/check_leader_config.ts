
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    console.log('--- Checking App Config ---');
    const { data: config } = await supabase.from('app_config').select('*');
    console.table(config);

    console.log('\n--- Checking Map Districts (Leaders) ---');
    const { data: districts } = await supabase.from('map_districts').select('id, name, leader_name, leader_discord_id');
    console.table(districts);
}

check();
