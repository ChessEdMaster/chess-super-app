// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Config env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase variables (url or service role key).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedCourse(filename) {
    console.log(`\n🌱 Seeding ${filename}...`);

    const coursePath = path.resolve(__dirname, `../database/courses/${filename}`);
    if (!fs.existsSync(coursePath)) {
        console.error(`❌ Course file not found at ${coursePath}`);
        return;
    }

    const courseDataRaw = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
    const { modules, ...courseMeta } = courseDataRaw;

    // 1. Create/Update Course
    let { data: course, error: courseError } = await supabase
        .from('academy_courses')
        .select('id')
        .eq('slug', courseMeta.slug)
        .single();

    if (!course) {
        console.log(`   Creating course: ${courseMeta.title}...`);
        const { data, error } = await supabase.from('academy_courses').insert(courseMeta).select().single();
        if (error) { console.error('   ❌ Error creating course:', error); return; }
        course = data;
    } else {
        console.log(`   Updating course: ${courseMeta.title}...`);
        const { error } = await supabase.from('academy_courses').update(courseMeta).eq('id', course.id);
        if (error) console.error('   ❌ Error updating course:', error);
    }

    console.log(`   ✅ Course ID: ${course.id}`);

    // 2. Iterate Modules
    for (const moduleItem of modules) {
        const { lessons, ...moduleMeta } = moduleItem;
        moduleMeta.course_id = course.id;

        // Check if module exists
        let { data: existingModule } = await supabase
            .from('academy_modules')
            .select('id')
            .eq('title', moduleMeta.title)
            .eq('course_id', course.id)
            .single();

        let moduleId;
        if (!existingModule) {
            const { data, error } = await supabase.from('academy_modules').insert(moduleMeta).select().single();
            if (error) { console.error('   ❌ Error creating module:', error); continue; }
            moduleId = data.id;
        } else {
            const { error } = await supabase.from('academy_modules').update(moduleMeta).eq('id', existingModule.id);
            if (error) console.error('   ❌ Error updating module:', error);
            moduleId = existingModule.id;
        }

        // 3. Process Lessons
        if (lessons && lessons.length > 0) {
            for (const lessonItem of lessons) {
                // MAP NEW STRUCTURE TO DB COLUMNS
                // online_content -> content
                // classroom_content -> monitor_guide
                // meta -> theme_metadata (plus title/order at root)

                const lessonData = {
                    module_id: moduleId,
                    title: lessonItem.meta.title,
                    order: lessonItem.meta.lesson_number,
                    description: lessonItem.meta.concept_summary,
                    content: lessonItem.online_content || {},
                    monitor_guide: lessonItem.classroom_content || {},
                    theme_metadata: lessonItem.meta || {},
                    // Ensure 'is_free' or other fields are set if needed
                    is_free: lessonItem.meta.lesson_number === 1 // Make first lesson free for previews
                };

                // Check for existing lesson
                let { data: existingLesson } = await supabase
                    .from('academy_lessons')
                    .select('id')
                    .eq('module_id', moduleId)
                    .eq('order', lessonData.order)
                    .single();

                if (!existingLesson) {
                    let { error } = await supabase.from('academy_lessons').insert(lessonData);
                    
                    // FALLBACK: If columns don't exist, nest them in content
                    if (error && error.message.includes('column') && (error.message.includes('monitor_guide') || error.message.includes('theme_metadata'))) {
                        // console.log(`      ⚠️  Columns missing, nesting metadata in 'content'...`);
                        const nestedContent = {
                            ...lessonData.content,
                            _monitor_guide: lessonData.monitor_guide,
                            _theme_metadata: lessonData.theme_metadata
                        };
                        const { monitor_guide, theme_metadata, ...retryData } = lessonData;
                        retryData.content = nestedContent;
                        const { error: retryError } = await supabase.from('academy_lessons').insert(retryData);
                        if (retryError) console.error(`      ❌ Retry failed for lesson ${lessonData.order}:`, retryError);
                    } else if (error) {
                        console.error(`      ❌ Error creating lesson ${lessonData.order}:`, error);
                    }
                } else {
                    let { error } = await supabase.from('academy_lessons').update(lessonData).eq('id', existingLesson.id);
                    
                    // FALLBACK
                    if (error && error.message.includes('column') && (error.message.includes('monitor_guide') || error.message.includes('theme_metadata'))) {
                        // console.log(`      ⚠️  Columns missing, nesting metadata in 'content' for update...`);
                        const nestedContent = {
                            ...lessonData.content,
                            _monitor_guide: lessonData.monitor_guide,
                            _theme_metadata: lessonData.theme_metadata
                        };
                        const { monitor_guide, theme_metadata, ...retryData } = lessonData;
                        retryData.content = nestedContent;
                        const { error: retryError } = await supabase.from('academy_lessons').update(retryData).eq('id', existingLesson.id);
                        if (retryError) console.error(`      ❌ Retry failed for lesson ${lessonData.order}:`, retryError);
                    } else if (error) {
                        console.error(`      ❌ Error updating lesson ${lessonData.order}:`, error);
                    }
                }
            }
            console.log(`   ✅ ${lessons.length} lessons processed in module.`);
        }
    }
}

async function main() {
    const files = [
        'level-1-beginners.json',
        'level-2-intermediate.json',
        'level-3-competition.json'
    ];

    for (const file of files) {
        await seedCourse(file);
    }
    
    console.log('\n🎉 ALL SEEDING COMPLETE!');
}

main();
