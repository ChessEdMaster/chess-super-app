-- Add bot support columns to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bot_difficulty INTEGER DEFAULT 0, -- 0=Custom, 1=Easy, 2=Medium, 3=Hard, 4=Gatekeeper
ADD COLUMN IF NOT EXISTS gatekeeper_tier INTEGER, -- If it's a gatekeeper game
ADD COLUMN IF NOT EXISTS variant TEXT DEFAULT 'standard'; -- 'standard', 'chest_rush', etc.

-- Update RLS to allow users to play against themselves if one is a bot? 
-- Actually, RLS usually checks auth.uid() against player_ids.
-- If is_bot is true, black_player_id might be null or a special UUID. 
-- Let's assume black_player_id CAN be null if is_bot is true.
-- But current RLS might block updates if I'm not the black player.
-- We must ensure the user (White) can update the game state even if Black is a bot.

CREATE POLICY "Allow users to update their own bot games" ON public.games
FOR UPDATE USING (
  (auth.uid() = white_player_id OR auth.uid() = black_player_id) AND is_bot = TRUE
);
