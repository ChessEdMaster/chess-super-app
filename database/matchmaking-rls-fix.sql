-- ============================================
-- FIX MATCHMAKING RLS POLICIES
-- ============================================

-- 1. Enable RLS on games if not already enabled
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to see games (so they can join them)
DROP POLICY IF EXISTS "Anyone can select games" ON public.games;
CREATE POLICY "Anyone can select games" ON public.games 
FOR SELECT USING (true);

-- 3. Fix the update policy to allow joining when either player slot is empty
DROP POLICY IF EXISTS "Players can update their games" ON public.games;
CREATE POLICY "Players can update their games" ON public.games 
FOR UPDATE USING (
  auth.uid() = white_player_id OR 
  auth.uid() = black_player_id OR
  white_player_id IS NULL OR 
  black_player_id IS NULL
);

-- 4. Ensure challenges also have a broad update policy for status changes
DROP POLICY IF EXISTS "Users can update challenge status" ON public.challenges;
CREATE POLICY "Users can update challenge status" ON public.challenges 
FOR UPDATE USING (true);
