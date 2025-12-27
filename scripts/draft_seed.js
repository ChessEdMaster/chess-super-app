
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { PGNParser } = require('../lib/pgn/parser'); // Adjusted import (might need to be run with ts-node or just use basic regex if not available in script context)

// Since we can't easily import TS modules in a simple node script without setup, 
// let's use a simplified parser or assume we run this with ts-node.
// For now, I'll write this to be robust and self-contained or use the app's libs if possible.
// Actually, let's just make it a simple script that reads the file and uses regex to extract games 
// because running full app code in a script might be tricky with imports.

// Load env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedEndgames() {
    console.log("Starting Endgame Seed...");

    const filePath = path.join(process.cwd(), 'public', 'databases', 'endgames.pgn');
    if (!fs.existsSync(filePath)) {
        console.error("File not found:", filePath);
        return;
    }

    const pgnContent = fs.readFileSync(filePath, 'utf-8');

    // Split games (simple split by [Event)
    const rawGames = pgnContent.split(/\[Event "/).filter(g => g.trim().length > 0).map(g => '[Event "' + g);

    console.log(`Found ${rawGames.length} games.`);

    // 1. Create Collection if not exists
    // We need a user_id or we make it owned by a system user / just use is_public=true
    // Let's check if we have a collection of type 'system_endgame'

    let { data: collection, error: colError } = await supabase
        .from('pgn_collections')
        .select('id')
        .eq('type', 'system_endgame')
        .single();

    if (!collection) {
        console.log("Creating 'Finals (Endgames)' collection...");
        const { data: user } = await supabase.auth.getUser(); // Might not work in script without session
        // We'll create it with specific ID or just let it generate.
        // Important: We need a user_id even for public collections usually, or we make the column nullable. 
        // Assuming we have to pick a user or make column nullable. For now let's hope the user running this (via client) is logged in? 
        // Ah, running this via `node` won't have auth context. 
        // We might need to run this from the BROWSER console or a temporary React component if we don't have service_role key.

        console.error("Cannot create collection without a user context. Please run this logic from the app client (e.g. a temporary button) or provide a SERVICE_ROLE key.");
        return;
    }

    console.log("Collection ID:", collection.id);

    // 2. Insert Games
    let count = 0;
    for (const gamePgn of rawGames) {
        // Extract basic metadata
        const getTag = (tag) => {
            const m = gamePgn.match(new RegExp(`\\[${tag} "([^"]+)"\\]`));
            return m ? m[1] : '?';
        };

        const white = getTag('White');
        const black = getTag('Black');
        const event = getTag('Event');
        const result = getTag('Result');
        const date = getTag('Date');

        const { error } = await supabase.from('pgn_games').insert({
            collection_id: collection.id,
            pgn: gamePgn,
            white,
            black,
            event,
            result,
            date
        });

        if (error) console.error("Error inserting game:", error.message);
        else count++;

        if (count % 10 === 0) console.log(`Inserted ${count} games...`);
    }

    console.log("Done!");
}

// Note: This script is intended to be adapted or run in a context with access.
// Since we are in the agent, I will actually implement a `SeedButton` in the UI for the user to click
// because I don't have the Service Role key to run independent scripts easily.
