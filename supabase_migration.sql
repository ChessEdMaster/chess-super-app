-- Add public/system flag and type to collections
ALTER TABLE public.pgn_collections 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'user' CHECK (type IN ('user', 'system_endgame', 'system_opening'));

-- Add Policy to allow reading public collections
CREATE POLICY "Public collections are viewable by everyone" 
ON public.pgn_collections FOR SELECT 
USING (is_public = true);

-- Add Policy to allow reading games from public collections
CREATE POLICY "Games in public collections are viewable by everyone" 
ON public.pgn_games FOR SELECT 
USING (
    collection_id IN (
        SELECT id FROM public.pgn_collections WHERE is_public = true
    )
);
