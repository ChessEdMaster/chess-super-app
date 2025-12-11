// @ts-nocheck
// AFEGEIX AIXÒ AL PRINCIPI DEL FITXER
const dotenv = require('dotenv');
const path = require('path');

// Carrega les variables de .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const { spawn } = require('child_process');
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// CONFIGURACIÓ
const BATCH_SIZE = 500; // Nombre d'exercicis per inserció
const MAX_PUZZLES = Infinity; // Límit per no omplir la DB durant proves (posa-ho a Infinity per tot)
const MIN_RATING = 600;   // Filtrar exercicis massa fàcils o erronis
const CSV_FILE_PATH = path.resolve('lichess_db_puzzle.csv.zst'); // El fitxer descarregat

// Supabase Admin Client (Service Role per saltar RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Falten les variables d\'entorn de Supabase (necessites SERVICE_ROLE_KEY).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Funció per mapejar dificultat segons Rating
const getDifficulty = (rating) => {
    if (rating < 1200) return 'easy';
    if (rating < 1800) return 'medium';
    return 'hard';
};

async function importPuzzles() {
    console.log('🚀 Iniciant la ingestió de puzles de Lichess...');

    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`❌ No s'ha trobat el fitxer: ${CSV_FILE_PATH}`);
        console.log('👉 Descarrega\'l de: https://database.lichess.org/#puzzles');
        process.exit(1);
    }

    // 0. Contar quants exercicis tenim ja
    const { count, error } = await supabase
        .from('academy_exercises')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error consultant la DB:', error);
        process.exit(1);
    }

    const currentCount = count || 0;
    console.log(`📊 Actualment tens ${currentCount} exercicis a la base de dades.`);
    console.log(`⏭️  Saltarem els primers ${currentCount} del CSV i continuarem des d'allà.`);

    // 1. Spawn del procés zstd per descomprimir en streaming
    const zstdPath = path.resolve('zstd.exe');
    console.log(`Using zstd from: ${zstdPath}`);
    const zstd = spawn(zstdPath, ['-d', '-c', CSV_FILE_PATH]);

    let batch = [];
    let totalProcessed = 0;
    let totalInserted = 0;
    let skippedCount = 0;

    // Pipe de zstd cap al csv-parser
    const stream = zstd.stdout.pipe(csv());

    console.log('⏳ Processant stream...');

    for await (const data of stream) {
        // Saltem els que ja tenim
        if (skippedCount < currentCount) {
            skippedCount++;
            if (skippedCount % 10000 === 0) {
                process.stdout.write(`\r⏭️  Saltant records... ${skippedCount}/${currentCount}`);
            }
            continue;
        }

        // Aturar si hem arribat al límit
        if (totalInserted >= MAX_PUZZLES) {
            stream.destroy(); // Tancar stream
            break;
        }

        const rating = parseInt(data.Rating);

        // Filtrat bàsic
        if (rating >= MIN_RATING) {
            const puzzle = {
                fen: data.FEN,
                solution: data.Moves.split(' '), // Convertir string a array
                title: `Lichess Puzzle #${data.PuzzleId}`,
                description: `Tema: ${data.Themes}`,
                difficulty: getDifficulty(rating),
                rating: rating,
                tags: data.Themes.split(' '),
                created_at: new Date().toISOString()
            };

            batch.push(puzzle);
        }

        totalProcessed++;

        // Inserir quan el batch està ple
        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            totalInserted += batch.length;
            batch = []; // Netejar batch
            console.log(`\n📊 Progrés: ${totalInserted} nous inserits (Total DB: ${currentCount + totalInserted})`);
        }
    }

    // Inserir el romanent final
    if (batch.length > 0) {
        await insertBatch(batch);
        totalInserted += batch.length;
    }

    console.log(`\n✅ Importació finalitzada! Nous inserits: ${totalInserted}. Total DB: ${currentCount + totalInserted}`);
    process.exit(0);
}

async function insertBatch(batch) {
    const { error } = await supabase.from('academy_exercises').insert(batch);

    if (error) {
        console.error('❌ Error insertant batch:', error.message);
        // Opcional: No aturar l'script, només loguejar l'error
    }
}

// Gestionar errors del procés fill
process.on('uncaughtException', (err) => {
    console.error('❌ Error inesperat:', err);
    process.exit(1);
});

importPuzzles();
