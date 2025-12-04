-- Kingdom Resources Table
CREATE TABLE IF NOT EXISTS public.kingdom_resources (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    gold INTEGER DEFAULT 0,
    mana INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Kingdom Buildings Table
CREATE TABLE IF NOT EXISTS public.kingdom_buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'academy', 'tower', 'mine', etc.
    level INTEGER DEFAULT 1,
    x INTEGER NOT NULL CHECK (x >= 0 AND x <= 7),
    y INTEGER NOT NULL CHECK (y >= 0 AND y <= 7),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'constructing', 'upgrading')),
    constructed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.kingdom_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kingdom_buildings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Kingdom Resources
CREATE POLICY "Users can view own kingdom resources"
ON public.kingdom_resources FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own kingdom resources"
ON public.kingdom_resources FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kingdom resources"
ON public.kingdom_resources FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Kingdom Buildings
CREATE POLICY "Users can view own kingdom buildings"
ON public.kingdom_buildings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kingdom buildings"
ON public.kingdom_buildings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kingdom buildings"
ON public.kingdom_buildings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kingdom buildings"
ON public.kingdom_buildings FOR DELETE
USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kingdom_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kingdom_buildings;
