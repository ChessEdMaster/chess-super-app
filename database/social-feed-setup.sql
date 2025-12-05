-- ============================================
-- SOCIAL NETWORK FEED EXTENSION
-- ============================================

-- 1. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'gif', 'none')),
    
    -- Linked Content
    game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
    fen TEXT, -- Snapshot of a position
    
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LIKES
CREATE TABLE IF NOT EXISTS public.social_likes (
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- 3. COMMENTS
CREATE TABLE IF NOT EXISTS public.social_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SHARES (Reposts)
CREATE TABLE IF NOT EXISTS public.social_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLAN TYPES UPDATE
-- Adding types to existing clubs table if it exists, or creating it with types
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'type') THEN
        ALTER TABLE public.clubs ADD COLUMN type TEXT DEFAULT 'online' CHECK (type IN ('online', 'club', 'school'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'verified') THEN
        ALTER TABLE public.clubs ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'address') THEN
        ALTER TABLE public.clubs ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'website') THEN
        ALTER TABLE public.clubs ADD COLUMN website TEXT;
    END IF;
END $$;

-- 6. RLS POLICIES

-- Posts
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts are visible to everyone" ON public.social_posts
    FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.social_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.social_posts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.social_posts
    FOR DELETE USING (auth.uid() = user_id);

-- Likes
ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.social_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.social_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.social_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.social_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.social_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.social_comments FOR DELETE USING (auth.uid() = user_id);

-- 7. TRIGGERS FOR COUNTS
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.social_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_social_like_change
AFTER INSERT OR DELETE ON public.social_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.social_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.social_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_social_comment_change
AFTER INSERT OR DELETE ON public.social_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
