-- ============================================
-- ARENA OFFICIAL ELO SYSTEM (Phase 2.10)
-- ============================================

-- Add rating system columns to arena_progress
-- These use Glicko-2 defaults (Rating: 1500, RD: 350, Vol: 0.06)
-- Note: Starting rating is 1500, but it only displays/counts after 1000 cups.

ALTER TABLE public.arena_progress 
ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 1500,
ADD COLUMN IF NOT EXISTS rating_deviation DECIMAL DEFAULT 350,
ADD COLUMN IF NOT EXISTS volatility DECIMAL DEFAULT 0.06,
ADD COLUMN IF NOT EXISTS elo_unlocked BOOLEAN DEFAULT false;

-- Add a column to track last rating change
ALTER TABLE public.arena_progress
ADD COLUMN IF NOT EXISTS last_rating_change DECIMAL DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN public.arena_progress.rating IS 'Current skill rating (Glicko-2)';
COMMENT ON COLUMN public.arena_progress.elo_unlocked IS 'Whether the user has reached 1000 cups to play in human leagues';
