-- Migration: Enrich academy_lessons with professional metadata
-- Description: Adds columns to support rich content for both students and monitors.

ALTER TABLE public.academy_lessons
ADD COLUMN IF NOT EXISTS monitor_guide JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS theme_metadata JSONB DEFAULT '{}';

-- Optional: Update existing content structure if needed (for now we keep it flexible with JSONB)
COMMENT ON COLUMN public.academy_lessons.monitor_guide IS 'Pedagogical instructions and dynamic tips for the teacher.';
COMMENT ON COLUMN public.academy_lessons.theme_metadata IS 'Neon/Cyberpunk aesthetic data (metaphors, visual styles, scripts).';
