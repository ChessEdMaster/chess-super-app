// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    console.log('Inspecting academy_modules...');
    const { data, error } = await supabase
        .from('academy_modules')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        console.log('Found row:', data[0]);
        console.log('Keys:', data[0] ? Object.keys(data[0]) : 'No rows found');
    }
}
inspect();
