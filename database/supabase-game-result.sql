-- ============================================
-- GAME RESULTS & ELO SYSTEM v2
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Update ELO columns to default 0 (for new users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS elo_bullet INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS elo_blitz INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS elo_rapid INTEGER DEFAULT 0;

-- 2. Add streak tracking columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS win_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

-- 3. Create game_history table (if not exists)
CREATE TABLE IF NOT EXISTS public.game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  mode TEXT NOT NULL, -- 'bullet', 'blitz', 'rapid'
  result TEXT NOT NULL, -- 'win', 'loss', 'draw'
  opponent_elo INTEGER,
  points_change INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS for game_history
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own game history" ON public.game_history;
CREATE POLICY "Users can view their own game history" ON public.game_history
FOR SELECT USING (auth.uid() = user_id);

-- 5. Create the updated RPC function with new ELO system
-- ELO 0-1200: Win +25, Draw +10, Loss 0
-- ELO 1200+: FIDE system with K=20
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
  points_diff INTEGER;
  column_name TEXT;
  current_streak INTEGER;
  new_streak INTEGER;
  k_factor INTEGER := 20;
  expected_score NUMERIC;
  actual_score NUMERIC;
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

  -- Get current ELO and streak
  EXECUTE format('SELECT %I, win_streak FROM public.profiles WHERE id = $1', column_name)
  INTO current_elo, current_streak
  USING p_user_id;

  IF current_elo IS NULL THEN
    current_elo := 0;
  END IF;
  IF current_streak IS NULL THEN
    current_streak := 0;
  END IF;

  -- Calculate new ELO based on current rating
  IF current_elo < 1200 THEN
    -- Beginner system: Fixed points
    IF p_result = 'win' THEN
      points_diff := 25;
      new_streak := current_streak + 1;
    ELSIF p_result = 'draw' THEN
      points_diff := 10;
      new_streak := 0; -- Draws break streak
    ELSE -- loss
      points_diff := 0;
      new_streak := 0; -- Losses reset streak
    END IF;
    new_elo := current_elo + points_diff;
  ELSE
    -- FIDE-like system (K=20)
    -- E = 1 / (1 + 10 ^ ((Rb - Ra) / 400))
    expected_score := 1.0 / (1.0 + power(10.0, (p_opponent_elo - current_elo)::NUMERIC / 400.0));

    IF p_result = 'win' THEN
      actual_score := 1.0;
      new_streak := current_streak + 1;
    ELSIF p_result = 'draw' THEN
      actual_score := 0.5;
      new_streak := 0;
    ELSE
      actual_score := 0.0;
      new_streak := 0;
    END IF;

    new_elo := round(current_elo + k_factor * (actual_score - expected_score));
    points_diff := new_elo - current_elo;
    
    -- Ensure ELO doesn't drop below 1200 in FIDE mode
    IF new_elo < 1200 THEN
      new_elo := 1200;
      points_diff := 1200 - current_elo;
    END IF;
  END IF;

  -- Update Profile with new ELO and streak
  EXECUTE format('UPDATE public.profiles SET %I = $1, win_streak = $2, best_streak = GREATEST(best_streak, $2) WHERE id = $3', column_name)
  USING new_elo, new_streak, p_user_id;

  -- Record History
  INSERT INTO public.game_history (user_id, mode, result, opponent_elo, points_change)
  VALUES (p_user_id, p_mode, p_result, p_opponent_elo, points_diff);

  -- Return result with streak info
  RETURN jsonb_build_object(
    'new_elo', new_elo,
    'points_diff', points_diff,
    'streak', new_streak,
    'status', 'updated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
