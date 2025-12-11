-- ============================================
-- ACADEMY SA EXPANSION (SITUACIONS D'APRENENTATGE)
-- Migració per adaptar els Mòduls al model LOMLOE
-- ============================================

-- 1. Ampliar academy_modules amb els camps de la "Plantilla Mestra"
ALTER TABLE public.academy_modules
ADD COLUMN IF NOT EXISTS duration TEXT, -- "Temporització" (ex: "3 sessions")
ADD COLUMN IF NOT EXISTS context_description TEXT, -- "Context" (Narrativa)
ADD COLUMN IF NOT EXISTS challenge_description TEXT, -- "El Repte (Ret)"
ADD COLUMN IF NOT EXISTS final_product TEXT, -- "Producte Final"
ADD COLUMN IF NOT EXISTS transversal_vectors TEXT[], -- "Vectors Transversals"
ADD COLUMN IF NOT EXISTS competencies JSONB DEFAULT '{}', -- "Competències Específiques"
ADD COLUMN IF NOT EXISTS knowledge_topics TEXT[], -- "Sabers"
ADD COLUMN IF NOT EXISTS learning_objective TEXT, -- "Objectiu d'Aprenentatge"
ADD COLUMN IF NOT EXISTS dua_guidelines JSONB DEFAULT '{}', -- "Mesures DUA"
ADD COLUMN IF NOT EXISTS evaluation_criteria JSONB DEFAULT '{}'; -- "Rúbriques i criteris"

COMMENT ON COLUMN public.academy_modules.duration IS 'Estimació de temps (ex: 3 sessions)';
COMMENT ON COLUMN public.academy_modules.context_description IS 'Descripció de l''escenari real (La Crida)';
COMMENT ON COLUMN public.academy_modules.challenge_description IS 'La pregunta clau que guia l''aprenentatge (El Repte)';

-- 2. Ampliar academy_lessons per identificar la Fase de la SA
-- Valors: 'motivation' (Inici/Exploració), 'application' (Nus/Creació), 'communication' (Desenllaç/Tancament)
ALTER TABLE public.academy_lessons
ADD COLUMN IF NOT EXISTS phase_type TEXT;

-- Afegir check constraint per assegurar consistència
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_lesson_phase_type') THEN
        ALTER TABLE public.academy_lessons
        ADD CONSTRAINT check_lesson_phase_type 
        CHECK (phase_type IN ('motivation', 'application', 'communication'));
    END IF;
END $$;
