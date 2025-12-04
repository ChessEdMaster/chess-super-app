-- ============================================
-- FIX: Políticas RLS para la tabla messages
-- Executa aquest SQL al Supabase SQL Editor per corregir el problema del chat
-- ============================================

-- 1. Verificar políticas existentes
-- SELECT * FROM pg_policies WHERE tablename = 'messages';

-- 2. Eliminar políticas problemáticas si existen
DROP POLICY IF EXISTS "Anyone can read messages from their games" ON public.messages;
DROP POLICY IF EXISTS "Players can send messages to their games" ON public.messages;

-- 3. Crear políticas corregidas que evitan recursión

-- Política de lectura: Los jugadores pueden leer mensajes de sus partidas
-- CRÍTICO: Evitar recursión verificando directamente desde games
CREATE POLICY "Players can read messages from their games" ON public.messages
FOR SELECT USING (
  -- Verificar directamente si el usuario es jugador de la partida
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = messages.game_id 
    AND (g.white_player_id = auth.uid() OR g.black_player_id = auth.uid())
  )
  OR
  -- Permitir leer si eres el autor del mensaje (para casos edge)
  messages.user_id = auth.uid()
);

-- Política de inserción: Los jugadores pueden enviar mensajes a sus partidas
CREATE POLICY "Players can send messages to their games" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = messages.game_id 
    AND (g.white_player_id = auth.uid() OR g.black_player_id = auth.uid())
  )
);

-- 4. Verificar que RLS está habilitado
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas creadas
-- SELECT * FROM pg_policies WHERE tablename = 'messages';

-- 6. Crear índice para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_messages_game_id ON public.messages(game_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

