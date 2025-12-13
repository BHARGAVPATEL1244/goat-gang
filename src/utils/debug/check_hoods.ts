
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const checkHoods = async () => {
    console.log("Checking Hoods for Types...");
    const { data, error } = await supabase
        .from('map_districts')
        .select('name, type');

    if (error) {
        console.error("Error:", error);
    } else {
        const types = new Set(data?.map(d => d.type));
        console.log("Existing Types in DB:", Array.from(types));
    }
};

checkHoods();
