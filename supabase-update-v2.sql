-- ============================================
-- SETUP V2: CHAT & TIME MANAGEMENT
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Actualitzar taula GAMES amb temps
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS white_time INTEGER DEFAULT 600, -- 10 minuts en segons
ADD COLUMN IF NOT EXISTS black_time INTEGER DEFAULT 600,
ADD COLUMN IF NOT EXISTS last_move_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Crear taula MESSAGES per al xat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Realtime per a missatges
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 4. Polítiques de seguretat per missatges
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages from their games" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = messages.game_id 
    AND (g.white_player_id = auth.uid() OR g.black_player_id = auth.uid())
  )
);

CREATE POLICY "Players can send messages to their games" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g 
    WHERE g.id = messages.game_id 
    AND (g.white_player_id = auth.uid() OR g.black_player_id = auth.uid())
  )
);
