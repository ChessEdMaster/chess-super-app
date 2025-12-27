-- ============================================
-- ERP LITE SETUP: SCHOOLS, GROUPS & ATTENDANCE
-- ============================================

-- 1. ROLES (Extended from RBAC)
INSERT INTO public.app_roles (name, description) VALUES
('Monitor', 'Instructor o professor del grup'),
('Student', 'Alumne participant en un grup escolar')
ON CONFLICT (name) DO NOTHING;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    contact_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    monitor_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    schedule TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('present', 'absent', 'late')),
    notes TEXT,
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Row Level Security)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Schools: Read-only for authenticated users
CREATE POLICY "Authenticated users can view schools" 
ON public.schools FOR SELECT 
TO authenticated 
USING (true);

-- Groups: Visible to assigned monitor and member students
CREATE POLICY "Monitors can view their assigned groups" 
ON public.groups FOR SELECT 
TO authenticated 
USING (auth.uid() = monitor_id);

CREATE POLICY "Students can view their groups" 
ON public.groups FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = public.groups.id AND profile_id = auth.uid()
    )
);

-- Attendance Logs: Visible/Editable only for the Monitor of the group
CREATE POLICY "Monitors can manage attendance for their groups" 
ON public.attendance_logs FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE id = public.attendance_logs.group_id AND monitor_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE id = public.attendance_logs.group_id AND monitor_id = auth.uid()
    )
);

-- Group Members (Helper)
CREATE POLICY "Monitors can view members of their groups" 
ON public.group_members FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.groups 
        WHERE id = public.group_members.group_id AND monitor_id = auth.uid()
    )
);

CREATE POLICY "Students can view their own membership" 
ON public.group_members FOR SELECT 
TO authenticated 
USING (profile_id = auth.uid());
