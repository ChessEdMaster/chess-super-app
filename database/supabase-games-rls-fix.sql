-- ============================================
-- FIX: Políticas RLS para la tabla games
-- Executa aquest SQL al Supabase SQL Editor per assegurar que les partides funcionen correctament
-- ============================================

-- 1. Verificar políticas existentes
-- SELECT * FROM pg_policies WHERE tablename = 'games';

-- 2. Eliminar políticas problemáticas si existen
DROP POLICY IF EXISTS "Players can update their games" ON public.games;
DROP POLICY IF EXISTS "Anyone can read games" ON public.games;
DROP POLICY IF EXISTS "Players can create games" ON public.games;

-- 3. Crear políticas corregidas

-- Política de lectura: Los jugadores pueden ver sus partidas
CREATE POLICY "Players can read their games" ON public.games 
  FOR SELECT USING (
    auth.uid() = white_player_id OR 
    auth.uid() = black_player_id OR
    auth.uid() IS NOT NULL -- Permitir ver partidas públicas (opcional, ajustar según necesidad)
  );

-- Política de creación: Usuarios autenticados pueden crear partidas
CREATE POLICY "Authenticated users can create games" ON public.games 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = white_player_id
  );

-- Política de actualización: Los jugadores pueden actualizar sus partidas
CREATE POLICY "Players can update their games" ON public.games 
  FOR UPDATE USING (
    auth.uid() = white_player_id OR 
    auth.uid() = black_player_id OR
    (black_player_id IS NULL AND auth.uid() = white_player_id) -- Permite unirse a partida vacía
  );

-- Política de eliminación: Solo el creador puede eliminar (opcional)
CREATE POLICY "Owners can delete their games" ON public.games 
  FOR DELETE USING (
    auth.uid() = white_player_id
  );

-- 4. Verificar que RLS está habilitado
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas creadas
-- SELECT * FROM pg_policies WHERE tablename = 'games';

