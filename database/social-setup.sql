-- ============================================
-- SOCIAL EXTENSION (Friends & Privacy)
-- ============================================

-- 1. FRIEND REQUESTS
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id),
    CHECK (sender_id != receiver_id)
);

-- 2. FRIENDS (Bidirectional - two rows per friendship)
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- 3. USER SOCIAL SETTINGS
CREATE TABLE IF NOT EXISTS public.user_social_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends_only', 'private')),
    show_online_status BOOLEAN DEFAULT true,
    allow_friend_requests BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS POLICIES

-- Friend Requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests they sent or received" ON public.friend_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send requests" ON public.friend_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update requests they received" ON public.friend_requests
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friends" ON public.friends
    FOR SELECT USING (auth.uid() = user_id);

-- Settings
ALTER TABLE public.user_social_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public settings of others" ON public.user_social_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own settings" ON public.user_social_settings
    FOR ALL USING (auth.uid() = user_id);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friends_user ON public.friends(user_id);

-- 6. TRIGGER FOR ACCEPTING REQUESTS
CREATE OR REPLACE FUNCTION handle_friend_request_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        INSERT INTO public.friends (user_id, friend_id)
        VALUES (NEW.sender_id, NEW.receiver_id), (NEW.receiver_id, NEW.sender_id)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_friend_request_accepted ON public.friend_requests;
CREATE TRIGGER on_friend_request_accepted
AFTER UPDATE ON public.friend_requests
FOR EACH ROW
EXECUTE FUNCTION handle_friend_request_acceptance();
