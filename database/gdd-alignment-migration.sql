-- ============================================================================
-- MIGRACIÓ GDD MASTER: ALINEACIÓ I OPTIMITZACIÓ
-- ============================================================================
-- Aquest script consolida els canvis necessaris per alinear la base de dades
-- amb el Game Design Document (GDD) v2.0 per a les Fases 1, 2 i 3.
--
-- SECCIONS:
-- 1. RBAC v2 (Rols i Permisos GDD)
-- 2. ACADEMY V2 (Estructura de cursos i lliçons)
-- 3. KINGDOM (Economia i Edificis)
-- 4. ERP (Clubs jeràrquics i Alumnes gestionats)
-- 5. OPTIMITZACIÓ (Índexs de rendiment)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. RBAC v2 (Rols i Permisos GDD)
-- ============================================================================

-- 1.1 Nous rols GDD
INSERT INTO public.app_roles (name, description) VALUES
  ('Governor', 'Gestor de Club, Escola o AFA'),
  ('Mentor', 'Docent, Monitor d''escacs'),
  ('Hero', 'Estudiant, aprenent'),
  ('Gladiator', 'Jugador competitiu'),
  ('Steward', 'Agent IA automatitzat')
ON CONFLICT (name) DO NOTHING;

-- 1.2 Nous permisos GDD
INSERT INTO public.app_permissions (code, description) VALUES
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
ON CONFLICT (code) DO NOTHING;

-- 1.3 Assignació de permisos (simplificat per idoneïtat, assumim IDs existents després dels inserts)
-- Governor
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Governor' AND p.code IN (
  'manage.organization', 'manage.billing', 'manage.members',
  'view.classroom', 'view.academy', 'play.arena', 'play.kingdom',
  'view.analysis', 'view.shop', 'view.profile', 'view.clubs', 'view.market'
) ON CONFLICT DO NOTHING;

-- Mentor
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Mentor' AND p.code IN (
  'manage.members', 'validate.progress', 'assign.tasks',
  'view.classroom', 'view.academy', 'play.arena', 'play.kingdom',
  'view.analysis', 'view.shop', 'view.profile', 'view.clubs'
) ON CONFLICT DO NOTHING;

-- Hero
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Hero' AND p.code IN (
  'view.classroom', 'view.academy', 'play.arena', 'play.kingdom',
  'view.shop', 'view.profile', 'view.clubs'
) ON CONFLICT DO NOTHING;

-- Gladiator
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'Gladiator' AND p.code IN (
  'view.academy', 'play.arena', 'play.kingdom',
  'view.analysis', 'view.shop', 'view.profile', 'view.clubs'
) ON CONFLICT DO NOTHING;

-- 1.4 Migració d'usuaris existents
UPDATE public.profiles
SET role_id = (SELECT id FROM public.app_roles WHERE name = 'Hero')
WHERE role_id IN (SELECT id FROM public.app_roles WHERE name IN ('ClubMember', 'NewUser'));

UPDATE public.profiles
SET role_id = (SELECT id FROM public.app_roles WHERE name = 'Mentor')
WHERE role_id IN (SELECT id FROM public.app_roles WHERE name = 'Monitor');

-- 1.5 Actualitzar trigger de signup
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


-- ============================================================================
-- 2. ACADEMY V2 (Estructura de cursos i lliçons)
-- ============================================================================

-- Assegurar taules base
CREATE TABLE IF NOT EXISTS public.academy_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Afegir columnes V2
ALTER TABLE public.academy_courses 
ADD COLUMN IF NOT EXISTS track TEXT DEFAULT 'academic',
ADD COLUMN IF NOT EXISTS target_grade TEXT,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT,
ADD COLUMN IF NOT EXISTS subject_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.academy_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.academy_courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  level TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academy_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES public.academy_modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  "order" INTEGER NOT NULL,
  difficulty INTEGER DEFAULT 1,
  is_free BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progrés
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.academy_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- Vincular Academy a Clubs (GDD: Els clubs poden tenir cursos propis o assignats)
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.academy_courses(id);


-- ============================================================================
-- 3. KINGDOM (Economia i Edificis)
-- ============================================================================

-- Recursos
CREATE TABLE IF NOT EXISTS public.kingdom_resources (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    gold INTEGER DEFAULT 0,
    mana INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Definicions d'edificis (Phase 2)
CREATE TABLE IF NOT EXISTS public.building_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('economy', 'defense', 'decorative')),
    name TEXT NOT NULL,
    description TEXT,
    base_cost JSONB NOT NULL DEFAULT '{}'::jsonb,
    production_rate INTEGER DEFAULT 0,
    max_level INTEGER DEFAULT 3,
    dimensions JSONB NOT NULL DEFAULT '{"w": 1, "h": 1}'::jsonb,
    asset_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Edificis d'usuari
CREATE TABLE IF NOT EXISTS public.kingdom_buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    building_def_id UUID REFERENCES public.building_definitions(id),
    level INTEGER DEFAULT 1,
    x INTEGER NOT NULL CHECK (x >= 0 AND x <= 7),
    y INTEGER NOT NULL CHECK (y >= 0 AND y <= 7),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'constructing', 'upgrading')),
    constructed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    last_collected_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    construction_finish_at TIMESTAMP WITH TIME ZONE
);

-- Perfils de Regne (Skins)
CREATE TABLE IF NOT EXISTS public.kingdom_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    active_terrain_skin TEXT DEFAULT 'grass',
    unlocked_skins TEXT[] DEFAULT ARRAY['grass'],
    defense_scenario_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Activar RLS per defecte a tot
ALTER TABLE public.kingdom_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kingdom_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kingdom_profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 4. ERP (Clubs jeràrquics i Alumnes gestionats)
-- ============================================================================

-- Jerarquia de Clubs (Sub-Clans / Classes)
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'club'; -- 'school', 'class', 'federation'

CREATE INDEX IF NOT EXISTS idx_clubs_parent ON public.clubs(parent_id);

-- Alumnes gestionats ("Shadow Users" per a escoles sense email)
CREATE TABLE IF NOT EXISTS public.club_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  group_identifier TEXT, -- ex: "4rt B"
  notes TEXT,
  elo INTEGER DEFAULT 800,
  puzzle_rating INTEGER DEFAULT 800,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.club_students ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 5. OPTIMITZACIÓ (Índexs de rendiment)
-- ============================================================================

-- Academy
CREATE INDEX IF NOT EXISTS idx_academy_courses_track ON public.academy_courses(track);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.academy_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.academy_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_exercises_tags ON public.academy_exercises USING GIN (tags);

-- ERP & Clubs
CREATE INDEX IF NOT EXISTS idx_club_students_club ON public.club_students(club_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE is_read = false;

-- Arena & Games
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.challenges(status);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);

COMMIT;
