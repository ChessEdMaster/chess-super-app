-- ============================================
-- RESET CLUBS & CLEANUP SCRIPT
-- Executa aquest script per esborrar tots els clans i dades relacionades.
-- ============================================

-- 1. Esborrar inscripcions a l'acadèmia (ja que depenen dels usuaris/clans)
DELETE FROM public.academy_enrollments;

-- 2. Esborrar membres dels clans
DELETE FROM public.club_members;

-- 3. Esborrar els clans (això també hauria d'esborrar tornejos/partides lligats per Cascade, però depèn de la definició)
DELETE FROM public.clubs;

-- 4. Opcional: Netejar dades de tornejos o partides si estan lligades a clans i no tenen ON DELETE CASCADE
-- DELETE FROM public.tournaments WHERE club_id IS NOT NULL;
-- DELETE FROM public.matches WHERE club_id IS NOT NULL;

-- 5. Confirmació
SELECT 'Clans i dades relacionades esborrats correctament.' as status;
