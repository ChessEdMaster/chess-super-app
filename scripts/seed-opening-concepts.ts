// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const OPENINGS = [
    { name: 'sicilianDefense', display_name: 'Defensa Siciliana', category: 'AGGRESSION', description: 'La defensa més popular i agressiva contra 1.e4.', color: 'red', icon: 'Sword' },
    { name: 'frenchDefense', display_name: 'Defensa Francesa', category: 'SOLIDITY', description: 'Solidesa i contraatac al centre després de 1.e4 e6.', color: 'blue', icon: 'Shield' },
    { name: 'ruyLopez', display_name: 'Ruy López', category: 'KNOWLEDGE', description: 'Una de les obertures més antigues i riques.', color: 'amber', icon: 'BookOpen' },
    { name: 'caroKann', display_name: 'Defensa Caro-Kann', category: 'SOLIDITY', description: 'Estructura dura com una roca, molt difícil de trencar.', color: 'stone', icon: 'Shield' },
    { name: 'italianGame', display_name: 'Obertura Italiana', category: 'KNOWLEDGE', description: 'Desenvolupament ràpid i control central clàssic.', color: 'orange', icon: 'BookOpen' },
    { name: 'queensGambit', display_name: 'Gambit de Dama', category: 'KNOWLEDGE', description: 'Sacrifici temporal per dominar el centre.', color: 'purple', icon: 'BrainCircuit' },
    { name: 'kingsIndian', display_name: 'Indi de Rei', category: 'AGGRESSION', description: 'Contraatac ferotge al flanc de rei.', color: 'red', icon: 'Sword' },
    { name: 'londonSystem', display_name: 'Sistema Londres', category: 'SOLIDITY', description: 'Esquema universal i sòlid, fàcil d\'aprendre.', color: 'slate', icon: 'Shield' },
    { name: 'scandinavianDefense', display_name: 'Defensa Escandinava', category: 'SPEED', description: 'Desafia el centre immediatament amb d5.', color: 'cyan', icon: 'Zap' },
    { name: 'slavDefense', display_name: 'Defensa Eslava', category: 'SOLIDITY', description: 'Suport sòlid al centre sense bloquejar l\'alfil.', color: 'blue', icon: 'Shield' },
    { name: 'pircDefense', display_name: 'Defensa Pirc', category: 'SPEED', description: 'Defensa hipermoderna per atacar el centre més tard.', color: 'lime', icon: 'Zap' },
    { name: 'englishOpening', display_name: 'Obertura Anglesa', category: 'KNOWLEDGE', description: 'Control flexible del centre des del flanc.', color: 'emerald', icon: 'BookOpen' },
    { name: 'alehkineDefense', display_name: 'Defensa Alekhine', category: 'SPEED', description: 'Provocació al blanc perquè avanci els seus peons.', color: 'yellow', icon: 'Zap' },
    { name: 'kingsGambit', display_name: 'Gambit de Rei', category: 'AGGRESSION', description: 'Obertura romàntica i perillosa: tot o res.', color: 'red', icon: 'Sword' },
    { name: 'viennaGame', display_name: 'Partida vienesa', category: 'KNOWLEDGE', description: 'Tranquil·la però amb possibilitats tàctiques.', color: 'amber', icon: 'BookOpen' }
];

async function seedOpenings() {
    console.log(`🌱 Seeding ${OPENINGS.length} Opening Concepts...`);

    // We set puzzle_count to 0 for now as we don't have the counts from DB yet.
    // The previous script might overwrite these if ran again, but since these names don't match the 62 tags, they are safe (mostly).
    // Wait, 'sicilian' might be normalized? Lichess uses 'sicilianDefense' usually.

    const concepts = OPENINGS.map(o => ({
        name: o.name,
        display_name: o.display_name,
        description: o.description,
        category: o.category,
        puzzle_count: 0,
        icon: o.icon,
        color: o.color,
        updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
        .from('academy_concepts')
        .upsert(concepts, { onConflict: 'name' });

    if (error) {
        console.error('❌ Error seeding openings:', error);
    } else {
        console.log('✅ Openings seeded successfully.');
    }
}

seedOpenings();
