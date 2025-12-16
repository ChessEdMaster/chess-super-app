
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function populateConcepts() {
    console.log('🚀 Starting Concept Population...');

    // 1. Call the database function to get aggregated tags
    console.log('📊 Aggregating tags from 5M+ exercises (this may take a moment)...');
    const { data: concepts, error } = await supabase.rpc('get_unique_tags_with_count');

    if (error) {
        console.error('❌ Error fetching concepts:', error);
        return;
    }

    if (!concepts || concepts.length === 0) {
        console.log('⚠️ No concepts returned. Is academy_exercises empty?');
        return;
    }

    console.log(`✅ Found ${concepts.length} unique concepts.`);

    // 2. Insert/Update into academy_concepts
    console.log('💾 Saving to academy_concepts table...');

    let successCount = 0;
    let failCount = 0;

    for (const concept of concepts) {
        const tagName = concept.tag_name;
        const count = concept.puzzle_count;

        // Formatting name for display (e.g. 'kingsideAttack' -> 'Kingside Attack')
        // Simple heuristic: capitalize first letter, space before capitals if camelCase (though Lichess tags are usually kebab or camel)
        const displayName = tagName
            .replace(/([A-Z])/g, ' $1') // Space before capital
            .replace(/^./, (str: string) => str.toUpperCase()) // Capitalize first
            .replace(/-/g, ' ') // Replace hyphens with spaces
            .trim();

        const { error: upsertError } = await supabase
            .from('academy_concepts')
            .upsert({
                name: tagName,
                display_name: displayName,
                puzzle_count: count,
                updated_at: new Date().toISOString()
            }, { onConflict: 'name' });

        if (upsertError) {
            console.error(`   ❌ Failed to save ${tagName}:`, upsertError.message);
            failCount++;
        } else {
            successCount++;
        }
    }

    console.log(`🎉 Concept Population Complete!`);
    console.log(`   ✅ Saved: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
}

populateConcepts();
