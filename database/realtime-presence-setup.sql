-- Activar l'extensió de Realtime si no està habilitada
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Taula per gestionar presència d'usuaris
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'in_game')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index per consultes ràpides
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_updated ON public.user_presence(updated_at);

-- RLS Policies
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view user presence" ON public.user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON public.user_presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence" ON public.user_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Funció per actualitzar automàticament updated_at
CREATE OR REPLACE FUNCTION update_user_presence_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.status != 'offline' THEN
        NEW.last_seen = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_presence_update_trigger ON public.user_presence;
CREATE TRIGGER user_presence_update_trigger
    BEFORE UPDATE ON public.user_presence
    FOR EACH ROW EXECUTE FUNCTION update_user_presence_timestamp();

-- Funció per marcar usuaris com offline després de 5 minuts d'inactivitat
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
    UPDATE public.user_presence
    SET status = 'offline'
    WHERE status != 'offline'
    AND updated_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Habilitar Realtime per la taula
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
