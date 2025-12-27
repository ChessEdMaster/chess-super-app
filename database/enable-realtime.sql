-- ============================================
-- ENABLE REALTIME REPLICATION
-- ============================================

-- 1. Check if the publication exists and add tables to it
-- This is necessary for 'postgres_changes' to work.
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.games, public.messages;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN 
    -- If already added, ignore
    NULL;
END $$;

-- 2. Performance: Set Replica Identity for faster updates
-- This ensures the full row is sent in 'old' payload if needed, and improves performance.
ALTER TABLE public.games REPLICA IDENTITY FULL;
