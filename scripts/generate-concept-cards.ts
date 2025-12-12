// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { createClient } = require('@supabase/supabase-js');

// Supabase Admin Client (Service Role for high priviledge actions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables (SUPABASE_SERVICE_ROLE_KEY is required).');
    process.exit(1);
}

// Increase timeout for the client is tricky, so we use batching to keep queries light.
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function generateConceptCards() {
    console.log('🚀 Generating Concept Cards via Batched Processing...');

    const BATCH_SIZE = 50000;
    let processedCount = 0;
    let lastId = '00000000-0000-0000-0000-000000000000'; // Start at dictionary min
    const tagCounts = {};
    let hasMore = true;
    let batchIndex = 0;

    console.log('📊 Starting batch extraction from academy_exercises...');

    try {
        while (hasMore) {
            // Fetch next batch using Cursor Pagination (efficient for large tables)
            // We select only 'id' and 'tags' to minimize bandwidth
            const { data, error } = await supabase
                .from('academy_exercises')
                .select('id, tags')
                .gt('id', lastId)
                .order('id', { ascending: true })
                .limit(BATCH_SIZE);

            if (error) {
                console.error('❌ Error fetching batch:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            // Process tags in memory
            data.forEach(row => {
                if (row.tags && Array.isArray(row.tags)) {
                    row.tags.forEach(tag => {
                        const normalizedTag = tag.trim(); // Keep case or lower? Lichess uses CamelCase usually
                        // We accumulate count
                        tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
                    });
                }
            });

            // Update cursor
            lastId = data[data.length - 1].id;
            processedCount += data.length;
            batchIndex++;

            process.stdout.write(`\r🔄 Processed batch #${batchIndex}: Total rows ${processedCount.toLocaleString()}...`);

            // Safety break for testing if needed, but for prod we want all
            // if (processedCount > 100000) break; 
        }

        console.log(`\n✅ Extraction complete. Processed ${processedCount.toLocaleString()} rows.`);

        // Convert Map to Array
        const concepts = Object.entries(tagCounts).map(([tagName, count]) => ({
            name: tagName,
            puzzle_count: count,
            display_name: formatDisplayName(tagName),
            updated_at: new Date().toISOString()
        }));

        console.log(`found ${concepts.length} unique tags.`);

        // 3. Upsert into academy_concepts
        console.log('📝 Upserting concepts into database...');
        const UPSERT_BATCH_SIZE = 100;
        let upsertedCount = 0;

        for (let i = 0; i < concepts.length; i += UPSERT_BATCH_SIZE) {
            const batch = concepts.slice(i, i + UPSERT_BATCH_SIZE);

            const { error: upsertError } = await supabase
                .from('academy_concepts')
                .upsert(batch, { onConflict: 'name' });

            if (upsertError) {
                console.error(`❌ Error upserting concepts batch ${i}:`, upsertError.message);
            } else {
                upsertedCount += batch.length;
            }
        }

        console.log(`🎉 Successfully updated ${upsertedCount} Concept Cards!`);

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

function formatDisplayName(tag) {
    // Simple formatter: replaces newPattern -> New Pattern
    if (!tag) return '';
    let display = tag.replace(/([A-Z])/g, ' $1').trim();
    display = display.charAt(0).toUpperCase() + display.slice(1);
    return display;
}

generateConceptCards();
