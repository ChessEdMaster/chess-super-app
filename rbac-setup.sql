-- ============================================
-- SISTEMA RBAC (Role-Based Access Control)
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. TAULA DE ROLS
CREATE TABLE IF NOT EXISTS public.app_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TAULA DE PERMISOS
CREATE TABLE IF NOT EXISTS public.app_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- Ex: 'view.clubs', 'admin.all'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TAULA INTERMÈDIA (ROLS <-> PERMISOS)
CREATE TABLE IF NOT EXISTS public.app_role_permissions (
  role_id UUID REFERENCES public.app_roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.app_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. ACTUALITZAR PROFILES
-- Assumim que la taula 'profiles' existeix. Si no, crea-la primer.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role_id') THEN
        ALTER TABLE public.profiles ADD COLUMN role_id UUID REFERENCES public.app_roles(id);
    END IF;
END $$;

-- 5. DADES INICIALS (SEED)
-- Inserir Rols
INSERT INTO public.app_roles (name, description) VALUES
('SuperAdmin', 'Accés total al sistema'),
('ClubMember', 'Membre regular de clubs'),
('Guest', 'Usuari convidat'),
('NewUser', 'Usuari registrat per defecte')
ON CONFLICT (name) DO NOTHING;

-- Inserir Permisos
INSERT INTO public.app_permissions (code, description) VALUES
('admin.all', 'Administració total'),
('view.clubs', 'Veure llistat de clubs'),
('manage.club', 'Gestionar el propi club'),
('view.academy', 'Accés a l''acadèmia'),
('view.profile', 'Veure el propi perfil'),
('view.market', 'Veure la botiga')
ON CONFLICT (code) DO NOTHING;

-- Assignar Permisos a Rols
-- SuperAdmin -> admin.all
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'SuperAdmin' AND p.code = 'admin.all'
ON CONFLICT DO NOTHING;

-- NewUser -> view.clubs, view.profile
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'NewUser' AND p.code IN ('view.clubs', 'view.profile')
ON CONFLICT DO NOTHING;

-- ClubMember -> view.clubs, view.profile, view.academy
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'ClubMember' AND p.code IN ('view.clubs', 'view.profile', 'view.academy')
ON CONFLICT DO NOTHING;

-- 6. TRIGGER PER ASSIGNAR ROL PER DEFECTE
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  SELECT id INTO default_role_id FROM public.app_roles WHERE name = 'NewUser';
  
  IF NEW.role_id IS NULL THEN
    NEW.role_id := default_role_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created_set_role ON public.profiles;
CREATE TRIGGER on_profile_created_set_role
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 7. FUNCIÓ PER SINCRONITZAR ROL AMB AUTH.USERS (JWT)
-- Això permet que el rol estigui disponible a la sessió (access_token)
CREATE OR REPLACE FUNCTION public.sync_role_to_auth_metadata()
RETURNS TRIGGER AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT name INTO role_name FROM public.app_roles WHERE id = NEW.role_id;
  
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('app_role', role_name)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_change_sync_auth ON public.profiles;
CREATE TRIGGER on_profile_role_change_sync_auth
  AFTER INSERT OR UPDATE OF role_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_role_to_auth_metadata();

-- 8. FUNCIÓ HELPER PER OBTENIR PERMISOS (Per usar al frontend o RLS)
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS TABLE (permission_code TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.code
  FROM public.app_permissions p
  JOIN public.app_role_permissions rp ON rp.permission_id = p.id
  JOIN public.app_roles r ON r.id = rp.role_id
  JOIN public.profiles prof ON prof.role_id = r.id
  WHERE prof.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ACTUALITZAR RLS DE CLUBS (Exemple d'ús)
-- Només SuperAdmin o propietaris poden crear clubs
-- (Això és un exemple, pots adaptar-ho segons necessitats)
/*
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmin can do everything on clubs" ON public.clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.get_user_permissions(auth.uid()) WHERE permission_code = 'admin.all'
    )
  );
*/
