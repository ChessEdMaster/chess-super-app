// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const COURSES_TO_CREATE = [
    {
        title: 'Escacs i llengua a primer de primària',
        description: 'Curs curricular per aprendre escacs i llengua simultàniament. 1r de Primària.',
        target_grade: '1r Primària',
        difficulty_level: 'beginner',
        track: 'academic',
        subject: 'chess',
        published: true,
        slug: 'escacs-llengua-1-primaria'
    },
    {
        title: 'Escacs i llengua a segon de primària',
        description: 'Curs curricular per aprendre escacs i llengua simultàniament. 2n de Primària.',
        target_grade: '2n Primària',
        difficulty_level: 'beginner',
        track: 'academic',
        subject: 'chess',
        published: true,
        slug: 'escacs-llengua-2-primaria'
    },
    {
        title: 'Escacs extraescolar multinivell i multiedat',
        description: 'Espai de lleure educatiu per a tots els nivells i edats.',
        target_grade: 'Extraescolar',
        difficulty_level: 'intermediate',
        track: 'pedagogical',
        subject: 'chess',
        published: true,
        slug: 'escacs-extraescolar'
    },
    {
        title: "Escacs d'iniciació a la competició",
        description: 'Primers passos al món de la competició federada.',
        target_grade: 'Club',
        difficulty_level: 'intermediate',
        track: 'sport',
        subject: 'chess',
        published: true,
        slug: 'escacs-iniciacio-competicio'
    },
    {
        title: 'Escacs de competició',
        description: 'Entrenament avançat per a jugadors de club federats.',
        target_grade: 'Club',
        difficulty_level: 'advanced',
        track: 'sport',
        subject: 'chess',
        published: true,
        slug: 'escacs-competicio'
    }
];

async function redefineAcademy() {
    console.log('🚀 Starting Academy Redefinition...');

    console.log('📦 Archiving existing courses...');
    const { error: archiveError } = await supabase
        .from('academy_courses')
        .update({ published: false })
        .eq('published', true);

    if (archiveError) {
        console.error('❌ Error archiving courses:', archiveError);
    } else {
        console.log('✅ Archived existing courses.');
    }

    // 2. Create New Courses
    console.log('✨ Creating 5 new courses...');
    for (const course of COURSES_TO_CREATE) {
        const { data: newCourse, error: createError } = await supabase
            .from('academy_courses')
            .upsert(course, { onConflict: 'slug' })
            .select() // return the whole object including ID
            .single();

        if (createError) {
            console.error(`❌ Failed to create ${course.title}:`, createError);
            continue;
        }

        console.log(`✅ Created/Updated course: ${newCourse.title} (${newCourse.id})`);

        // 3. Create Module
        console.log(`   📂 Creating Module for ${course.title}...`);
        const moduleData = {
            course_id: newCourse.id,
            title: 'Curs 2024-2025',
            description: 'Mòdul principal del curs.',
            order: 1 // FIX: 'order', not 'order_index'
            // REMOVED 'published'
        };

        // Check if module exists 
        const { data: existingModules } = await supabase
            .from('academy_modules')
            .select('id')
            .eq('course_id', newCourse.id)
            .eq('title', 'Curs 2024-2025');

        let moduleId;
        if (existingModules && existingModules.length > 0) {
            moduleId = existingModules[0].id;
            console.log(`      Found existing module: ${moduleId}`);
        } else {
            const { data: newModule, error: moduleError } = await supabase
                .from('academy_modules')
                .insert(moduleData)
                .select()
                .single();

            if (moduleError) {
                console.error(`      ❌ Error creating module:`, moduleError);
                continue;
            }
            moduleId = newModule.id;
            console.log(`      Created new module: ${moduleId}`);
        }

        // 4. Create 30 Lessons
        console.log(`   📚 ensuring 30 lessons...`);
        const { count } = await supabase
            .from('academy_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('module_id', moduleId);

        const currentCount = count || 0;
        const missing = 30 - currentCount;

        if (missing > 0) {
            console.log(`      Creating ${missing} lessons...`);
            const lessonsToInsert = [];
            for (let i = 1; i <= missing; i++) {
                const lessonNum = currentCount + i;
                lessonsToInsert.push({
                    module_id: moduleId,
                    title: `Classe ${lessonNum}`,
                    description: `Contingut de la classe ${lessonNum}`,
                    order: lessonNum, // FIX: 'order', not 'order_index'
                    // REMOVED 'published', 'duration_minutes', 'type'
                    difficulty: 1, // field exists
                    is_free: false,
                    content: { markdown: `## Classe ${lessonNum}\n\nContingut pendent de definir.` }
                });
            }

            const { error: lessonsError } = await supabase
                .from('academy_lessons')
                .insert(lessonsToInsert);

            if (lessonsError) console.error(`      ❌ Error creating lessons:`, lessonsError);
            else console.log(`      ✅ Added ${missing} lessons.`);
        } else {
            console.log(`      ✅ Already has 30+ lessons.`);
        }
    }

    console.log('🎉 Academy Redefinition Complete (Data Only).');
    console.log('⚠️ REMINDER: You MUST run the SQL for schema changes (adding course_id to clubs) manually if script cannot.');
}

redefineAcademy();
