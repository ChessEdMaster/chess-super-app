-- ============================================
-- CLUBS FINANCE & SOCIAL EXTENSION (Pilar 2)
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. PLANS DE SUBSCRIPCIÓ DEL CLUB
CREATE TABLE IF NOT EXISTS public.club_subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- Ex: "Soci General", "Soci Premium", "Alumne"
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT DEFAULT 'EUR',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year', 'one_time')),
  stripe_price_id TEXT, -- ID del preu a Stripe
  features JSONB DEFAULT '[]', -- Llista de beneficis
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBSCRIPCIONS DELS MEMBRES
CREATE TABLE IF NOT EXISTS public.club_member_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.club_subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id) -- Un usuari només pot tenir una subscripció activa per club
);

-- 3. PAGAMENTS I FACTURES (Històric)
CREATE TABLE IF NOT EXISTS public.club_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.club_member_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')),
  description TEXT, -- Ex: "Quota Gener 2025"
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RELACIONS ENTRE CLUBS (Xarxa Global)
CREATE TABLE IF NOT EXISTS public.club_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  target_club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  type TEXT DEFAULT 'friendly', -- 'friendly', 'rival', 'partner'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_club_id, target_club_id),
  CHECK (requester_club_id != target_club_id)
);

-- 5. MATXES ENTRE CLUBS (Club vs Club)
CREATE TABLE IF NOT EXISTS public.club_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  away_club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- Ex: "Lliga Catalana - Ronda 1"
  start_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled')),
  result_home DECIMAL(4, 1) DEFAULT 0, -- Puntuació (ex: 4.5)
  result_away DECIMAL(4, 1) DEFAULT 0,
  board_count INTEGER DEFAULT 4, -- Nombre de taulers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (home_club_id != away_club_id)
);

-- 6. POLÍTIQUES DE SEGURETAT (RLS)

-- Plans: Tothom pot veure, només admins del club poden gestionar
ALTER TABLE public.club_subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active plans" ON public.club_subscription_plans 
  FOR SELECT USING (is_active = true OR 
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_subscription_plans.club_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );
CREATE POLICY "Club admins can manage plans" ON public.club_subscription_plans 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_subscription_plans.club_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Subscripcions: Usuari veu la seva, admins veuen totes les del club
ALTER TABLE public.club_member_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription" ON public.club_member_subscriptions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Club admins read all subscriptions" ON public.club_member_subscriptions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_member_subscriptions.club_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Pagaments: Usuari veu els seus, admins veuen tots
ALTER TABLE public.club_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.club_payments 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Club admins read all payments" ON public.club_payments 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = club_payments.club_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Relacions i Matxes: Públic per veure, admins per gestionar
ALTER TABLE public.club_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read relationships" ON public.club_relationships FOR SELECT USING (true);
CREATE POLICY "Admins manage relationships" ON public.club_relationships 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = requester_club_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

ALTER TABLE public.club_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read matches" ON public.club_matches FOR SELECT USING (true);
CREATE POLICY "Admins manage matches" ON public.club_matches 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.club_members WHERE club_id = home_club_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- 7. ÍNDEXS
CREATE INDEX IF NOT EXISTS idx_club_subs_club ON public.club_member_subscriptions(club_id);
CREATE INDEX IF NOT EXISTS idx_club_subs_user ON public.club_member_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_club_payments_club ON public.club_payments(club_id);
CREATE INDEX IF NOT EXISTS idx_club_matches_home ON public.club_matches(home_club_id);
