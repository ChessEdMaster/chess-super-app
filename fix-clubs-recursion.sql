-- ============================================
-- FIX: INFINITE RECURSION IN CLUBS RLS
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Funció SECURITY DEFINER per comprovar membresia
-- Aquesta funció s'executa amb permisos de superusuari (postgres),
-- saltant-se les polítiques RLS de la taula 'club_members'.
CREATE OR REPLACE FUNCTION public.fn_is_club_member(p_club_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members 
    WHERE club_id = p_club_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Funció SECURITY DEFINER per comprovar si un club és públic
-- Evita que consultar 'clubs' des de 'club_members' dispari RLS recursivament.
CREATE OR REPLACE FUNCTION public.fn_is_club_public(p_club_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_public BOOLEAN;
BEGIN
  SELECT is_public INTO v_is_public FROM public.clubs WHERE id = p_club_id;
  RETURN COALESCE(v_is_public, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Funció SECURITY DEFINER per comprovar propietari del club
CREATE OR REPLACE FUNCTION public.fn_is_club_owner(p_club_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.clubs 
    WHERE id = p_club_id AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ACTUALITZAR POLÍTIQUES DE 'CLUBS'
DROP POLICY IF EXISTS "Anyone can read public clubs" ON public.clubs;
CREATE POLICY "Anyone can read public clubs" ON public.clubs 
  FOR SELECT USING (
    is_public = true 
    OR owner_id = auth.uid() 
    OR public.fn_is_club_member(id, auth.uid()) -- Usa la funció segura
  );

-- 5. ACTUALITZAR POLÍTIQUES DE 'CLUB_MEMBERS'
DROP POLICY IF EXISTS "Members can read club members" ON public.club_members;
CREATE POLICY "Members can read club members" ON public.club_members 
  FOR SELECT USING (
    -- Usa les funcions segures per evitar consultar 'clubs' directament amb RLS
    public.fn_is_club_owner(club_id, auth.uid())
    OR
    user_id = auth.uid()
    OR
    (public.fn_is_club_public(club_id) AND auth.uid() IS NOT NULL)
  );

-- 6. ACTUALITZAR POLÍTIQUES D'ALTRES TAULES (Opcional però recomanat per consistència)
-- Posts
DROP POLICY IF EXISTS "Club members can read posts" ON public.club_posts;
CREATE POLICY "Club members can read posts" ON public.club_posts 
  FOR SELECT USING (
    public.fn_is_club_member(club_id, auth.uid())
  );

-- Events
DROP POLICY IF EXISTS "Club members can read events" ON public.club_events;
CREATE POLICY "Club members can read events" ON public.club_events 
  FOR SELECT USING (
    public.fn_is_club_member(club_id, auth.uid())
  );
