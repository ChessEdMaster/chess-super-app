-- Migration: Shadow Student Progress Support
-- Enable tracking progress for managed students without auth accounts

BEGIN;

-- 1. Modify user_lesson_progress to support student_id
ALTER TABLE public.user_lesson_progress 
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.club_students(id) ON DELETE CASCADE;

-- 2. Relax user_id constraint to allow NULL if student_id is set
ALTER TABLE public.user_lesson_progress 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Update unique constraint to handle either user_id OR student_id
-- We need to drop the old unique constraint if it exists. 
-- Assuming the name is user_lesson_progress_user_id_lesson_id_key or similar
ALTER TABLE public.user_lesson_progress 
DROP CONSTRAINT IF EXISTS user_lesson_progress_user_id_lesson_id_key;

-- Create new conditional unique constraints (Postgres doesn't support OR in UNIQUE directly easily with NULLs)
-- We use a partial index instead for the uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_lesson ON public.user_lesson_progress (user_id, lesson_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_student_lesson ON public.user_lesson_progress (student_id, lesson_id) WHERE student_id IS NOT NULL;

-- 4. Similar logic for exercises if they exist
-- (Checking if user_exercise_progress exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_exercise_progress') THEN
        ALTER TABLE public.user_exercise_progress 
        ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.club_students(id) ON DELETE CASCADE;
        
        ALTER TABLE public.user_exercise_progress 
        ALTER COLUMN user_id DROP NOT NULL;
        
        DROP CONSTRAINT IF EXISTS user_exercise_progress_user_id_exercise_id_key;
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_exercise ON public.user_exercise_progress (user_id, exercise_id) WHERE user_id IS NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_student_exercise ON public.user_exercise_progress (student_id, exercise_id) WHERE student_id IS NOT NULL;
    END IF;
END $$;

-- 5. RLS Policies for Shadow Students
-- A Mentor/Governor should be able to see/manage progress for their students
CREATE POLICY "Mentors can manage student progress" ON public.user_lesson_progress
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.club_students s
            JOIN public.clubs c ON s.club_id = c.id
            WHERE s.id = public.user_lesson_progress.student_id
            AND (c.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.club_members cm 
                WHERE cm.club_id = c.id AND cm.user_id = auth.uid() AND cm.role IN ('Mentor', 'Governor')
            ))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.club_students s
            JOIN public.clubs c ON s.club_id = c.id
            WHERE s.id = student_id
            AND (c.owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.club_members cm 
                WHERE cm.club_id = c.id AND cm.user_id = auth.uid() AND cm.role IN ('Mentor', 'Governor')
            ))
        )
    );

COMMIT;
