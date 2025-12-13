
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const checkHoods = async () => {
    console.log("Checking Hood IDs...");
    const { data, error } = await supabase
        .from('map_districts')
        .select('name, hood_id');

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Existing Hoods:", data);
    }
};

checkHoods();
