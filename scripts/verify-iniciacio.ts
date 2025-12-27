// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    console.log('Verifying course: nivell-1-iniciacio...');
    
    // 1. Get Course
    const { data: courses, error: courseError } = await supabase
        .from('academy_courses')
        .select('id')
        .eq('slug', 'nivell-1-iniciacio');

    if (courseError || !courses.length) {
        console.error('❌ Course not found');
        return;
    }
    const courseId = courses[0].id;

    // 2. Get Modules
    const { data: modules, error: modError } = await supabase
        .from('academy_modules')
        .select('id, title')
        .eq('course_id', courseId);

    console.log(`✅ Found ${modules.length} modules:`, modules.map(m => m.title));

    for (const mod of modules) {
        const { data: lessons, error: lessonError } = await supabase
            .from('academy_lessons')
            .select('id, title, order, content')
            .eq('module_id', mod.id)
            .order('order', { ascending: true });

        console.log(`Module "${mod.title}" has ${lessons?.length || 0} lessons.`);
        
        if (lessons && lessons.length > 0) {
            const lesson1 = lessons.find(l => l.order === 1);
            if (lesson1) {
                console.log(`✅ Found Lesson with order 1: ${lesson1.title}`);
                console.log('--- Content Keys ---');
                console.log(Object.keys(lesson1.content));
                if (lesson1.content._monitor_guide) console.log('✅ Monitor Guide found');
                if (lesson1.content.challenges) console.log('✅ Challenges found');
            }
        }
    }
}
verify();
