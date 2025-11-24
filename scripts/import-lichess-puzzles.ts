// AFEGEIX AIXÒ AL PRINCIPI DEL FITXER
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega les variables de .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';

// CONFIGURACIÓ
const BATCH_SIZE = 500; // Nombre d'exercicis per inserció
const MAX_PUZZLES = 50000; // Límit per no omplir la DB durant proves (posa-ho a Infinity per tot)
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
const getDifficulty = (rating: number): 'easy' | 'medium' | 'hard' => {
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

    // 1. Spawn del procés zstd per descomprimir en streaming
    const zstd = spawn('zstd', ['-d', '-c', CSV_FILE_PATH]);

    let batch: any[] = [];
    let totalProcessed = 0;
    let totalInserted = 0;

    // Pipe de zstd cap al csv-parser
    const stream = zstd.stdout.pipe(csv());

    console.log('⏳ Processant stream...');

    for await (const data of stream) {
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
            console.log(`📊 Progrés: ${totalInserted} inserits (de ${totalProcessed} processats)`);
        }
    }

    // Inserir el romanent final
    if (batch.length > 0) {
        await insertBatch(batch);
        totalInserted += batch.length;
    }

    console.log(`✅ Importació finalitzada! Total inserits: ${totalInserted}`);
    process.exit(0);
}

async function insertBatch(batch: any[]) {
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
