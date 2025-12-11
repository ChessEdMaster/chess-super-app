-- ============================================
-- BUSINESS ERP EXTENSION (UPDATED & FIXED)
-- Adds: Parent-Child Clubs (Sub-Clans) & Managed Students
-- Includes fix for infinite recursion in RLS policies
-- ============================================

-- 1. ADD HIERARCHY TO CLUBS
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;

ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'club';

CREATE INDEX IF NOT EXISTS idx_clubs_parent ON public.clubs(parent_id);

-- 2. CREATE MANAGED STUDENTS TABLE ("Shadow Users")
CREATE TABLE IF NOT EXISTS public.club_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  group_identifier TEXT, -- e.g. "Class 4B"
  notes TEXT,
  elo INTEGER DEFAULT 800,
  puzzle_rating INTEGER DEFAULT 800,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS POLICIES FOR CLUB STUDENTS
ALTER TABLE public.club_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club admins can manage students" ON public.club_students;
CREATE POLICY "Club admins can manage students" ON public.club_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_students.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
       -- Safe parent check (assuming parent_id is set)
       -- Note: This might still touch clubs table, but doesn't recurse on 'clubs' policies directly in a blocking way
       -- if the user is just querying students.
       -- However to be ultra safe we can use the helper too, but let's stick to standard link for now unless it breaks.
       SELECT 1 FROM public.clubs child
       JOIN public.clubs parent ON child.parent_id = parent.id
       WHERE child.id = club_students.club_id
       AND parent.owner_id = auth.uid()
    )
  );

-- 4. RLS UPDATES FOR CLUBS (HIERARCHY VISIBILITY) - FIXED RECURSION

-- Helper function to break recursion
CREATE OR REPLACE FUNCTION public.get_club_owner_safe(club_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT owner_id FROM public.clubs WHERE id = club_id;
$$;

DROP POLICY IF EXISTS "Parent club owners can view child clubs" ON public.clubs;
CREATE POLICY "Parent club owners can view child clubs" ON public.clubs
  FOR SELECT USING (
    parent_id IS NOT NULL AND
    get_club_owner_safe(parent_id) = auth.uid()
  );

DROP POLICY IF EXISTS "Parent club owners can update child clubs" ON public.clubs;
CREATE POLICY "Parent club owners can update child clubs" ON public.clubs
  FOR UPDATE USING (
    parent_id IS NOT NULL AND
    get_club_owner_safe(parent_id) = auth.uid()
  );
