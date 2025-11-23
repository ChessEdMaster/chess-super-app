// ============================================
// UTILITY SCRIPT TO POPULATE ACADEMY DATABASE
// Run this once to populate the database with initial data
// ============================================

import { supabase } from './supabase';
import {
    INITIAL_MODULES,
    FUNDAMENTALS_LESSONS,
    TACTICS_LESSONS,
    ENDGAME_LESSONS,
    INITIAL_EXERCISES,
    INITIAL_ACHIEVEMENTS
} from './academy-data';

export async function populateAcademyDatabase() {
    console.log('🚀 Starting academy database population...');

    try {
        // 1. Insert Modules
        console.log('📚 Inserting modules...');
        const { data: modules, error: modulesError } = await supabase
            .from('academy_modules')
            .insert(INITIAL_MODULES)
            .select();

        if (modulesError) throw modulesError;
        console.log(`✅ Inserted ${modules?.length} modules`);

        // 2. Insert Lessons
        console.log('📖 Inserting lessons...');

        // Find module IDs
        const fundamentalsModule = modules?.find(m => m.title === 'Fonaments');
        const tacticsModule = modules?.find(m => m.title === 'Tàctica Bàsica');
        const endgameModule = modules?.find(m => m.title === 'Finals Essencials');

        const lessonsToInsert = [
            ...FUNDAMENTALS_LESSONS.map(l => ({ ...l, module_id: fundamentalsModule?.id })),
            ...TACTICS_LESSONS.map(l => ({ ...l, module_id: tacticsModule?.id })),
            ...ENDGAME_LESSONS.map(l => ({ ...l, module_id: endgameModule?.id }))
        ];

        const { data: lessons, error: lessonsError } = await supabase
            .from('academy_lessons')
            .insert(lessonsToInsert)
            .select();

        if (lessonsError) throw lessonsError;
        console.log(`✅ Inserted ${lessons?.length} lessons`);

        // 3. Insert Exercises
        console.log('🧩 Inserting exercises...');
        const { data: exercises, error: exercisesError } = await supabase
            .from('academy_exercises')
            .insert(INITIAL_EXERCISES)
            .select();

        if (exercisesError) throw exercisesError;
        console.log(`✅ Inserted ${exercises?.length} exercises`);

        // 4. Insert Achievements
        console.log('🏆 Inserting achievements...');
        const { data: achievements, error: achievementsError } = await supabase
            .from('academy_achievements')
            .insert(INITIAL_ACHIEVEMENTS)
            .select();

        if (achievementsError) throw achievementsError;
        console.log(`✅ Inserted ${achievements?.length} achievements`);

        console.log('🎉 Academy database populated successfully!');
        return {
            modules,
            lessons,
            exercises,
            achievements
        };

    } catch (error) {
        console.error('❌ Error populating database:', error);
        throw error;
    }
}

// Helper function to check if data already exists
export async function checkExistingData() {
    const { count: modulesCount } = await supabase
        .from('academy_modules')
        .select('*', { count: 'exact', head: true });

    const { count: lessonsCount } = await supabase
        .from('academy_lessons')
        .select('*', { count: 'exact', head: true });

    const { count: exercisesCount } = await supabase
        .from('academy_exercises')
        .select('*', { count: 'exact', head: true });

    return {
        modules: modulesCount || 0,
        lessons: lessonsCount || 0,
        exercises: exercisesCount || 0
    };
}

// Helper function to clear all academy data (use with caution!)
export async function clearAcademyData() {
    console.log('⚠️  Clearing all academy data...');

    await supabase.from('user_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_exercise_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_lesson_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('academy_achievements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('academy_exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('academy_lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('academy_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ All academy data cleared');
}
