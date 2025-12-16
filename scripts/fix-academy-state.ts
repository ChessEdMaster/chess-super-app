// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BETA_SLUGS = [
    'escacs-llengua-1-primaria',
    'escacs-llengua-2-primaria',
    'escacs-extraescolar',
    'escacs-iniciacio-competicio',
    'escacs-competicio'
];

async function fixCourses() {
    console.log('🔧 Fixing Beta Courses visibility...');

    const { data, error } = await supabase
        .from('academy_courses')
        .update({ published: true })
        .in('slug', BETA_SLUGS)
        .select();

    if (error) console.error('❌ Error updating.', error);
    else console.log(`✅ Updated ${data.length} courses to published=true.`);
}

fixCourses();
