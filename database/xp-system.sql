-- XP System Foundation for ChessClans
-- Implements secure server-side XP management and leveling logic

-- 1. Create a log table for XP history (Audit Trail)
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source TEXT NOT NULL, -- e.g., 'game_win', 'puzzle_solved', 'lesson_complete'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger function to ensure level is always consistent with XP
CREATE OR REPLACE FUNCTION public.sync_level_with_xp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_xp_per_level CONSTANT INTEGER := 1000;
BEGIN
    -- Formula: Level = floor(xp / 1000) + 1
    -- 0-999 XP -> Level 1
    -- 1000-1999 XP -> Level 2
    IF NEW.xp IS DISTINCT FROM OLD.xp THEN
        NEW.level := FLOOR(NEW.xp / v_xp_per_level) + 1;
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS tr_sync_level_with_xp ON public.profiles;

CREATE TRIGGER tr_sync_level_with_xp
BEFORE UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_level_with_xp();

-- 4. Function to add XP securely (callable from client via RPC)
CREATE OR REPLACE FUNCTION public.add_xp(
    p_amount INTEGER,
    p_source TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_old_xp INTEGER;
    v_new_xp INTEGER;
    v_old_level INTEGER;
    v_new_level INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get current stats
    SELECT xp, level INTO v_old_xp, v_old_level
    FROM public.profiles
    WHERE id = v_user_id;

    -- Update profile (Trigger will handle level calculation)
    UPDATE public.profiles
    SET 
        xp = xp + p_amount,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING xp, level INTO v_new_xp, v_new_level;

    -- Log the transaction
    INSERT INTO public.xp_logs (user_id, amount, source, metadata)
    VALUES (v_user_id, p_amount, p_source, p_metadata);

    -- Return result
    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'old_xp', v_old_xp,
        'new_xp', v_new_xp,
        'old_level', v_old_level,
        'new_level', v_new_level,
        'level_up', (v_new_level > v_old_level)
    );
END;
$$;

-- 5. RLS for Log
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP logs"
    ON public.xp_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Logs happen via Security Definer function, so no insert policy needed for public role
