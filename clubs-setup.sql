-- ============================================
-- CHESS CLUBS DATABASE SETUP
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. TAULA DE CLUBS
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  banner_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TAULA DE MEMBRES DE CLUBS
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- 3. TAULA DE POSTS AL CLUB
CREATE TABLE IF NOT EXISTS public.club_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  pgn_data TEXT, -- PGN de partida compartida (opcional)
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TAULA DE COMENTARIS EN POSTS
CREATE TABLE IF NOT EXISTS public.club_post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.club_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TAULA DE LIKES EN POSTS
CREATE TABLE IF NOT EXISTS public.club_post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.club_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 6. TAULA D'EVENTS/TORNEIGS DEL CLUB
CREATE TABLE IF NOT EXISTS public.club_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('tournament', 'meeting', 'training', 'other')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  max_participants INTEGER,
  participants_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TAULA DE PARTICIPANTS EN EVENTS
CREATE TABLE IF NOT EXISTS public.club_event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.club_events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 8. ÍNDEXS PER MILLORAR RENDIMENT
CREATE INDEX IF NOT EXISTS idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_clubs_slug ON public.clubs(slug);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_club ON public.club_posts(club_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_author ON public.club_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_club_post_comments_post ON public.club_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_club_post_likes_post ON public.club_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_club_events_club ON public.club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_start_date ON public.club_events(start_date);

-- 9. FUNCIÓ PER ACTUALITZAR MEMBER_COUNT
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clubs SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.club_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_club_member_count ON public.club_members;
CREATE TRIGGER trigger_update_club_member_count
  AFTER INSERT OR DELETE ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- 10. FUNCIÓ PER ACTUALITZAR LIKES_COUNT
CREATE OR REPLACE FUNCTION update_club_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.club_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.club_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_club_post_likes_count ON public.club_post_likes;
CREATE TRIGGER trigger_update_club_post_likes_count
  AFTER INSERT OR DELETE ON public.club_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_club_post_likes_count();

-- 11. FUNCIÓ PER ACTUALITZAR COMMENTS_COUNT
CREATE OR REPLACE FUNCTION update_club_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.club_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.club_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_club_post_comments_count ON public.club_post_comments;
CREATE TRIGGER trigger_update_club_post_comments_count
  AFTER INSERT OR DELETE ON public.club_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_club_post_comments_count();

-- 12. POLÍTIQUES DE SEGURETAT (ROW LEVEL SECURITY)

-- Clubs: Tothom pot llegir clubs públics, només membres poden veure privats
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read public clubs" ON public.clubs;
CREATE POLICY "Anyone can read public clubs" ON public.clubs 
  FOR SELECT USING (is_public = true OR owner_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = clubs.id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can create clubs" ON public.clubs;
CREATE POLICY "Authenticated users can create clubs" ON public.clubs 
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners can update their clubs" ON public.clubs;
CREATE POLICY "Owners can update their clubs" ON public.clubs 
  FOR UPDATE USING (auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = clubs.id AND user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Membres: Només membres poden veure la llista de membres
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- CRÍTICO: Evitar recursión infinita - usar verificación directa del club
DROP POLICY IF EXISTS "Members can read club members" ON public.club_members;
CREATE POLICY "Members can read club members" ON public.club_members 
  FOR SELECT USING (
    -- El propietario del club puede ver todos los miembros
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND owner_id = auth.uid())
    OR
    -- O el usuario es miembro del club (verificación directa sin recursión)
    user_id = auth.uid()
    OR
    -- O el club es público y el usuario está autenticado
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND is_public = true AND auth.uid() IS NOT NULL)
  );

-- Permitir que el propietario se añada automáticamente al crear el club
DROP POLICY IF EXISTS "Owners can add themselves" ON public.club_members;
CREATE POLICY "Owners can add themselves" ON public.club_members 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid())
  );

-- Permitir que usuarios se unan a clubs públicos
DROP POLICY IF EXISTS "Users can join public clubs" ON public.club_members;
CREATE POLICY "Users can join public clubs" ON public.club_members 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND is_public = true)
  );

-- Permitir que el propietario añada otros miembros directamente
DROP POLICY IF EXISTS "Owners can add members" ON public.club_members;
CREATE POLICY "Owners can add members" ON public.club_members 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can leave clubs" ON public.club_members;
CREATE POLICY "Users can leave clubs" ON public.club_members 
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.club_members;
-- CRÍTICO: Solo permitir al propietario actualizar miembros para evitar recursión
-- Los admins pueden gestionar miembros a través de funciones de seguridad si es necesario
CREATE POLICY "Owners and admins can manage members" ON public.club_members 
  FOR UPDATE USING (
    -- Solo el propietario del club puede gestionar miembros
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND owner_id = auth.uid())
  );

-- Posts: Només membres del club poden veure i crear posts
ALTER TABLE public.club_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Club members can read posts" ON public.club_posts;
CREATE POLICY "Club members can read posts" ON public.club_posts 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_posts.club_id AND user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Club members can create posts" ON public.club_posts;
CREATE POLICY "Club members can create posts" ON public.club_posts 
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_posts.club_id AND user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Authors and moderators can update posts" ON public.club_posts;
CREATE POLICY "Authors and moderators can update posts" ON public.club_posts 
  FOR UPDATE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.club_members cm 
      WHERE cm.club_id = club_posts.club_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin', 'moderator'))
  );
DROP POLICY IF EXISTS "Authors and moderators can delete posts" ON public.club_posts;
CREATE POLICY "Authors and moderators can delete posts" ON public.club_posts 
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.club_members cm 
      WHERE cm.club_id = club_posts.club_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin', 'moderator'))
  );

-- Comentaris: Només membres del club poden veure i crear comentaris
ALTER TABLE public.club_post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Club members can read comments" ON public.club_post_comments;
CREATE POLICY "Club members can read comments" ON public.club_post_comments 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_posts cp
      JOIN public.club_members cm ON cm.club_id = cp.club_id
      WHERE cp.id = club_post_comments.post_id AND cm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Club members can create comments" ON public.club_post_comments;
CREATE POLICY "Club members can create comments" ON public.club_post_comments 
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.club_posts cp
      JOIN public.club_members cm ON cm.club_id = cp.club_id
      WHERE cp.id = club_post_comments.post_id AND cm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Authors can update their comments" ON public.club_post_comments;
CREATE POLICY "Authors can update their comments" ON public.club_post_comments 
  FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors and moderators can delete comments" ON public.club_post_comments;
CREATE POLICY "Authors and moderators can delete comments" ON public.club_post_comments 
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.club_posts cp
      JOIN public.club_members cm ON cm.club_id = cp.club_id
      WHERE cp.id = club_post_comments.post_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin', 'moderator'))
  );

-- Likes: Només membres del club poden donar like
ALTER TABLE public.club_post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Club members can read likes" ON public.club_post_likes;
CREATE POLICY "Club members can read likes" ON public.club_post_likes 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_posts cp
      JOIN public.club_members cm ON cm.club_id = cp.club_id
      WHERE cp.id = club_post_likes.post_id AND cm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Club members can like posts" ON public.club_post_likes;
CREATE POLICY "Club members can like posts" ON public.club_post_likes 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.club_posts cp
      JOIN public.club_members cm ON cm.club_id = cp.club_id
      WHERE cp.id = club_post_likes.post_id AND cm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users can unlike posts" ON public.club_post_likes;
CREATE POLICY "Users can unlike posts" ON public.club_post_likes 
  FOR DELETE USING (auth.uid() = user_id);

-- Events: Només membres del club poden veure i crear events
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Club members can read events" ON public.club_events;
CREATE POLICY "Club members can read events" ON public.club_events 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_events.club_id AND user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Club members can create events" ON public.club_events;
CREATE POLICY "Club members can create events" ON public.club_events 
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_events.club_id AND user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Organizers and moderators can update events" ON public.club_events;
CREATE POLICY "Organizers and moderators can update events" ON public.club_events 
  FOR UPDATE USING (
    auth.uid() = organizer_id OR
    EXISTS (SELECT 1 FROM public.club_members cm 
      WHERE cm.club_id = club_events.club_id 
      AND cm.user_id = auth.uid() 
      AND cm.role IN ('owner', 'admin', 'moderator'))
  );

-- Participants en events: Només membres del club poden participar
ALTER TABLE public.club_event_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Club members can read participants" ON public.club_event_participants;
CREATE POLICY "Club members can read participants" ON public.club_event_participants 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_events ce
      JOIN public.club_members cm ON cm.club_id = ce.club_id
      WHERE ce.id = club_event_participants.event_id AND cm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Club members can join events" ON public.club_event_participants;
CREATE POLICY "Club members can join events" ON public.club_event_participants 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.club_events ce
      JOIN public.club_members cm ON cm.club_id = ce.club_id
      WHERE ce.id = club_event_participants.event_id AND cm.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Users can leave events" ON public.club_event_participants;
CREATE POLICY "Users can leave events" ON public.club_event_participants 
  FOR DELETE USING (auth.uid() = user_id);

-- 13. HABILITAR REALTIME (opcional, per actualitzacions en temps real)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.club_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.club_post_comments;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.club_post_likes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.club_events;

