// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listConcepts() {
    const { data: concepts } = await supabase.from('academy_concepts').select('name');
    console.log(concepts.map(c => c.name).sort());
}

listConcepts();
