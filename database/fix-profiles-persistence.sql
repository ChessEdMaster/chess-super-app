-- ============================================
-- FIX PROFILES PERSISTENCE AND RLS
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Activar RLS a la taula profiles (si no ho està)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Polítiques per la taula profiles
-- Permetre que l'usuari vegi el seu propi perfil
DROP POLICY IF EXISTS "Usuaris poden veure el seu propi perfil" ON public.profiles;
CREATE POLICY "Usuaris poden veure el seu propi perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Permetre que l'usuari actualitzi el seu propi perfil (camps segurs)
DROP POLICY IF EXISTS "Usuaris poden actualitzar el seu propi perfil" ON public.profiles;
CREATE POLICY "Usuaris poden actualitzar el seu propi perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Activar RLS a arena_progress
ALTER TABLE public.arena_progress ENABLE ROW LEVEL SECURITY;

-- 4. Polítiques per arena_progress
DROP POLICY IF EXISTS "Usuaris poden veure el seu propi progrés de l'arena" ON public.arena_progress;
CREATE POLICY "Usuaris poden veure el seu propi progrés de l'arena" 
ON public.arena_progress FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuaris poden actualitzar el seu propi progrés de l'arena" ON public.arena_progress;
CREATE POLICY "Usuaris poden actualitzar el seu propi progrés de l'arena" 
ON public.arena_progress FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: add_xp RPC handles its own security via SECURITY DEFINER
