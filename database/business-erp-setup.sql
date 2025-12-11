-- ============================================
-- BUSINESS ERP EXTENSION
-- Adds: Parent-Child Clubs (Sub-Clans) & Managed Students
-- ============================================

-- 1. ADD HIERARCHY TO CLUBS
-- Add parent_id to allow clubs to be "owned" or "managed" by another club (the Super Clan)
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL;

-- Add club type if not exists (for stricter typing: 'organization', 'school', 'club', etc.)
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'club';

CREATE INDEX IF NOT EXISTS idx_clubs_parent ON public.clubs(parent_id);

-- 2. CREATE MANAGED STUDENTS TABLE ("Shadow Users")
-- These are students that do NOT have a Supabase Auth account yet.
CREATE TABLE IF NOT EXISTS public.club_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  group_identifier TEXT, -- e.g. "Class 4B"
  notes TEXT,
  
  -- Mock/Local stats for the student in this club context
  elo INTEGER DEFAULT 800,
  puzzle_rating INTEGER DEFAULT 800,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS POLICIES FOR CLUB STUDENTS

ALTER TABLE public.club_students ENABLE ROW LEVEL SECURITY;

-- Policy: Only Club Owners/Admins (and Superadmins) can view students
-- We check if the acting user is an Admin/Owner of the club these students belong to.
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
       -- Or if the user owns the PARENT club (Super Clan access)
       SELECT 1 FROM public.clubs child
       JOIN public.clubs parent ON child.parent_id = parent.id
       WHERE child.id = club_students.club_id
       AND parent.owner_id = auth.uid()
    )
  );

-- 4. RLS UPDATES FOR CLUBS (HIERARCHY VISIBILITY)
-- Ensure Super Clan owner can see child clubs even if not directly a member?
-- The existing policy "Anyone can read public clubs" handles public ones.
-- For private sub-clans, we need to ensure the parent owner can see them.

CREATE POLICY "Parent club owners can view child clubs" ON public.clubs
  FOR SELECT USING (
    parent_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.clubs parent
      WHERE parent.id = clubs.parent_id
      AND parent.owner_id = auth.uid()
    )
  );

CREATE POLICY "Parent club owners can update child clubs" ON public.clubs
  FOR UPDATE USING (
    parent_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.clubs parent
      WHERE parent.id = clubs.parent_id
      AND parent.owner_id = auth.uid()
    )
  );

-- 5. FUNCTION TO NOTIFY/LOG (Optional placeholder)
-- trigger logic not strictly needed yet for MVP
