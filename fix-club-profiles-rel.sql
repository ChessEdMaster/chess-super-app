-- ============================================
-- FIX: CLUB MEMBERS RELATIONSHIP
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Afegir Foreign Key a profiles per permetre joins fàcils
-- Això permet fer .select('*, profiles(*)') des de club_members
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'club_members_user_id_fkey_profiles'
    ) THEN
        ALTER TABLE public.club_members 
        ADD CONSTRAINT club_members_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    END IF;
END $$;

-- 2. Assegurar que els permisos són correctes per a la lectura de perfils
-- (Normalment profiles és públic, però ens assegurem)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
