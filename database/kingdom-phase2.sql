-- Phase 2: The Living Economy & Phase 3: Customization

-- 1. Building Definitions (Static Data)
CREATE TABLE IF NOT EXISTS public.building_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('economy', 'defense', 'decorative')),
    name TEXT NOT NULL,
    description TEXT,
    base_cost JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "gold": 100 }
    production_rate INTEGER DEFAULT 0, -- Base production per hour
    max_level INTEGER DEFAULT 3,
    dimensions JSONB NOT NULL DEFAULT '{"w": 1, "h": 1}'::jsonb,
    asset_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Enhance User Buildings Table
-- Ensure we have the necessary columns on the existing table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kingdom_buildings' AND column_name = 'building_def_id') THEN
        ALTER TABLE public.kingdom_buildings ADD COLUMN building_def_id UUID REFERENCES public.building_definitions(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kingdom_buildings' AND column_name = 'last_collected_at') THEN
        ALTER TABLE public.kingdom_buildings ADD COLUMN last_collected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kingdom_buildings' AND column_name = 'construction_finish_at') THEN
        ALTER TABLE public.kingdom_buildings ADD COLUMN construction_finish_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Kingdom Profiles (for Skins & Customization)
CREATE TABLE IF NOT EXISTS public.kingdom_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    active_terrain_skin TEXT DEFAULT 'grass',
    unlocked_skins TEXT[] DEFAULT ARRAY['grass'],
    defense_scenario_id TEXT, -- For Phase 4: Async Warfare
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. Phase 4: Async Warfare - Raids
-- Extend match_requests or create a specific table for raids. 
-- Let's create a specific table for clarity and to avoid messing with live multiplayer logic yet.
CREATE TABLE IF NOT EXISTS public.kingdom_raids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attacker_id UUID REFERENCES auth.users(id) NOT NULL,
    defender_id UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired')),
    wager_amount INTEGER DEFAULT 0,
    wager_currency TEXT DEFAULT 'gold',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies

-- Building Definitions (Public Read)
ALTER TABLE public.building_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read building definitions" ON public.building_definitions;
CREATE POLICY "Public read building definitions" ON public.building_definitions FOR SELECT USING (true);

-- Kingdom Profiles
ALTER TABLE public.kingdom_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own kingdom profile" ON public.kingdom_profiles;
CREATE POLICY "Users can view own kingdom profile" ON public.kingdom_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own kingdom profile" ON public.kingdom_profiles;
CREATE POLICY "Users can update own kingdom profile" ON public.kingdom_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own kingdom profile" ON public.kingdom_profiles;
CREATE POLICY "Users can insert own kingdom profile" ON public.kingdom_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Kingdom Raids
ALTER TABLE public.kingdom_raids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view relevant raids" ON public.kingdom_raids;
CREATE POLICY "Users can view relevant raids" ON public.kingdom_raids FOR SELECT USING (auth.uid() = attacker_id OR auth.uid() = defender_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kingdom_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kingdom_raids;

-- Seed Data
INSERT INTO public.building_definitions (type, name, description, base_cost, production_rate, dimensions, asset_path)
VALUES 
('economy', 'Gold Mine', 'Extracts gold from the earth.', '{"gold": 100}', 50, '{"w": 1, "h": 1}', 'buildings/economy/gold_mine_lv1.png'),
('economy', 'Mana Nexus', 'Channels arcane energy.', '{"gold": 200}', 30, '{"w": 1, "h": 1}', 'buildings/economy/mana_nexus_lv1.png'),
('defense', 'Rook Tower', 'A fortified tower for defense.', '{"gold": 500, "mana": 100}', 0, '{"w": 1, "h": 2}', 'buildings/defense/rook_tower_lv1.png')
ON CONFLICT DO NOTHING;
