-- ============================================
-- SETUP MULTIPLAYER EN TEMPS REAL
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Assegurar que tenim els estats correctes
-- Estats possibles: 'pending' (esperant rival), 'active' (jugant), 'finished' (acabada)

-- 2. Índex per fer les cerques al Lobby ràpides
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);

-- 3. Política de seguretat vital: Permetre actualitzar la partida si n'ets jugador
-- (Ja teníem una política similar, però la reforcem per assegurar que el segon jugador pot entrar)
DROP POLICY IF EXISTS "Players can update their games" ON public.games;

CREATE POLICY "Players can update their games" ON public.games 
FOR UPDATE USING (
  auth.uid() = white_player_id OR 
  auth.uid() = black_player_id OR
  (black_player_id IS NULL) -- Permet unir-se a una partida buida
);

-- 4. Assegurar que Realtime està habilitat per a la taula games
-- (Això normalment es fa des del Dashboard de Supabase, però ho documentem aquí)
-- Ves a: Database > Replication > Habilita Realtime per a la taula 'games'

