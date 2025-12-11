-- ============================================
-- SELF-EVALUATION SETUP (AUTOAVALUACIÓ)
-- ============================================

-- 1. Create table to track User Progress per Module (SA)
-- This table will store the overall status of the SA for the user, including the Self-Evaluation Rubric.

CREATE TABLE IF NOT EXISTS public.user_module_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE NOT NULL,
    
    -- Status tracking
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN DEFAULT FALSE,
    
    -- Self-Evaluation Data (JSONB)
    -- Structure: { "expert": true, "avancat": false, ... } or { "level": "expert", "notes": "..." }
    -- We will settle on: { "selected_level": "expert" | "avancat" | ..., "justification": "..." }
    self_evaluation JSONB DEFAULT '{}',
    
    -- Teacher Feedback (Optional future proofing)
    teacher_feedback JSONB DEFAULT '{}',

    UNIQUE(user_id, module_id)
);

-- 2. Add RLS Policies
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_module_progress' AND policyname = 'Users can manage own module progress') THEN
        CREATE POLICY "Users can manage own module progress" 
        ON public.user_module_progress 
        FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;
