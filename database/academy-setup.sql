-- ============================================
-- CHESS ACADEMY DATABASE SETUP (FULL SCHEMA V2 - MIGRATION SAFE)
-- Executa aquest SQL al Supabase SQL Editor.
-- Aquest script assegura que totes les columnes necessàries existeixen.
-- ============================================

-- 1. TAULA DE CURSOS
CREATE TABLE IF NOT EXISTS public.academy_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRACIÓ V2: Afegir columnes noves a cursos
ALTER TABLE public.academy_courses 
ADD COLUMN IF NOT EXISTS track TEXT DEFAULT 'academic',
ADD COLUMN IF NOT EXISTS target_grade TEXT,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT,
ADD COLUMN IF NOT EXISTS subject_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;


-- 2. TAULA DE MÒDULS
CREATE TABLE IF NOT EXISTS public.academy_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  level TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRACIÓ V2: Enllaç a cursos
ALTER TABLE public.academy_modules 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.academy_courses(id) ON DELETE SET NULL;


-- 3. TAULA DE LLIÇONS
CREATE TABLE IF NOT EXISTS public.academy_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  "order" INTEGER NOT NULL,
  difficulty INTEGER DEFAULT 1,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRACIÓ V2: Afegir columnes que podrien faltar si la taula ja existia
ALTER TABLE public.academy_lessons
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE;


-- 4. TAULA DE PROGRÉS D'USUARI (LLIÇONS)
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);


-- 5. TAULA D'EXERCICIS TÀCTICS
CREATE TABLE IF NOT EXISTS public.academy_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fen TEXT NOT NULL,
  solution JSONB NOT NULL,
  difficulty TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  rating INTEGER DEFAULT 1200,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. TAULA DE PROGRÉS D'EXERCICIS
CREATE TABLE IF NOT EXISTS public.user_exercise_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.academy_exercises(id) ON DELETE CASCADE NOT NULL,
  solved BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- segons
  hints_used INTEGER DEFAULT 0,
  solved_at TIMESTAMPTZ,
  UNIQUE(user_id, exercise_id)
);


-- 7. TAULA D'ASSOLIMENTS (ACHIEVEMENTS)
CREATE TABLE IF NOT EXISTS public.academy_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 8. TAULA D'ASSOLIMENTS D'USUARI
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.academy_achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);


-- 9. ÍNDEXS PER RENDIMENT
CREATE INDEX IF NOT EXISTS idx_academy_courses_track ON public.academy_courses(track);
CREATE INDEX IF NOT EXISTS idx_academy_courses_grade ON public.academy_courses(target_grade);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.academy_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.academy_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_lesson_progress(user_id);


-- 10. POLÍTIQUES DE SEGURETAT (RLS) - "Fall-safe"
-- Habilitem RLS per si de cas
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Política simple per a Cursos (si no existeix)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'academy_courses' AND policyname = 'Anyone can read courses') THEN
        CREATE POLICY "Anyone can read courses" ON public.academy_courses FOR SELECT USING (true);
    END IF;

    -- Política simple per a Mòduls (si no existeix)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'academy_modules' AND policyname = 'Anyone can read modules') THEN
        CREATE POLICY "Anyone can read modules" ON public.academy_modules FOR SELECT USING (true);
    END IF;

    -- Política simple per a Lliçons (si no existeix)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'academy_lessons' AND policyname = 'Anyone can read lessons') THEN
        CREATE POLICY "Anyone can read lessons" ON public.academy_lessons FOR SELECT USING (true);
    END IF;
END $$;
