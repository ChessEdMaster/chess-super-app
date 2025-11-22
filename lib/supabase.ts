import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ Error Crític: Falten les variables d\'entorn de Supabase. Verifica el fitxer .env.local o la configuració de Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

