
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log('Inspecting academy_concepts...');
    const { data, error } = await supabase.from('academy_concepts').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Row:', data[0]);
    }
}

inspect();
