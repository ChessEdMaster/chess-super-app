-- ============================================
-- LEARNING DIARY SETUP (REFLEXIÓ METACOGNITIVA)
-- ============================================

-- 1. Ampliar user_lesson_progress per la reflexió
-- Afegim una columna JSONB per guardar la reflexió de l'alumne quan acaba la lliçó
ALTER TABLE public.user_lesson_progress
ADD COLUMN IF NOT EXISTS reflection JSONB DEFAULT '{}';

-- Estructura esperada del JSONB 'reflection':
-- {
--     "text": "Avui he après que...",
--     "mood": "happy" | "neutral" | "confused",
--     "difficulties": "M'ha costat entendre...",
--     "created_at": "timestamp"
-- }

-- 2. Afegir taula separada si volem un històric de reflexions (Opcional, de moment usem la columna)
-- Per mantenir-ho simple i vinculat al progrés de la lliçó, la columna és suficient.
-- Però si volem permetre múltiples entrades per lliçó, caldria una taula.
-- De moment, assumim UNA reflexió final per lliçó (Fase).

COMMENT ON COLUMN public.user_lesson_progress.reflection IS 'Reflexió metacognitiva de l''alumne (Diari d''Aprenentatge)';
