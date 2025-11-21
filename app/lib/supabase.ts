import { createClient } from '@supabase/supabase-js';

// Aquesta lògica agafa les variables del teu fitxer .env.local
// El signe '!' al final diu a TypeScript que estem segurs que existeixen
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Creem i exportem el client perquè tota la app el pugui fer servir
export const supabase = createClient(supabaseUrl, supabaseKey);