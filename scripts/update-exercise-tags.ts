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

async function updateExerciseTags() {
    console.log(`🚀 Starting Massive Tag Update via RPC...`);

    if (!fs.existsSync(CSV_FILE)) {
        console.error('❌ CSV file not found.');
        process.exit(1);
    }

    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let rowCount = 0;
    let updatesBuffer = [];
    const BATCH_SIZE = 500; // Optimal for RPC payload size
    let processedBatches = 0;
    let totalUpdated = 0;

    console.log('📊 Processing rows...');

    for await (const line of rl) {
        if (rowCount === 0) {
            rowCount++;
            continue; // Skip header
        }

        const cols = line.split(',');
        if (cols.length < 9) continue;

        // Columns: PuzzleId(0), ..., Themes(7), ..., OpeningTags(9)
        const puzzleId = cols[0];
        const themes = cols[7] ? cols[7].split(' ') : [];
        const openingTags = cols.length > 9 && cols[9] ? cols[9].split(' ') : [];

        const allTags = [...new Set([...themes, ...openingTags])].filter(t => t);

        if (allTags.length > 0) {
            updatesBuffer.push({
                lichess_id: puzzleId,
                tags: allTags
            });
        }

        if (updatesBuffer.length >= BATCH_SIZE) {
            await flushBatch(updatesBuffer);
            totalUpdated += updatesBuffer.length;
            updatesBuffer = [];
            processedBatches++;
            process.stdout.write(`\r🔄 Processed ${rowCount.toLocaleString()} rows | Updated ${totalUpdated.toLocaleString()}...`);
        }

        rowCount++;

        // Safety break for testing (remove for production)
        if (rowCount > 1000000) break; // Start with 1M rows first to test performance
    }

    if (updatesBuffer.length > 0) {
        await flushBatch(updatesBuffer);
        totalUpdated += updatesBuffer.length;
    }

    console.log(`\n✅ Finished. Total rows scanned: ${rowCount}. Total updates sent: ${totalUpdated}.`);
}

async function flushBatch(batch) {
    let retries = 3;
    while (retries > 0) {
        try {
            const { error } = await supabase.rpc('bulk_update_exercise_tags', { payload: batch });
            if (error) throw error;
            return;
        } catch (err) {
            console.error(`\n❌ Error flushing batch: ${err.message}. Retrying...`);
            retries--;
            if (retries === 0) console.error('Aborting batch.');
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

updateExerciseTags();
