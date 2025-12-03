-- Create Arena Progress Table
CREATE TABLE IF NOT EXISTS public.arena_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    variant TEXT NOT NULL CHECK (variant IN ('bullet', 'blitz', 'rapid')),
    current_cups INTEGER DEFAULT 0,
    highest_cups INTEGER DEFAULT 0,
    chests_claimed JSONB DEFAULT '[]'::jsonb, -- Array of chest IDs (e.g., "chest_50", "chest_100")
    gatekeepers_defeated JSONB DEFAULT '[]'::jsonb, -- Array of tiers defeated (e.g., 1, 2, 3)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, variant)
);

-- Enable RLS
ALTER TABLE public.arena_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own arena progress"
    ON public.arena_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own arena progress"
    ON public.arena_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own arena progress"
    ON public.arena_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_arena_progress_updated_at
    BEFORE UPDATE ON public.arena_progress
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Initialize default progress for existing users (Optional, can be run manually)
-- INSERT INTO public.arena_progress (user_id, variant)
-- SELECT id, 'bullet' FROM public.profiles
-- ON CONFLICT DO NOTHING;
-- INSERT INTO public.arena_progress (user_id, variant)
-- SELECT id, 'blitz' FROM public.profiles
-- ON CONFLICT DO NOTHING;
-- INSERT INTO public.arena_progress (user_id, variant)
-- SELECT id, 'rapid' FROM public.profiles
-- ON CONFLICT DO NOTHING;
