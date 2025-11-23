-- ============================================
-- CHESS ACADEMY DATABASE SETUP
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. TAULA DE MÒDULS
CREATE TABLE IF NOT EXISTS public.academy_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- nom de l'icona de lucide-react
  level TEXT NOT NULL CHECK (level IN ('Principiant', 'Intermedi', 'Avançat', 'Tots')),
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TAULA DE LLIÇONS
CREATE TABLE IF NOT EXISTS public.academy_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL, -- { steps: [{ fen, instruction, correctMoves, explanation }] }
  "order" INTEGER NOT NULL,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TAULA DE PROGRÉS D'USUARI (LLIÇONS)
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0, -- percentatge de passos correctes
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- 4. TAULA D'EXERCICIS TÀCTICS
CREATE TABLE IF NOT EXISTS public.academy_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fen TEXT NOT NULL,
  solution JSONB NOT NULL, -- array de moviments UCI: ["e2e4", "e7e5"]
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[] DEFAULT '{}', -- ['fork', 'pin', 'skewer']
  rating INTEGER DEFAULT 1200,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TAULA DE PROGRÉS D'EXERCICIS
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

-- 6. TAULA D'ASSOLIMENTS (ACHIEVEMENTS)
CREATE TABLE IF NOT EXISTS public.academy_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement JSONB NOT NULL, -- { type: 'lessons_completed', count: 5 }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TAULA D'ASSOLIMENTS D'USUARI
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.academy_achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 8. ÍNDEXS PER MILLORAR RENDIMENT
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.academy_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lesson ON public.user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.academy_exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_exercise_user ON public.user_exercise_progress(user_id);

-- 9. POLÍTIQUES DE SEGURETAT (ROW LEVEL SECURITY)

-- Mòduls: Tothom pot llegir
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read modules" ON public.academy_modules FOR SELECT USING (true);

-- Lliçons: Tothom pot llegir
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read lessons" ON public.academy_lessons FOR SELECT USING (true);

-- Progrés de lliçons: Només el propi usuari
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own progress" ON public.user_lesson_progress 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_lesson_progress 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_lesson_progress 
  FOR UPDATE USING (auth.uid() = user_id);

-- Exercicis: Tothom pot llegir
ALTER TABLE public.academy_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exercises" ON public.academy_exercises FOR SELECT USING (true);

-- Progrés d'exercicis: Només el propi usuari
ALTER TABLE public.user_exercise_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own exercise progress" ON public.user_exercise_progress 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise progress" ON public.user_exercise_progress 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise progress" ON public.user_exercise_progress 
  FOR UPDATE USING (auth.uid() = user_id);

-- Assoliments: Tothom pot llegir
ALTER TABLE public.academy_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read achievements" ON public.academy_achievements FOR SELECT USING (true);

-- Assoliments d'usuari: Només el propi usuari
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own achievements" ON public.user_achievements 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. HABILITAR REALTIME (opcional, per actualitzacions en temps real)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_lesson_progress;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_exercise_progress;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
