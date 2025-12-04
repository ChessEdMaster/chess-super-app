-- Create table for open challenges
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null for Bots
    is_bot BOOLEAN DEFAULT FALSE,
    bot_difficulty TEXT, -- e.g., 'easy', 'medium', 'hard'
    player_color TEXT NOT NULL, -- 'white', 'black', 'random'
    rated BOOLEAN DEFAULT FALSE,
    time_control_type TEXT NOT NULL, -- 'bullet', 'blitz', 'rapid'
    status TEXT DEFAULT 'open', -- 'open', 'accepted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    -- Visual coordinates for the "Map" (0-100%)
    map_x INTEGER DEFAULT 0,
    map_y INTEGER DEFAULT 0
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;

-- RLS Policies
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can view open challenges
CREATE POLICY "Everyone can view open challenges" 
ON public.challenges FOR SELECT 
USING (status = 'open');

-- Users can create challenges
CREATE POLICY "Users can create challenges" 
ON public.challenges FOR INSERT 
WITH CHECK (auth.uid() = host_id OR is_bot = TRUE);

-- Host can delete their challenge
CREATE POLICY "Host can delete challenge" 
ON public.challenges FOR DELETE 
USING (auth.uid() = host_id);

-- System/Users can update status (accepting)
CREATE POLICY "Users can update challenge status" 
ON public.challenges FOR UPDATE 
USING (true);
