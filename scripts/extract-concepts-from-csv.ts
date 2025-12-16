// @ts-nocheck
const fs = require('fs');
const readline = require('readline');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CSV_FILE = 'lichess_db_puzzle.csv';

async function extractConcepts() {
    console.log(`🚀 Starting Concept Extraction from ${CSV_FILE}`);

    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ CSV file not found. Please decompress it first.');
        process.exit(1);
    }

    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const concepts = new Map(); // tagName -> count
    let rowCount = 0;
    let headers = [];

    console.log('📊 Processing rows...');

    for await (const line of rl) {
        if (rowCount === 0) {
            headers = line.split(',');
            rowCount++;
            continue;
        }

        // Simple CSV parser (assuming no commas in fields for now, or handling simple cases)
        // Lichess CSV is well behaved? Let's assume split by ',' works for these text fields.
        const cols = line.split(',');

        // PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
        // Index: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
        // Note: FEN might have commas? No, FEN uses spaces/slashes.
        // GameUrl might have commas? No.
        // Safest is to grab known indices. 
        // Themes = 7
        // OpeningTags = 9 (if exists)

        if (cols.length < 8) continue; // Malformed

        const themes = cols[7];
        const openingTags = cols.length > 9 ? cols[9] : '';

        // Process Themes
        if (themes) {
            const tags = themes.split(' ');
            tags.forEach(t => {
                if (!t) return;
                const normalized = t.trim();
                concepts.set(normalized, (concepts.get(normalized) || 0) + 1);
            });
        }

        // Process OpeningTags
        // Example: Kings_Pawn_Game Kings_Pawn_Game_Leonardis_Variation
        // These use underscores. We should convert them to readable names later or keep as IDs.
        // User wants "all concepts". Let's treat them as tags.
        if (openingTags) {
            const tags = openingTags.split(' ');
            tags.forEach(t => {
                if (!t) return;
                const normalized = t.trim();
                concepts.set(normalized, (concepts.get(normalized) || 0) + 1);
            });
        }

        rowCount++;
        if (rowCount % 100000 === 0) {
            process.stdout.write(`\r🔄 Processed ${rowCount.toLocaleString()} rows... Unique concepts: ${concepts.size}`);
        }
    }

    console.log(`\n✅ Finished reading. Unique concepts found: ${concepts.size}`);

    // Prepare for DB Upsert
    console.log('📝 Preparing database update...');

    // Convert Map to Array
    const conceptList = Array.from(concepts.entries()).map(([name, count]) => ({
        name: name,
        puzzle_count: count,
        display_name: formatDisplayName(name),
        // We preserve existing description/icon/color if we do ON CONFLICT DO UPDATE SET puzzle_count = EXCLUDED.puzzle_count
        updated_at: new Date().toISOString()
    }));

    // Batch Upsert
    const BATCH_SIZE = 500;
    for (let i = 0; i < conceptList.length; i += BATCH_SIZE) {
        const batch = conceptList.slice(i, i + BATCH_SIZE);

        // We only update puzzle_count and updated_at to avoid wiping out manual edits to descriptions/icons
        // But if it's new, it insults defaults.
        const { error } = await supabase
            .from('academy_concepts')
            .upsert(batch, { onConflict: 'name' });

        if (error) {
            console.error(`❌ Error batch ${i}:`, error.message);
        } else {
            process.stdout.write(`\rSaved ${Math.min(i + BATCH_SIZE, conceptList.length)} / ${conceptList.length} concepts.`);
        }
    }

    console.log('\n🎉 Concept Extraction Complete!');
}

function formatDisplayName(tag) {
    // CamelCase to Normal String
    // Kings_Pawn_Game -> Kings Pawn Game
    let display = tag.replace(/_/g, ' ');
    display = display.replace(/([A-Z])/g, ' $1').trim();
    return display.charAt(0).toUpperCase() + display.slice(1);
}

extractConcepts();
