-- Fix infinite recursion in clubs policies by using a SECURITY DEFINER function
-- preventing RLS re-evaluation when checking parent club ownership.

-- 1. Create helper function to get club owner bypassing RLS
CREATE OR REPLACE FUNCTION public.get_club_owner_safe(club_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT owner_id FROM public.clubs WHERE id = club_id;
$$;

-- 2. Drop the recursive policies created in business-erp-setup.sql
DROP POLICY IF EXISTS "Parent club owners can view child clubs" ON public.clubs;
DROP POLICY IF EXISTS "Parent club owners can update child clubs" ON public.clubs;

-- 3. Re-create them using the safe function
CREATE POLICY "Parent club owners can view child clubs" ON public.clubs
  FOR SELECT USING (
    parent_id IS NOT NULL AND
    get_club_owner_safe(parent_id) = auth.uid()
  );

CREATE POLICY "Parent club owners can update child clubs" ON public.clubs
  FOR UPDATE USING (
    parent_id IS NOT NULL AND
    get_club_owner_safe(parent_id) = auth.uid()
  );
