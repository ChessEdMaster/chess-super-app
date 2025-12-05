-- Taula per notificacions
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'friend_request', 'message', 'event', 'event_reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    related_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index per consultes ràpides
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- TRIGGERS AUTOMÀTICS

-- Funció per crear notificació de like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    liker_username TEXT;
BEGIN
    SELECT user_id INTO post_owner_id FROM social_posts WHERE id = NEW.post_id;
    IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    SELECT username INTO liker_username FROM profiles WHERE id = NEW.user_id;
    INSERT INTO notifications (user_id, type, title, message, related_id, related_url)
    VALUES (post_owner_id, 'like', 'New Like', liker_username || ' liked your post', NEW.post_id, '/social?tab=feed');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_like_notification ON social_likes;
CREATE TRIGGER on_like_notification AFTER INSERT ON social_likes FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Funció per crear notificació de comentari
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id UUID;
    commenter_username TEXT;
BEGIN
    SELECT user_id INTO post_owner_id FROM social_posts WHERE id = NEW.post_id;
    IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
    SELECT username INTO commenter_username FROM profiles WHERE id = NEW.user_id;
    INSERT INTO notifications (user_id, type, title, message, related_id, related_url)
    VALUES (post_owner_id, 'comment', 'New Comment', commenter_username || ' commented on your post', NEW.post_id, '/social?tab=feed');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_comment_notification ON social_comments;
CREATE TRIGGER on_comment_notification AFTER INSERT ON social_comments FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Funció per crear notificació de missatge
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
DECLARE
    receiver_id UUID;
    sender_username TEXT;
    conv RECORD;
BEGIN
    SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;
    IF conv.participant_1_id = NEW.sender_id THEN receiver_id := conv.participant_2_id; ELSE receiver_id := conv.participant_1_id; END IF;
    SELECT username INTO sender_username FROM profiles WHERE id = NEW.sender_id;
    INSERT INTO notifications (user_id, type, title, message, related_id, related_url)
    VALUES (receiver_id, 'message', 'New Message', sender_username || ': ' || LEFT(NEW.content, 50), NEW.conversation_id, '/messages?userId=' || NEW.sender_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_notification ON direct_messages;
CREATE TRIGGER on_message_notification AFTER INSERT ON direct_messages FOR EACH ROW EXECUTE FUNCTION notify_on_message();
