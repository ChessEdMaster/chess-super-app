
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applySql() {
    console.log('🚀 Applying SQL Fix directly...');

    const sql = `
    CREATE OR REPLACE FUNCTION get_unique_tags_with_count()
    RETURNS TABLE(tag_name text, puzzle_count bigint) AS $$
    BEGIN
        RETURN QUERY
        WITH tags_unrolled AS (
            SELECT unnest(tags) as tag
            FROM academy_exercises
            LIMIT 5000 
        )
        SELECT
            tag as tag_name,
            COUNT(*)::bigint as puzzle_count
        FROM
            tags_unrolled
        GROUP BY
            tag
        ORDER BY
            puzzle_count DESC;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

    // We can't execute raw SQL easily with js client unless we wrap it in a function or have an rpc that executes sql (dangerous, unlikely).
    // BUT: "academy_exercises" suggests we have a Supabase project.
    // Actually, standard supabase-js client cannot execute DDL unless we have a specialized function `exec_sql`.
    // Let's assume we DO NOT have `exec_sql`.

    // Alternative: We can try to populate using JS logic (fetch rows, aggregate in JS).
    // 5000 rows is nothing for Node.js.

    console.log('⚠️ Cannot execute DDL via JS client directly. Switching strategy.');
    console.log('🔄 Fetching 5000 rows efficiently and aggregating in Node.js...');

    const { data: exercises, error } = await supabase
        .from('academy_exercises')
        .select('tags')
        .limit(5000);

    if (error) {
        console.error('❌ Error fetching exercises:', error);
        return;
    }

    if (!exercises) {
        console.warn('No exercises found.');
        return;
    }

    console.log(`✅ Fetched ${exercises.length} rows.`);
    const tagCounts: Record<string, number> = {};

    exercises.forEach(row => {
        if (row.tags && Array.isArray(row.tags)) {
            row.tags.forEach((tag: string) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });

    const concepts = Object.entries(tagCounts).map(([tag, count]) => ({
        tag_name: tag,
        puzzle_count: count
    })).sort((a, b) => b.puzzle_count - a.puzzle_count);

    console.log(`✅ Identified ${concepts.length} unique concepts.`);
    console.log('💾 Saving to academy_concepts table...');

    let successCount = 0;
    for (const concept of concepts) {
        const displayName = concept.tag_name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .replace(/-/g, ' ')
            .trim();

        const { error: upsertError } = await supabase
            .from('academy_concepts')
            .upsert({
                name: concept.tag_name,
                display_name: displayName,
                puzzle_count: concept.puzzle_count,
                updated_at: new Date().toISOString()
            }, { onConflict: 'name' });

        if (!upsertError) successCount++;
    }

    console.log(`🎉 Client-side Population Complete! Saved ${successCount} concepts.`);
}

applySql();
