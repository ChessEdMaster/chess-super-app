
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
    console.log("Checking Concepts Table...");
    const { count, error } = await supabase.from('academy_concepts').select('*', { count: 'exact', head: true });
    if (error) console.error("Error:", error);
    console.log("Concept Count:", count);

    console.log("Checking Mining...");
    // Mock mining
    const { data } = await supabase.from('academy_exercises').select('*').limit(5);
    console.log("Exercises sample:", data?.length);
}
verify();
