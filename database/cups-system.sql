-- ============================================
-- ARENA CUPS & GATEKEEPERS SYSTEM (Phase 2.1)
-- ============================================

-- 1. ARENA DIVISIONS (Wood, Bronze, Silver, Gold, etc.)
-- Defines the major leagues users can climb through.
CREATE TABLE IF NOT EXISTS public.arena_divisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL, -- e.g., 'wood', 'bronze', 'silver'
    name TEXT NOT NULL, -- e.g., 'Fusta', 'Bronze', 'Plata'
    icon_url TEXT, -- URL for the division icon
    min_cups INTEGER NOT NULL, -- Minimum cups required to be in this division context
    max_cups INTEGER NOT NULL, -- Maximum cups before gatekeeper
    gatekeeper_id UUID, -- Reference to a bot user (optional, can be linked later)
    gatekeeper_name TEXT, -- Fallback name if no bot user
    gatekeeper_elo INTEGER DEFAULT 600,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ARENA GATEKEEPER ATTEMPTS
-- Tracks user attempts to beat the boss and advance to the next division.
CREATE TABLE IF NOT EXISTS public.arena_gatekeeper_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    division_id UUID REFERENCES public.arena_divisions(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'won', 'lost', 'draw')),
    pgn TEXT, -- Game PGN
    played_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENHANCE ARENA PROGRESS
-- Add columns to link progress to the dynamic division system
ALTER TABLE public.arena_progress 
ADD COLUMN IF NOT EXISTS current_division_id UUID REFERENCES public.arena_divisions(id),
ADD COLUMN IF NOT EXISTS is_gatekeeper_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weekly_cups_gained INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_games_played INTEGER DEFAULT 0;

-- 4. RLS POLICIES

-- Divisions: Readable by all, manageable by admins
ALTER TABLE public.arena_divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read divisions" ON public.arena_divisions FOR SELECT USING (true);
CREATE POLICY "Admins manage divisions" ON public.arena_divisions USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.app_roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.name IN ('SuperAdmin', 'Governor')
    )
);

-- Gatekeeper Attempts: Users read/write own, admins read all
ALTER TABLE public.arena_gatekeeper_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users history" ON public.arena_gatekeeper_attempts 
    USING (auth.uid() = user_id);
CREATE POLICY "Admins view all attempts" ON public.arena_gatekeeper_attempts 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.app_roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.name IN ('SuperAdmin', 'Governor')
        )
    );

-- 5. INITIAL SEED DATA (Based on GDD/Types)
INSERT INTO public.arena_divisions (slug, name, min_cups, max_cups, gatekeeper_name, gatekeeper_elo)
VALUES
    ('novice', 'Novice Grounds', 0, 250, 'Gatekeeper Pawn', 400),
    ('knight', 'Knight''s Outpost', 251, 500, 'Gatekeeper Knight', 800),
    ('bishop', 'Bishop''s Sanctum', 501, 750, 'Gatekeeper Bishop', 1200),
    ('royal', 'Royal Court', 751, 1000, 'Gatekeeper Queen', 1600)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    min_cups = EXCLUDED.min_cups,
    max_cups = EXCLUDED.max_cups;
