-- Online Tournaments (Phase 2.7)
-- Continuous Arena Pairing and Player Standings

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    variant TEXT NOT NULL CHECK (variant IN ('bullet', 'blitz', 'rapid')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournament_players (
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    performance INT DEFAULT 0,
    rank INT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'banned')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (tournament_id, user_id)
);

-- Realtime Pairing Information (Waiting Room)
CREATE TABLE IF NOT EXISTS public.tournament_queue (
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT now(),
    rating INT, -- Snapshot of player rating at join time
    PRIMARY KEY (tournament_id, user_id)
);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_players;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_queue;

-- RLS: Public reading for tournaments, authenticated for joining
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of active tournaments" 
ON public.tournaments FOR SELECT USING (true);

CREATE POLICY "Allow authenticated join/status update" 
ON public.tournament_players FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated queue access" 
ON public.tournament_queue FOR ALL USING (auth.uid() = user_id);
