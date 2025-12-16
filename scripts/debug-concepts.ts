// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugConcepts() {
    console.log("🔍 Debugging Concepts & Exercises...");

    // 1. Check Total Concepts count
    const { count, error: countError } = await supabase
        .from('academy_concepts')
        .select('*', { count: 'exact', head: true });

    console.log(`Total Concepts in DB: ${count} (Error: ${countError?.message})`);

    // 2. Check 'Sicilian_Defense' Concept
    const { data: sicilianCard } = await supabase
        .from('academy_concepts')
        .select('*')
        .ilike('name', '%Sicilian%')
        .limit(5);

    console.log("Found Sicilian Concepts:", sicilianCard);

    if (sicilianCard && sicilianCard.length > 0) {
        const tagName = sicilianCard[0].name; // e.g., 'Sicilian_Defense' matches card logic
        console.log(`Checking exercises for tag: '${tagName}'...`);

        // 3. Check Exercises with this tag
        const { count: exerciseCount, error: exError } = await supabase
            .from('academy_exercises')
            .select('*', { count: 'exact', head: true })
            .contains('tags', [tagName]);

        console.log(`Exercises found for '${tagName}': ${exerciseCount} (Error: ${exError?.message})`);

        // 4. Inspect one exercise
        const { data: sample } = await supabase
            .from('academy_exercises')
            .select('id, tags')
            .contains('tags', [tagName])
            .limit(1);

        console.log("Sample Exercise Tags:", sample?.[0]?.tags);
    }
}

debugConcepts();
