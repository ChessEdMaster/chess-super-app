// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixSicilian() {
    console.log("🛠️ Fixing Sicilian Duplication...");

    // 1. Get the GOOD one (from CSV)
    const { data: good } = await supabase.from('academy_concepts').select('*').eq('name', 'Sicilian_Defense').single();
    // 2. Get the BAD one (Manual Seed)
    const { data: bad } = await supabase.from('academy_concepts').select('*').eq('name', 'sicilianDefense').single();

    if (!good) {
        console.error("❌ 'Sicilian_Defense' (Source of Truth) not found! Did CSV import finish?");
        return;
    }

    if (bad) {
        console.log("Found duplicate 'sicilianDefense'. Merging info into 'Sicilian_Defense'...");

        // Update the Good one with the nice Metadata from the Bad one
        const { error: updateError } = await supabase
            .from('academy_concepts')
            .update({
                display_name: 'Defensa Siciliana', // Override 'Sicilian Defense' with Catalan
                description: bad.description,
                icon: bad.icon,
                color: bad.color,
                category: bad.category
            })
            .eq('id', good.id);

        if (updateError) console.error("Error updating good record:", updateError);
        else console.log("✅ Metadata merged.");

        // Delete the Bad one
        const { error: deleteError } = await supabase
            .from('academy_concepts')
            .delete()
            .eq('id', bad.id);

        if (deleteError) console.error("Error deleting duplicate:", deleteError);
        else console.log("✅ Duplicate deleted.");

    } else {
        console.log("No duplicate 'sicilianDefense' found. Just ensuring metadata.");
        // Ensure metadata anyway
        await supabase
            .from('academy_concepts')
            .update({
                display_name: 'Defensa Siciliana',
                icon: 'Sword',
                color: 'red',
                category: 'AGGRESSION'
            })
            .eq('id', good.id);
    }
}

fixSicilian();
