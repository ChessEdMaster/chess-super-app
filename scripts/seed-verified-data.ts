
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const DATA_DIR = path.join(process.cwd(), 'lichess-data');

function parseXML(content: string) {
    const items = [];
    const nameRegex = /<string name="([^"]+)">([^<]+)<\/string>/g;
    let match;
    const descriptions: Record<string, string> = {};

    // First pass to get values and check for descriptions (which are separate keys like name="XDescription")
    const rawMap: Record<string, string> = {};
    while ((match = nameRegex.exec(content)) !== null) {
        rawMap[match[1]] = match[2];
    }

    // Now build objects
    for (const key in rawMap) {
        if (key.endsWith('Description')) continue;

        items.push({
            name: key,
            display_name: rawMap[key],
            description: rawMap[key + 'Description'] || '',
            category: 'THEME'
        });
    }
    return items;
}

function parseTSV(content: string, limit: number | null = null) {
    const lines = content.split('\n');
    const items: any[] = [];
    // Skip header
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        if (limit && items.length >= limit) break;

        const [eco, name, pgn] = lines[i].split('\t');
        if (!name) continue;

        // Create a unique slug/name
        // Eco is not unique. Name is usually unique.
        // We'll slugify the name.
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        items.push({
            name: slug,
            display_name: `${eco}: ${name}`,
            description: `**ECO:** ${eco}\n\n**Moves:** ${pgn}`, // Fallback if no specific columns
            category: 'OPENING',
            eco: eco,
            pgn: pgn
        });
    }
    return items;
}

async function seed() {
    console.log('🚀 Starting Verified Data Seed...');

    // 1. Process Themes
    const xmlPath = path.join(DATA_DIR, 'puzzleTheme.xml');
    if (fs.existsSync(xmlPath)) {
        console.log(`📦 Processing puzzleTheme.xml...`);
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');
        const themes = parseXML(xmlContent);
        console.log(`   Found ${themes.length} themes.`);

        await upsertBatch(themes);
    }

    // 2. Process Openings (A-E)
    const files = ['a.tsv', 'b.tsv', 'c.tsv', 'd.tsv', 'e.tsv'];
    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
            console.log(`📦 Processing ${file}...`);
            const tsvContent = fs.readFileSync(filePath, 'utf8');
            const openings = parseTSV(tsvContent);
            console.log(`   Found ${openings.length} openings in ${file}.`);

            await upsertBatch(openings);
        }
    }
}

interface ConceptItem {
    name: string;
    display_name: string;
    description: string;
    category: string;
    eco?: string;
    pgn?: string;
}

async function upsertBatch(items: ConceptItem[]) {
    // Deduplicate items by name to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const uniqueItems = new Map<string, ConceptItem>();
    items.forEach(item => {
        if (!uniqueItems.has(item.name)) {
            uniqueItems.set(item.name, item);
        } else {
            // Optional: Handle duplicates (e.g. merge descriptions or skip)
            // console.warn(`Skipping duplicate name: ${item.name}`);
        }
    });
    const dedupedItems = Array.from(uniqueItems.values());
    console.log(`   Deduped ${items.length} -> ${dedupedItems.length} items`);

    const BATCH_SIZE = 100;

    // Check schema capabilities (basic check)
    // We'll just try to insert with extra columns, if it fails, we retry without them.
    let useExtendedColumns = false; // FORCE FALSE because migration is not applied yet.

    for (let i = 0; i < dedupedItems.length; i += BATCH_SIZE) {
        const batch = dedupedItems.slice(i, i + BATCH_SIZE);

        const payload = batch.map(item => {
            const base: any = {
                name: item.name,
                display_name: item.display_name,
                description: item.description,
                category: item.category,
                updated_at: new Date().toISOString()
            };
            if (useExtendedColumns && item.eco) {
                // If we want to try inserting eco/pgn/metadata
                // We'll put them in metadata if the columns don't exist? No, user needs to run migration.
                // We'll try to insert `eco` and `pgn` as columns if the user applied migration.
                // If not, we fall back to standard.
                // Actually, let's just try to inject them into the object.
                base.eco = item.eco;
                base.pgn = item.pgn;
                base.metadata = { eco: item.eco, pgn: item.pgn };
            }
            return base;
        });

        const { error } = await supabase
            .from('academy_concepts')
            .upsert(payload, { onConflict: 'name' });

        if (error) {
            if (useExtendedColumns && error.message.includes('column') && error.message.includes('does not exist')) {
                console.warn('⚠️  Extended columns (eco, pgn) not found. Falling back to basic columns.');
                useExtendedColumns = false;
                i -= BATCH_SIZE; // Retry this batch
                continue;
            }
            console.error(`❌ Error upserting batch:`, error.message);
        } else {
            process.stdout.write('.');
        }
    }
    console.log('\n✅ Batch complete.');
}

seed();
