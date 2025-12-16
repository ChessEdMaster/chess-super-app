-- Add index to 'title' to make updates fast
CREATE INDEX IF NOT EXISTS idx_academy_exercises_title ON public.academy_exercises(title);
