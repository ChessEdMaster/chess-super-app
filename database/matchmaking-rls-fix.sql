-- ============================================
-- SUPER FIX: MATCHMAKING RLS (Status-Based)
-- ============================================

-- 1. Ensure games table has RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 2. Broad SELECT policy for games
DROP POLICY IF EXISTS "Anyone can select games" ON public.games;
CREATE POLICY "Anyone can select games" ON public.games 
FOR SELECT USING (true);

-- 3. Robust UPDATE policy for joining games
-- ALLOW update if:
--   a) You are already one of the players (for normal moves)
--   b) The game is 'pending' (anyone can try to join)
DROP POLICY IF EXISTS "Players can update their games" ON public.games;
CREATE POLICY "Players can update their games" ON public.games 
FOR UPDATE 
USING (
  auth.uid() = white_player_id OR 
  auth.uid() = black_player_id OR 
  status = 'pending'
)
WITH CHECK (
  auth.uid() = white_player_id OR 
  auth.uid() = black_player_id
);

-- 4. Challenges Broad Permissions for testing
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can select challenges" ON public.challenges;
CREATE POLICY "Everyone can select challenges" ON public.challenges 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update challenges" ON public.challenges;
CREATE POLICY "Anyone can update challenges" ON public.challenges 
FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Delete policy to allow cleanup (for SuperAdmins/Hosts)
DROP POLICY IF EXISTS "Delete open challenges" ON public.challenges;
CREATE POLICY "Delete open challenges" ON public.challenges 
FOR DELETE USING (true);
