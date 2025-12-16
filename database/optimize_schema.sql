-- Optimizations applied based on analysis

-- 1. GIN Index for Academy Exercises Tags (Critical for mining/filtering)
CREATE INDEX IF NOT EXISTS idx_academy_exercises_tags ON public.academy_exercises USING GIN (tags);

-- 2. Index for Club Students table (Foreign Key)
CREATE INDEX IF NOT EXISTS idx_club_students_club ON public.club_students(club_id);

-- 3. Additional Indexes for performance (based on common query patterns)
-- Games filtered by status (Lobby and Matchmaking often query 'open' or 'pending')
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);

-- Notificacions per usuari i llegides (Unread count queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;

-- 4. Monitor Realtime Performance (Comment only)
-- Ensure client code filters channels specific to IDs to avoid broadcasting entire tables.
