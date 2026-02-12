-- ============================================
-- ACADEMY DIGITAL TWIN & ENTITLEMENTS 
-- ============================================

-- 1. TAULA DE CONTINGUT DESBLOQUEJAT (Entitlements)
-- Registra què té l'usuari (sigui per compra o codi)
CREATE TABLE IF NOT EXISTS public.user_entitlements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_type TEXT NOT NULL, -- 'course', 'bundle', 'feature'
    resource_id UUID NOT NULL, -- ID del curs o recurs
    source TEXT DEFAULT 'purchase', -- 'purchase', 'code', 'admin', 'bonus'
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- NULL = per sempre
    UNIQUE(user_id, resource_type, resource_id)
);

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements" 
ON public.user_entitlements FOR SELECT 
USING (auth.uid() = user_id);

-- 2. TAULA DE CODIS D'ACTIVACIÓ (Digital Twin)
-- Codis que venen amb productes físics o targetes regal
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- Codi alfanumèric (ex: 'CHESS-MASTER-2024')
    type TEXT NOT NULL, -- 'course_unlock', 'subscription_time', 'currency_pack'
    resource_id UUID, -- ID del recurs a desbloquejar (si escau)
    resource_data JSONB DEFAULT '{}', -- Dades extra (ex: { "amount": 1000, "currency": "gold" })
    
    max_uses INTEGER DEFAULT 1, -- Un sol ús per defecte
    current_uses INTEGER DEFAULT 0,
    
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índex per buscar codis ràpidament
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON public.activation_codes(code);

-- RLS: Només admins poden veure/gestionar codis. 
-- Els usuaris normals interactuen via RPC (funció segura).
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- 3. HISTORIAL D'ACTIVACIONS
CREATE TABLE IF NOT EXISTS public.activation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    code_id UUID REFERENCES public.activation_codes(id),
    code_snapshot TEXT, -- El codi en el moment d'usar-lo
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

ALTER TABLE public.activation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activation log" 
ON public.activation_log FOR SELECT 
USING (auth.uid() = user_id);


-- 4. FUNCIÓ PER BESCANVIAR CODI (Segura)
CREATE OR REPLACE FUNCTION public.redeem_activation_code(input_code TEXT)
RETURNS JSONB AS $$
DECLARE
    code_record RECORD;
    user_uuid UUID;
    result JSONB;
BEGIN
    user_uuid := auth.uid();
    
    -- 1. Buscar el codi
    SELECT * INTO code_record 
    FROM public.activation_codes 
    WHERE code = input_code 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW());
      
    -- 2. Validar existència
    IF code_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Codi invàlid o expirat');
    END IF;
    
    -- 3. Validar usos
    IF code_record.current_uses >= code_record.max_uses THEN
        RETURN jsonb_build_object('success', false, 'error', 'Codi exhaurit');
    END IF;
    
    -- 4. Processar l'efecte del codi
    IF code_record.type = 'course_unlock' THEN
        -- Desbloquejar curs
        INSERT INTO public.user_entitlements (user_id, resource_type, resource_id, source)
        VALUES (user_uuid, 'course', code_record.resource_id, 'code')
        ON CONFLICT (user_id, resource_type, resource_id) DO NOTHING;
        
    ELSIF code_record.type = 'currency_pack' THEN
        -- Afegir or/mana (Exemple)
        UPDATE public.kingdom_resources
        SET gold = gold + COALESCE((code_record.resource_data->>'gold')::int, 0),
            mana = mana + COALESCE((code_record.resource_data->>'mana')::int, 0)
        WHERE user_id = user_uuid;
        -- Si no existeix recurs, crear-lo (upsert)
        IF NOT FOUND THEN
             INSERT INTO public.kingdom_resources (user_id, gold, mana)
             VALUES (user_uuid, COALESCE((code_record.resource_data->>'gold')::int, 0), COALESCE((code_record.resource_data->>'mana')::int, 0));
        END IF;
    END IF;
    
    -- 5. Actualitzar comptador usos
    UPDATE public.activation_codes
    SET current_uses = current_uses + 1
    WHERE id = code_record.id;
    
    -- 6. Log
    INSERT INTO public.activation_log (user_id, code_id, code_snapshot, success)
    VALUES (user_uuid, code_record.id, input_code, true);
    
    RETURN jsonb_build_object('success', true, 'type', code_record.type, 'message', 'Codi bescanviat correctament!');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
