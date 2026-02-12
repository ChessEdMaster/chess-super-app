-- Add increment column to games table
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS increment INTEGER DEFAULT 0; -- Seconds added per move

-- Comment on column
COMMENT ON COLUMN public.games.increment IS 'Time increment in seconds added after each move';
