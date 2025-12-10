-- MEGA-SCRIPT: CHESS ACADEMY SEED (DATA ONLY)
-- Autor: Chess Super App Architect
-- Data: 2024
-- Descripció: Insereix tot el currículum (P3 -> PhD) assumint que les taules ja existeixen.

BEGIN;

-- Opcional: Netejar dades antigues per evitar duplicats si es re-executa
TRUNCATE TABLE public.academy_lessons CASCADE;
TRUNCATE TABLE public.academy_modules CASCADE;
TRUNCATE TABLE public.academy_courses CASCADE;

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
        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: El Regne de la Llum', 1, 'Descobreix la llum i la foscor', 'Sun', 'Principiant') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, is_free, description, difficulty) VALUES
        (m_id, 'El Dia i la Nit', 1, '{"type":"story", "text":"Blanc i Negre són amics."}', true, 'Una història sobre el contrast', 1),
        (m_id, 'Dins i Fora', 2, '{"type":"concept", "text":"Les peces viuen dins del tauler."}', false, 'Conceptes espacials bàsics', 1);

        -- Mòdul 2
        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 2: La Família Reial', 2, 'Coneix el Rei i els Peons', 'Crown', 'Principiant') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'El Rei (Pare)', 1, '{"type":"piece", "piece":"king"}', 'La peça més important'),
        (m_id, 'Els Peons (Nens)', 2, '{"type":"piece", "piece":"pawn"}', 'Els petits herois');


    -- >>> P4: CAMINS I DIRECCIONS
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Infantil P4: Camins i Direccions',
        'infantil-p4-directions',
        'Diferència entre rectes (Torre) i diagonals (Alfil).',
        'academic', 'P4', 'beginner', ARRAY['orientació', 'rectes'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Robots i Avions', 1, 'Moviments rectes i diagonals', 'Move', 'Principiant') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, is_free, description) VALUES
        (m_id, 'La Torre Robot', 1, '{"type":"piece", "piece":"rook"}', true, 'Moviment rectilini'),
        (m_id, 'L''Alfil Avió', 2, '{"type":"piece", "piece":"bishop"}', false, 'Moviment diagonal');


    -- >>> P5: MÀGIA I SALTS
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Infantil P5: Màgia i Salts',
        'infantil-p5-magic',
        'El Cavall, la Dama i el concepte d''Escac (Amenaça).',
        'academic', 'P5', 'beginner', ARRAY['lògica', 'cavall'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: El Cavall Saltador', 1, 'L''única peça que salta', 'Zap', 'Principiant') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'La Lletra L', 1, '{"type":"mechanic", "text":"Un, dos i tomb!"}', 'El salt del cavall'),
        (m_id, 'Alerta Rei! (Escac)', 2, '{"type":"concept", "text":"El Rei està en perill."}', 'Concepte d''amenaça');


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

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Objectiu Final', 1, 'Com s''acaba la partida', 'Flag', 'Principiant') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, is_free, description) VALUES
        (m_id, 'Escac i Mat', 1, '{"type":"concept", "text":"Game Over."}', true, 'El final del joc'),
        (m_id, 'El Rei Ofegat (Taules)', 2, '{"type":"concept", "text":"Empat per bloqueig."}', false, 'Quan no es pot moure');

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 2: Superpoders', 2, 'Moviments especials', 'Star', 'Principiant') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'L''Enroc', 1, '{"type":"mechanic", "move":"castling"}', 'Protegint el Rei'),
        (m_id, 'La Coronació', 2, '{"type":"mechanic", "move":"promotion"}', 'El premi del peó');


    -- >>> 2n PRIMÀRIA: TÀCTICA I
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '2n Primària: Ulls de Falcó (Visió Tàctica)',
        'primary-2-tactics',
        'Visió immediata. Mat en 1 i Doble Atac.',
        'academic', '2n Primària', 'beginner', ARRAY['tàctica', 'càlcul'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Mat en 1', 1, 'Troba el mat en una jugada', 'Target', 'Principiant') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'El Petó de la Mort', 1, '{"type":"pattern", "piece":"queen"}', 'Mat amb la Dama'),
        (m_id, 'El Passadís', 2, '{"type":"pattern", "piece":"rook"}', 'Mat a la primera fila');


    -- >>> 3r PRIMÀRIA: NOTACIÓ I CLAVADES
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '3r Primària: Notació i Clavades',
        'primary-3-tactics-ii',
        'Llenguatge algebraic i la tàctica de la Clavada.',
        'academic', '3r Primària', 'intermediate', ARRAY['notació', 'clavada'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Notació', 1, 'Aprèn a llegir i escriure partides', 'Pencil', 'Intermedi') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Coordenades', 1, '{"type":"drill", "text":"e4, Cf3..."}', 'El llenguatge dels escacs'),
        (m_id, 'La Clavada Absoluta', 2, '{"type":"tactic", "text":"No et pots moure!"}', 'Moviments prohibits');


    -- >>> 4t PRIMÀRIA: ESTRATÈGIA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '4t Primària: L''Art de la Planificació',
        'primary-4-strategy',
        'Principis d''obertura i peces bones vs dolentes.',
        'academic', '4t Primària', 'intermediate', ARRAY['estratègia', 'obertura'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Regles d''Or', 1, 'Principis bàsics d''obertura', 'Compass', 'Intermedi') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Control del Centre', 1, '{"type":"strategy", "text":"Domina e4/d4"}', 'Domini del tauler'),
        (m_id, 'Cavall al Centre (Pop)', 2, '{"type":"strategy", "text":"Avantllost"}', 'La posició ideal del cavall');


    -- >>> 5è PRIMÀRIA: CÀLCUL I SACRIFICI
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '5è Primària: Càlcul i Sacrifici',
        'primary-5-calculation',
        'Jugades candidates i el concepte de Sacrifici.',
        'academic', '5è Primària', 'intermediate', ARRAY['càlcul', 'sacrifici'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Sacrificis', 1, 'Quan val la pena perdre material', 'Gift', 'Intermedi') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'El Regal Grec (Axh7)', 1, '{"type":"pattern", "text":"Destrucció de l''enroc"}', 'Atac clàssic sobre h7'),
        (m_id, 'L''Oposició de Reis', 2, '{"type":"endgame", "text":"Finals de peons"}', 'Tècnica de finals');


    -- >>> 6è PRIMÀRIA: COMPETICIÓ
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '6è Primària: Competició i Obertures',
        'primary-6-competition',
        'Obertures reals (Italiana/Espanyola) i Rellotge.',
        'academic', '6è Primària', 'intermediate', ARRAY['obertures', 'rellotge'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Obertures Obertes', 1, 'Començant amb e4', 'Book', 'Intermedi') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'La Italiana', 1, '{"type":"opening", "pgn":"1.e4 e5 2.Cf3 Cc6 3.Ac4"}', 'Giouco Piano'),
        (m_id, 'Finals de Torres (Lucena)', 2, '{"type":"endgame", "text":"El pont de Lucena"}', 'El pont guanyador');


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

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Esquelet', 1, 'L''estructura d''os', 'Grid', 'Avançat') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Peons Doblats i Aïllats', 1, '{"type":"strategy", "text":"Objectius d''atac"}', 'Debilitats estructurals'),
        (m_id, 'La Columna Oberta', 2, '{"type":"strategy", "text":"Autopistes per torres"}', 'Activitat de peces majors');


    -- >>> 2n ESO: FINALS TEÒRICS
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '2n ESO: Finals Teòrics i Precisió',
        'eso-2-endgames',
        'Triangulació, Vancura i Alfil vs Cavall.',
        'academic', '2n ESO', 'advanced', ARRAY['finals', 'precisió'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Geometria', 1, 'Màgia geomètrica al taulell', 'Triangle', 'Avançat') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'La Triangulació', 1, '{"type":"endgame", "text":"Perdre temps per guanyar"}', 'Quan perdre un temps és guanyar'),
        (m_id, 'Defensa Vancura', 2, '{"type":"endgame", "text":"Salvar finals de torre"}', 'Defensa lateral activa');


    -- >>> 3r ESO: REPERTORI
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '3r ESO: L''Armadura del Jugador (Repertori)',
        'eso-3-repertoire',
        'Construcció de repertori, bases de dades i Stockfish.',
        'academic', '3r ESO', 'advanced', ARRAY['repertori', 'tecnologia'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Estil', 1, 'Coneix-te a tu mateix', 'User', 'Avançat') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Jugador e4 vs d4', 1, '{"type":"opening", "text":"Tàctic vs Posicional"}', 'Escollir el teu camí'),
        (m_id, 'Ús de Bases de Dades', 2, '{"type":"tech", "text":"Opening Tree"}', 'Eines modernes');


    -- >>> 4t ESO: PSICOLOGIA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '4t ESO: La Ment del Campió',
        'eso-4-psychology',
        'Psicologia, Tilt, Història (Fischer/Kasparov) i Reglament.',
        'academic', '4t ESO', 'advanced', ARRAY['psicologia', 'història'], true
    ) RETURNING id INTO c_id;
        
        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Psicologia', 1, 'El joc mental', 'Brain', 'Avançat') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Gestió del Tilt', 1, '{"type":"psych", "text":"Recuperació d''errors"}', 'Control emocional'),
        (m_id, 'J''adoube i Reclamacions', 2, '{"type":"rules", "text":"Reglament de torneig"}', 'Normativa oficial');


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

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: La Revolució', 1, 'Trencant les regles clàssiques', 'Zap', 'Tots') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'El Fianchetto', 1, '{"type":"strategy", "text":"Control a distància"}', 'L''Alfil indi'),
        (m_id, 'Sacrifici de Qualitat', 2, '{"type":"strategy", "text":"Petrosian Style"}', 'Canvi intuïtiu');


    -- >>> 2n BATX: PROFILAXI
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        '2n Batxillerat: Mestratge i Profilaxi',
        'batx-2-mastery',
        'Profilaxi, Principi de les dues debilitats i Conversió.',
        'academic', '2n Batxillerat', 'expert', ARRAY['profilaxi', 'conversió'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Profilaxi', 1, 'L''art d''anticipar', 'Shield', 'Tots') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'La Pregunta Màgica', 1, '{"type":"concept", "text":"Què vol fer ell?"}', 'Pensament preventiu'),
        (m_id, 'Transformació d''Avantatge', 2, '{"type":"concept", "text":"Tècnica superior"}', 'Assegurant la victòria');


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

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Estructures Complexes', 1, 'L''ADN dels escacs', 'Hexagon', 'Tots') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Anell de Maróczy', 1, '{"type":"structure", "text":"Control espacial"}', 'Dominació central'),
        (m_id, 'Fischer vs Spassky', 2, '{"type":"history", "text":"Geopolítica"}', 'El match del segle');


    -- >>> UNI 2: TECNOLOGIA IA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Grau Any 2: Tecnologia i IA',
        'uni-year-2-tech',
        'AlphaZero, Xarxes Neuronals i escacs híbrids.',
        'academic', 'Universitat Any 2', 'master', ARRAY['IA', 'tecnologia'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Motors', 1, 'Intel·ligència Artificial', 'Cpu', 'Tots') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'AlphaBeta vs NNUE', 1, '{"type":"tech", "text":"Com pensen les màquines"}', 'Algoritmes de cerca'),
        (m_id, 'La "Computer Move"', 2, '{"type":"concept", "text":"Jugades inhumanes"}', 'Trencant paradigmes humans');


    -- >>> UNI 3: PEDAGOGIA
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Grau Any 3: Pedagogia i Gestió',
        'uni-year-3-pedagogy',
        'Didàctica, Arbitratge i Gestió de Clubs.',
        'vocational', 'Universitat Any 3', 'master', ARRAY['pedagogia', 'gestió'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Didàctica', 1, 'Ensenyar a ensenyar', 'Users', 'Tots') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Mètode per Passos', 1, '{"type":"pedagogy", "text":"Com ensenyar"}', 'Stappenmethode'),
        (m_id, 'Sistema Suís', 2, '{"type":"management", "text":"Organitzar tornejos"}', 'Gestió de competicions');


    -- >>> UNI 4: ESPECIALITZACIÓ
    INSERT INTO public.academy_courses (title, slug, description, track, target_grade, difficulty_level, subject_tags, published)
    VALUES (
        'Grau Any 4: Especialització i TFG',
        'uni-year-4-specialization',
        'Alt Rendiment, Investigació i Tesi Final.',
        'vocational', 'Universitat Any 4', 'master', ARRAY['tfg', 'investigació'], true
    ) RETURNING id INTO c_id;

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Alt Rendiment', 1, 'Professionalització', 'Award', 'Tots') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Preparació Física', 1, '{"type":"health", "text":"Mens sana in corpore sano"}', 'Fitness per escaquistes'),
        (m_id, 'Defensa del TFG', 2, '{"type":"project", "text":"Projecte final"}', 'Graduació');


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

        INSERT INTO public.academy_modules (course_id, title, "order", description, icon, level) VALUES (c_id, 'Mòdul 1: Investigació', 1, 'Crear nou coneixement', 'FlaskConical', 'Tots') RETURNING id INTO m_id;
        INSERT INTO public.academy_lessons (module_id, title, "order", content, description) VALUES
        (m_id, 'Novetat Teòrica (TN)', 1, '{"type":"research", "text":"Refutar la història"}', 'Descobriment de noves jugades'),
        (m_id, 'El Cervell del Mestre', 2, '{"type":"science", "text":"Neurociència cognitiva"}', 'Estudi de la ment');

END $$;

COMMIT;
