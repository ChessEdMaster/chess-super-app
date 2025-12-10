-- ============================================
-- FIX: ACADEMY PERMISSIONS & POLICIES
-- ============================================

-- 1. Assegurar que RLS està habilitat
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar polítiques antigues per evitar conflictes
DROP POLICY IF EXISTS "Anyone can read courses" ON public.academy_courses;
DROP POLICY IF EXISTS "Anyone can read modules" ON public.academy_modules;
DROP POLICY IF EXISTS "Anyone can read lessons" ON public.academy_lessons;
DROP POLICY IF EXISTS "Authenticated users can read courses" ON public.academy_courses;
DROP POLICY IF EXISTS "Authenticated users can read modules" ON public.academy_modules;
DROP POLICY IF EXISTS "Authenticated users can read lessons" ON public.academy_lessons;

-- 3. Crear polítiques permissives (LECTURA per a tothom autenticat)
-- Això permet que els usuaris vegin el contingut. La UI filtrarà què mostrem segons la inscripció.
-- Més endavant podem fer-ho més estricte si cal (només enrolled).

CREATE POLICY "Authenticated users can read courses" 
ON public.academy_courses FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can read modules" 
ON public.academy_modules FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can read lessons" 
ON public.academy_lessons FOR SELECT 
TO authenticated 
USING (true);

-- 4. Assegurar accés a academy_enrollments per a la UI de gestió
-- (Aquestes ja haurien d'estar creades per l'altre script, però repassem)
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;

-- Permetre als professors veure totes les inscripcions del seu club
CREATE POLICY "Club staff can view enrollments"
ON public.academy_enrollments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = academy_enrollments.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'teacher')
    )
);

-- Permetre als alumnes veure les seves pròpies inscripcions
CREATE POLICY "Students can view own enrollments"
ON public.academy_enrollments FOR SELECT
TO authenticated
USING (user_id = auth.uid());
