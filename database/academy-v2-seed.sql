-- MEGA-SCRIPT: CHESS ACADEMY SEED (P3 -> PhD)
-- Autor: Chess Super App Architect
-- Data: 2024

BEGIN;

-- 1. Neteja opcional (Descomenta si vols esborrar cursos antics per evitar duplicats)
-- TRUNCATE TABLE public.academy_lessons, public.academy_modules, public.academy_courses CASCADE;

-- Assegurar que tenim camps per a la classificació pedagògica
ALTER TABLE public.academy_courses 
ADD COLUMN IF NOT EXISTS track TEXT DEFAULT 'academic', -- 'academic', 'pedagogical', 'sport'
ADD COLUMN IF NOT EXISTS target_grade TEXT, -- 'P3', '1r Primària', 'ESO'
ADD COLUMN IF NOT EXISTS subject_tags TEXT[], -- ['math', 'geometry']
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;

-- Crear un índex per buscar ràpidament per curs escolar
CREATE INDEX IF NOT EXISTS idx_academy_courses_grade ON public.academy_courses(target_grade);

DO $$
DECLARE
    -- Variables per guardar els IDs generats dinàmicament
    c_id uuid; -- Course ID
    m_id uuid; -- Module ID
BEGIN

    -----------------------------------------------------------------------------
    -- ETAPA 1: EDUCACIÓ INFANTIL (P3-P5)
    -----------------------------------------------------------------------------

    -- >>> P3: EL MÓN EN BLANC I NEGRE
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Infantil P3: El Món en Blanc i Negre',
        'infantil-p3-discovery',
        'Introducció sensorial. Colors, formes i la família reial.',
        'academic', 'P3', 'beginner', ARRAY['lateralitat', 'colors'], true
    ) RETURNING id INTO c_id;

        -- Mòdul 1
        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: El Regne de la Llum', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, is_free) VALUES
        (m_id, 'El Dia i la Nit', 1, '{"type":"story", "text":"Blanc i Negre són amics."}', true),
        (m_id, 'Dins i Fora', 2, '{"type":"concept", "text":"Les peces viuen dins del tauler."}', false);

        -- Mòdul 2
        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 2: La Família Reial', 2) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'El Rei (Pare)', 1, '{"type":"piece", "piece":"king"}'),
        (m_id, 'Els Peons (Nens)', 2, '{"type":"piece", "piece":"pawn"}');


    -- >>> P4: CAMINS I DIRECCIONS
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Infantil P4: Camins i Direccions',
        'infantil-p4-directions',
        'Diferència entre rectes (Torre) i diagonals (Alfil).',
        'academic', 'P4', 'beginner', ARRAY['orientació', 'rectes'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Robots i Avions', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, is_free) VALUES
        (m_id, 'La Torre Robot', 1, '{"type":"piece", "piece":"rook"}', true),
        (m_id, 'L''Alfil Avió', 2, '{"type":"piece", "piece":"bishop"}', false);


    -- >>> P5: MÀGIA I SALTS
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Infantil P5: Màgia i Salts',
        'infantil-p5-magic',
        'El Cavall, la Dama i el concepte d''Escac (Amenaça).',
        'academic', 'P5', 'beginner', ARRAY['lògica', 'cavall'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: El Cavall Saltador', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'La Lletra L', 1, '{"type":"mechanic", "text":"Un, dos i tomb!"}'),
        (m_id, 'Alerta Rei! (Escac)', 2, '{"type":"concept", "text":"El Rei està en perill."}');


    -----------------------------------------------------------------------------
    -- ETAPA 2: PRIMÀRIA (1r - 6è)
    -----------------------------------------------------------------------------

    -- >>> 1r PRIMÀRIA: REGLAMENT
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '1r Primària: Reglament i Superpoders',
        'primary-1-foundations',
        'El curs oficial. Mat, Enroc, Promoció i Valors.',
        'academic', '1r Primària', 'beginner', ARRAY['reglament', 'competició'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Objectiu Final', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, is_free) VALUES
        (m_id, 'Escac i Mat', 1, '{"type":"concept", "text":"Game Over."}', true),
        (m_id, 'El Rei Ofegat (Taules)', 2, '{"type":"concept", "text":"Empat per bloqueig."}', false);

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 2: Superpoders', 2) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'L''Enroc', 1, '{"type":"mechanic", "move":"castling"}'),
        (m_id, 'La Coronació', 2, '{"type":"mechanic", "move":"promotion"}');


    -- >>> 2n PRIMÀRIA: TÀCTICA I
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '2n Primària: Ulls de Falcó (Visió Tàctica)',
        'primary-2-tactics',
        'Visió immediata. Mat en 1 i Doble Atac.',
        'academic', '2n Primària', 'beginner', ARRAY['tàctica', 'càlcul'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Mat en 1', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'El Petó de la Mort', 1, '{"type":"pattern", "piece":"queen"}'),
        (m_id, 'El Passadís', 2, '{"type":"pattern", "piece":"rook"}');


    -- >>> 3r PRIMÀRIA: NOTACIÓ I CLAVADES
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '3r Primària: Notació i Clavades',
        'primary-3-tactics-ii',
        'Llenguatge algebraic i la tàctica de la Clavada.',
        'academic', '3r Primària', 'intermediate', ARRAY['notació', 'clavada'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Notació', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Coordenades', 1, '{"type":"drill", "text":"e4, Cf3..."}'),
        (m_id, 'La Clavada Absoluta', 2, '{"type":"tactic", "text":"No et pots moure!"}');


    -- >>> 4t PRIMÀRIA: ESTRATÈGIA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '4t Primària: L''Art de la Planificació',
        'primary-4-strategy',
        'Principis d''obertura i peces bones vs dolentes.',
        'academic', '4t Primària', 'intermediate', ARRAY['estratègia', 'obertura'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Regles d''Or', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Control del Centre', 1, '{"type":"strategy", "text":"Domina e4/d4"}'),
        (m_id, 'Cavall al Centre (Pop)', 2, '{"type":"strategy", "text":"Avantllost"}');


    -- >>> 5è PRIMÀRIA: CÀLCUL I SACRIFICI
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '5è Primària: Càlcul i Sacrifici',
        'primary-5-calculation',
        'Jugades candidates i el concepte de Sacrifici.',
        'academic', '5è Primària', 'intermediate', ARRAY['càlcul', 'sacrifici'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Sacrificis', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'El Regal Grec (Axh7)', 1, '{"type":"pattern", "text":"Destrucció de l''enroc"}'),
        (m_id, 'L''Oposició de Reis', 2, '{"type":"endgame", "text":"Finals de peons"}');


    -- >>> 6è PRIMÀRIA: COMPETICIÓ
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '6è Primària: Competició i Obertures',
        'primary-6-competition',
        'Obertures reals (Italiana/Espanyola) i Rellotge.',
        'academic', '6è Primària', 'intermediate', ARRAY['obertures', 'rellotge'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Obertures Obertes', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'La Italiana', 1, '{"type":"opening", "pgn":"1.e4 e5 2.Cf3 Cc6 3.Ac4"}'),
        (m_id, 'Finals de Torres (Lucena)', 2, '{"type":"endgame", "text":"El pont de Lucena"}');


    -----------------------------------------------------------------------------
    -- ETAPA 3: ESO (1r - 4t)
    -----------------------------------------------------------------------------

    -- >>> 1r ESO: ESTRUCTURES
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '1r ESO: Anatomia de la Posició',
        'eso-1-structures',
        'Estructures de peons, debilitats i caselles fortes.',
        'academic', '1r ESO', 'advanced', ARRAY['estructures', 'peons'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Esquelet', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Peons Doblats i Aïllats', 1, '{"type":"strategy", "text":"Objectius d''atac"}'),
        (m_id, 'La Columna Oberta', 2, '{"type":"strategy", "text":"Autopistes per torres"}');


    -- >>> 2n ESO: FINALS TEÒRICS
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '2n ESO: Finals Teòrics i Precisió',
        'eso-2-endgames',
        'Triangulació, Vancura i Alfil vs Cavall.',
        'academic', '2n ESO', 'advanced', ARRAY['finals', 'precisió'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Geometria', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'La Triangulació', 1, '{"type":"endgame", "text":"Perdre temps per guanyar"}'),
        (m_id, 'Defensa Vancura', 2, '{"type":"endgame", "text":"Salvar finals de torre"}');


    -- >>> 3r ESO: REPERTORI
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '3r ESO: L''Armadura del Jugador (Repertori)',
        'eso-3-repertoire',
        'Construcció de repertori, bases de dades i Stockfish.',
        'academic', '3r ESO', 'advanced', ARRAY['repertori', 'tecnologia'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Estil', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Jugador e4 vs d4', 1, '{"type":"opening", "text":"Tàctic vs Posicional"}'),
        (m_id, 'Ús de Bases de Dades', 2, '{"type":"tech", "text":"Opening Tree"}');


    -- >>> 4t ESO: PSICOLOGIA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '4t ESO: La Ment del Campió',
        'eso-4-psychology',
        'Psicologia, Tilt, Història (Fischer/Kasparov) i Reglament.',
        'academic', '4t ESO', 'advanced', ARRAY['psicologia', 'història'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Psicologia', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Gestió del Tilt', 1, '{"type":"psych", "text":"Recuperació d''errors"}'),
        (m_id, 'J''adoube i Reclamacions', 2, '{"type":"rules", "text":"Reglament de torneig"}');


    -----------------------------------------------------------------------------
    -- ETAPA 4: BATXILLERAT (1r - 2n)
    -----------------------------------------------------------------------------

    -- >>> 1r BATX: HIPERMODERNISME
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '1r Batxillerat: Bellesa i Caos',
        'batx-1-hypermodernism',
        'Hipermodernisme, Fianchetto i Sacrifici Posicional.',
        'academic', '1r Batxillerat', 'expert', ARRAY['estètica', 'dinàmica'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: La Revolució', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'El Fianchetto', 1, '{"type":"strategy", "text":"Control a distància"}'),
        (m_id, 'Sacrifici de Qualitat', 2, '{"type":"strategy", "text":"Petrosian Style"}');


    -- >>> 2n BATX: PROFILAXI
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '2n Batxillerat: Mestratge i Profilaxi',
        'batx-2-mastery',
        'Profilaxi, Principi de les dues debilitats i Conversió.',
        'academic', '2n Batxillerat', 'expert', ARRAY['profilaxi', 'conversió'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Profilaxi', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'La Pregunta Màgica', 1, '{"type":"concept", "text":"Què vol fer ell?"}'),
        (m_id, 'Transformació d''Avantatge', 2, '{"type":"concept", "text":"Tècnica superior"}');


    -----------------------------------------------------------------------------
    -- ETAPA 5: UNIVERSITAT (Any 1 - 4)
    -----------------------------------------------------------------------------

    -- >>> UNI 1: FONAMENTS CIENTÍFICS
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Grau Any 1: Fonaments Científics',
        'uni-year-1-foundations',
        'Estructures complexes (Maróczy/Karlsbad) i Història Moderna.',
        'academic', 'Universitat Any 1', 'master', ARRAY['ciència', 'estructures'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Estructures Complexes', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Anell de Maróczy', 1, '{"type":"structure", "text":"Control espacial"}'),
        (m_id, 'Fischer vs Spassky', 2, '{"type":"history", "text":"Geopolítica"}');


    -- >>> UNI 2: TECNOLOGIA IA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Grau Any 2: Tecnologia i IA',
        'uni-year-2-tech',
        'AlphaZero, Xarxes Neuronals i escacs híbrids.',
        'academic', 'Universitat Any 2', 'master', ARRAY['IA', 'tecnologia'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Motors', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'AlphaBeta vs NNUE', 1, '{"type":"tech", "text":"Com pensen les màquines"}'),
        (m_id, 'La "Computer Move"', 2, '{"type":"concept", "text":"Jugades inhumanes"}');


    -- >>> UNI 3: PEDAGOGIA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Grau Any 3: Pedagogia i Gestió',
        'uni-year-3-pedagogy',
        'Didàctica, Arbitratge i Gestió de Clubs.',
        'vocational', 'Universitat Any 3', 'master', ARRAY['pedagogia', 'gestió'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Didàctica', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Mètode per Passos', 1, '{"type":"pedagogy", "text":"Com ensenyar"}'),
        (m_id, 'Sistema Suís', 2, '{"type":"management", "text":"Organitzar tornejos"}');


    -- >>> UNI 4: ESPECIALITZACIÓ
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Grau Any 4: Especialització i TFG',
        'uni-year-4-specialization',
        'Alt Rendiment, Investigació i Tesi Final.',
        'vocational', 'Universitat Any 4', 'master', ARRAY['tfg', 'investigació'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Alt Rendiment', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Preparació Física', 1, '{"type":"health", "text":"Mens sana in corpore sano"}'),
        (m_id, 'Defensa del TFG', 2, '{"type":"project", "text":"Projecte final"}');


    -----------------------------------------------------------------------------
    -- ETAPA 6: DOCTORAT (PhD)
    -----------------------------------------------------------------------------

    -- >>> PHD
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Doctorat (PhD): La Frontera del Coneixement',
        'phd-research-frontier',
        'Investigació pura. Neurociència i Arqueologia de la Teoria.',
        'vocational', 'Doctorat', 'grandmaster', ARRAY['investigació', 'neurociència'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order") VALUES (c_id, 'Mòdul 1: Investigació', 1) RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content) VALUES
        (m_id, 'Novetat Teòrica (TN)', 1, '{"type":"research", "text":"Refutar la història"}'),
        (m_id, 'El Cervell del Mestre', 2, '{"type":"science", "text":"Neurociència cognitiva"}');

END $$;

COMMIT;
