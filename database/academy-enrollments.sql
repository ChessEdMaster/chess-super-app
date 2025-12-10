-- ============================================
-- ACADEMY ENROLLMENTS (CLUBS INTEGRATION)
-- ============================================

-- 1. TAULA D'INSCRIPCIONS (Enrollments)
-- Vincula un alumne a un curs específic.
CREATE TABLE IF NOT EXISTS public.academy_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.academy_courses(id) ON DELETE CASCADE NOT NULL,
    club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL, -- Opcional: Si l'ha assignat una escola/club
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- El professor/admin que ho ha fet
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, course_id) -- Un alumne només pot estar inscrit una vegada al mateix curs
);

-- 2. ÍNDEXS
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.academy_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.academy_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_club ON public.academy_enrollments(club_id);

-- 3. POLÍTIQUES DE SEGURETAT (RLS)
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;

-- Els usuaris poden veure les seves pròpies inscripcions
CREATE POLICY "Users can read own enrollments" ON public.academy_enrollments 
  FOR SELECT USING (auth.uid() = user_id);

-- Els professors/admins poden veure les inscripcions del seu club
CREATE POLICY "Club admins can read enrollments" ON public.academy_enrollments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.club_members 
      WHERE club_members.club_id = academy_enrollments.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin', 'teacher')
    )
  );

-- Els professors/admins poden crear inscripcions (ASSIGNAR CURSOS)
CREATE POLICY "Club admins can assign courses" ON public.academy_enrollments 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members 
      WHERE club_members.club_id = club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin', 'teacher')
    )
  );

-- Els professors/admins poden esborrar inscripcions
CREATE POLICY "Club admins can unassign courses" ON public.academy_enrollments 
  FOR DELETE USING (
     EXISTS (
      SELECT 1 FROM public.club_members 
      WHERE club_members.club_id = academy_enrollments.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin', 'teacher')
    )
  );
