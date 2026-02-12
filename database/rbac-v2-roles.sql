-- Migration: RBAC v2 — GDD Role Update
-- Migrates from legacy roles (ClubMember, Guest, NewUser) to GDD v2.0 roles
-- (Governor, Mentor, Hero, Gladiator, Steward)

-- 1. Add new roles (idempotent)
INSERT INTO public.app_roles (name, description) VALUES
  ('Governor', 'Gestor de Club, Escola o AFA'),
  ('Mentor', 'Docent, Monitor d''escacs'),
  ('Hero', 'Estudiant, aprenent'),
  ('Gladiator', 'Jugador competitiu'),
  ('Steward', 'Agent IA automatitzat')
ON CONFLICT (name) DO NOTHING;

-- 2. Add new permissions
INSERT INTO public.app_permissions (name, description) VALUES
  ('manage.organization', 'Gestionar la pròpia organització'),
  ('manage.billing', 'Gestionar facturació i quotes'),
  ('manage.members', 'Gestionar membres d''una organització'),
  ('validate.progress', 'Validar progrés d''alumnes'),
  ('assign.tasks', 'Assignar tasques a alumnes'),
  ('view.classroom', 'Veure l''aula virtual'),
  ('play.arena', 'Jugar partides a l''Arena'),
  ('play.kingdom', 'Accedir al Regne'),
  ('view.analysis', 'Accedir a eines d''anàlisi'),
  ('view.shop', 'Accedir a la botiga')
ON CONFLICT (name) DO NOTHING;

-- 3. Assign permissions to Governor role
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Governor' AND p.name IN (
  'manage.organization', 'manage.billing', 'manage.members',
  'view.classroom', 'view.academy', 'play.arena', 'play.kingdom',
  'view.analysis', 'view.shop', 'view.profile', 'view.clubs', 'view.market'
)
ON CONFLICT DO NOTHING;

-- 4. Assign permissions to Mentor role
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Mentor' AND p.name IN (
  'manage.members', 'validate.progress', 'assign.tasks',
  'view.classroom', 'view.academy', 'play.arena', 'play.kingdom',
  'view.analysis', 'view.shop', 'view.profile', 'view.clubs'
)
ON CONFLICT DO NOTHING;

-- 5. Assign permissions to Hero role
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Hero' AND p.name IN (
  'view.classroom', 'view.academy', 'play.arena', 'play.kingdom',
  'view.shop', 'view.profile', 'view.clubs'
)
ON CONFLICT DO NOTHING;

-- 6. Assign permissions to Gladiator role
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Gladiator' AND p.name IN (
  'view.academy', 'play.arena', 'play.kingdom',
  'view.analysis', 'view.shop', 'view.profile', 'view.clubs'
)
ON CONFLICT DO NOTHING;

-- 7. Migrate existing users: ClubMember → Hero, NewUser → Hero, Monitor → Mentor
UPDATE public.profiles
SET role_id = (SELECT id FROM public.app_roles WHERE name = 'Hero')
WHERE role_id IN (
  SELECT id FROM public.app_roles WHERE name IN ('ClubMember', 'NewUser')
);

-- 8. Update default role for new users trigger
-- The assign_role_on_signup trigger should now assign 'Hero' instead of 'NewUser'
CREATE OR REPLACE FUNCTION public.assign_role_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  SELECT id INTO default_role_id FROM public.app_roles WHERE name = 'Hero';
  UPDATE public.profiles SET role_id = default_role_id WHERE id = NEW.id AND role_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
