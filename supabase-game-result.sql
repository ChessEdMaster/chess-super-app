-- ============================================
-- GAME RESULTS & ELO SYSTEM
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Ensure ELO columns exist in profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS elo_bullet INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS elo_blitz INTEGER DEFAULT 1200,
ADD COLUMN IF NOT EXISTS elo_rapid INTEGER DEFAULT 1200;

-- 2. Create a table to store game history (if not exists)
CREATE TABLE IF NOT EXISTS public.game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  mode TEXT NOT NULL, -- 'bullet', 'blitz', 'rapid'
  result TEXT NOT NULL, -- 'win', 'loss', 'draw'
  opponent_elo INTEGER,
  points_change INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS for game_history
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game history" ON public.game_history
FOR SELECT USING (auth.uid() = user_id);

-- 4. Create the RPC function
CREATE OR REPLACE FUNCTION public.record_game_result(
  p_user_id UUID,
  p_mode TEXT,
  p_result TEXT,
  p_opponent_elo INTEGER
)
RETURNS JSONB AS $$
DECLARE
  current_elo INTEGER;
  new_elo INTEGER;
  k_factor INTEGER := 32;
  expected_score NUMERIC;
  actual_score NUMERIC;
  points_diff INTEGER;
  column_name TEXT;
BEGIN
  -- Determine which column to update
  IF p_mode = 'bullet' THEN
    column_name := 'elo_bullet';
  ELSIF p_mode = 'blitz' THEN
    column_name := 'elo_blitz';
  ELSIF p_mode = 'rapid' THEN
    column_name := 'elo_rapid';
  ELSE
    RAISE EXCEPTION 'Invalid game mode: %', p_mode;
  END IF;

  -- Get current ELO
  EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', column_name)
  INTO current_elo
  USING p_user_id;

  IF current_elo IS NULL THEN
    current_elo := 1200;
  END IF;

  -- Calculate Expected Score
  -- E = 1 / (1 + 10 ^ ((Rb - Ra) / 400))
  expected_score := 1.0 / (1.0 + power(10.0, (p_opponent_elo - current_elo)::NUMERIC / 400.0));

  -- Determine Actual Score
  IF p_result = 'win' THEN
    actual_score := 1.0;
  ELSIF p_result = 'draw' THEN
    actual_score := 0.5;
  ELSE
    actual_score := 0.0;
  END IF;

  -- Calculate New ELO
  new_elo := round(current_elo + k_factor * (actual_score - expected_score));
  points_diff := new_elo - current_elo;

  -- Update Profile
  EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', column_name)
  USING new_elo, p_user_id;

  -- Record History
  INSERT INTO public.game_history (user_id, mode, result, opponent_elo, points_change)
  VALUES (p_user_id, p_mode, p_result, p_opponent_elo, points_diff);

  -- Return result
  RETURN jsonb_build_object(
    'new_elo', new_elo,
    'points_diff', points_diff,
    'status', 'updated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
