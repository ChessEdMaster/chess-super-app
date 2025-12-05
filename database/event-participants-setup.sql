-- Taula per gestionar participants d'events
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.club_events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Index per consultes ràpides
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON public.event_participants(user_id);

-- RLS Policies
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view event participants" ON public.event_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can register to events" ON public.event_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON public.event_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Trigger per actualitzar participants_count a club_events
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'registered' THEN
        UPDATE public.club_events 
        SET participants_count = participants_count + 1 
        WHERE id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'registered' AND NEW.status != 'registered' THEN
            UPDATE public.club_events 
            SET participants_count = GREATEST(0, participants_count - 1) 
            WHERE id = OLD.event_id;
        ELSIF OLD.status != 'registered' AND NEW.status = 'registered' THEN
            UPDATE public.club_events 
            SET participants_count = participants_count + 1 
            WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'registered' THEN
        UPDATE public.club_events 
        SET participants_count = GREATEST(0, participants_count - 1) 
        WHERE id = OLD.event_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_participants_count_trigger ON public.event_participants;
CREATE TRIGGER event_participants_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.event_participants
    FOR EACH ROW EXECUTE FUNCTION update_event_participants_count();
