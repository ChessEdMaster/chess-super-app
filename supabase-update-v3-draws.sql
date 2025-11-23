-- ============================================
-- SETUP V3: DRAW OFFERS
-- Executa aquest SQL al Supabase SQL Editor
-- ============================================

-- 1. Afegir columna per gestionar ofertes de taules
-- Valors possibles: null (cap oferta), 'white' (blanques ofereixen), 'black' (negres ofereixen)
ALTER TABLE public.games 
ADD COLUMN IF NOT EXISTS draw_offer_by TEXT DEFAULT NULL;

-- 2. Assegurar que Realtime envia aquests canvis
-- (Si ja està habilitat per a tota la taula, no cal fer res més)
