-- ============================================
-- FIX: Recursión infinita en políticas RLS de club_members
-- Executa aquest SQL al Supabase SQL Editor per corregir el problema
-- ============================================

-- 1. Eliminar todas las políticas problemáticas de club_members
DROP POLICY IF EXISTS "Members can read club members" ON public.club_members;
DROP POLICY IF EXISTS "Users can join public clubs" ON public.club_members;
DROP POLICY IF EXISTS "Owners can add members" ON public.club_members;
DROP POLICY IF EXISTS "Owners can add themselves" ON public.club_members;
DROP POLICY IF EXISTS "Users can leave clubs" ON public.club_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON public.club_members;

-- 2. Crear políticas corregidas que evitan recursión infinita

-- Política de lectura: Evitar recursión verificando directamente el club
CREATE POLICY "Members can read club members" ON public.club_members 
  FOR SELECT USING (
    -- El propietario del club puede ver todos los miembros
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND owner_id = auth.uid())
    OR
    -- O el usuario es el mismo miembro (puede verse a sí mismo)
    user_id = auth.uid()
    OR
    -- O el club es público y el usuario está autenticado
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND is_public = true AND auth.uid() IS NOT NULL)
  );

-- Política para que el propietario se añada automáticamente al crear el club
CREATE POLICY "Owners can add themselves" ON public.club_members 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid())
  );

-- Política para que usuarios se unan a clubs públicos
CREATE POLICY "Users can join public clubs" ON public.club_members 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND is_public = true)
  );

-- Política para que el propietario añada otros miembros
CREATE POLICY "Owners can add members" ON public.club_members 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND owner_id = auth.uid())
  );

-- Política para que usuarios abandonen clubs
CREATE POLICY "Users can leave clubs" ON public.club_members 
  FOR DELETE USING (auth.uid() = user_id);

-- Política para que solo el propietario pueda actualizar miembros (evita recursión)
CREATE POLICY "Owners can manage members" ON public.club_members 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_members.club_id AND owner_id = auth.uid())
  );

-- 3. Verificar que las políticas están correctas
-- Puedes ejecutar esto para ver las políticas actuales:
-- SELECT * FROM pg_policies WHERE tablename = 'club_members';

