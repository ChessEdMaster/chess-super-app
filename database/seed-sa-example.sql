-- ============================================
-- SEED EXAMPLE: SA (SITUACIÓ D'APRENENTATGE)
-- Exemple: "Arquitectes del Tauler" (1r ESO)
-- ============================================

DO $$
DECLARE
    v_course_id UUID;
    v_module_id UUID;
BEGIN
    -- 1. Crear o recuperar el Curs (1r ESO)
    INSERT INTO public.academy_courses (title, slug, target_grade, description, track, difficulty_level)
    VALUES (
        '1r ESO: Anatomia de la Posició', 
        '1r-eso-anatomia', 
        '1r ESO', 
        'Curs de fonaments estratègics i estructures de peons.',
        'academic',
        'Principiant'
    )
    ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO v_course_id;

    -- 2. Crear el Mòdul (La SA: "Arquitectes del Tauler")
    -- Eliminem el mòdul si ja existeix per reiniciar l'exemple
    DELETE FROM public.academy_modules WHERE title = 'Arquitectes del Tauler: Per què cauen els edificis?';

    INSERT INTO public.academy_modules (
        course_id, 
        title, 
        description, 
        icon, 
        level, 
        "order",
        -- SA Metadata
        duration,
        context_description,
        challenge_description,
        final_product,
        transversal_vectors,
        competencies,
        knowledge_topics,
        learning_objective,
        dua_guidelines,
        evaluation_criteria
    )
    VALUES (
        v_course_id,
        'Arquitectes del Tauler: Per què cauen els edificis?',
        'Imagina que ets un arquitecte i t''encarreguen reformar un edifici que té esquerdes. Si l''estructura cau, la partida es perd.',
        'castle',
        'Principiant',
        1,
        -- Camps SA
        '3 Sessions',
        'Imagina que ets un arquitecte i t''encarreguen reformar un edifici que té esquerdes. En els escacs, els peons són les parets i les columnes de la teva posició.',
        'Com podem diagnosticar la ''salut'' d''una posició només mirant els peons, sense calcular cap variant tàctica?',
        'L''Informe Tècnic d''Estructures: Analitzar una posició i marcar debilitats (vermell) i fortaleses (verd).',
        ARRAY['Pensament Crític', 'Benestar Emocional'],
        '{
            "CE1": "Anàlisi: Identificar patrons estructurals i relacionar-los amb plans estratègics.",
            "CE2": "Comunicació: Utilitzar vocabulari tècnic per argumentar una valoració."
        }'::jsonb,
        ARRAY['Estructures de peons (Cadenes vs Illes)', 'Debilitats (doblats, aïllats, endarrerits)', 'Tècnica de bloqueig'],
        'Analitzar (Capacitat) l''estructura de peons d''una posició (Saber) per elaborar un pla estratègic que ataqui les debilitats del rival (Finalitat).',
        '{
            "representacio": ["Colors sobre el tauler", "Comparacions vida real"],
            "accio_expressio": ["Informe escrit o gràfic"],
            "compromis": ["Partides curtes (miniatures)"]
        }'::jsonb,
        '{
            "rubrica": {
                "expert": "Identifica correctament illes, cadenes i debilitats subtils. Proposa pla de bloqueig.",
                "avancat": "Identifica illes i peons doblats. Proposa atacar.",
                "aprenent": "Confon peons aïllats amb passats.",
                "novell": "Només compta punts de material."
            }
        }'::jsonb
    )
    RETURNING id INTO v_module_id;

    -- 3. Crear les Lliçons (Les 3 Fases de la SA)
    
    -- Lliçó 1: Motivació i Exploració
    INSERT INTO public.academy_lessons (module_id, title, description, "order", phase_type, content)
    VALUES (
        v_module_id,
        'Illes i Cadenes',
        'Fase 1: Motivació i Exploració. El Ganxo i la investigació inicial.',
        1,
        'motivation',
        '{
            "introduction": "Qui està més segur? Una cadena de 6 peons o 8 peons dispersos?",
            "activities": [
                {
                    "type": "provocacio", 
                    "title": "Menys és Més", 
                    "desc": "Comparativa visual entre Cadenes i Illes. Debat inicial."
                },
                {
                    "type": "rutina_pensament", 
                    "title": "El Pont", 
                    "desc": "Dibuixar línies connectant els peons que es defensen."
                },
                {
                    "type": "investigacio", 
                    "title": "Trencar la Cadena", 
                    "desc": "Identificar el peó base que aguanta l estructura."
                }
            ]
        }'::jsonb
    );

    -- Lliçó 2: Aplicació i Creació
    INSERT INTO public.academy_lessons (module_id, title, description, "order", phase_type, content)
    VALUES (
        v_module_id,
        'Peons Malalts',
        'Fase 2: Aplicació i Creació. El Taller i el treball pràctic.',
        2,
        'application',
        '{
            "introduction": "Diagnostiquem els pacients. Qui necessita medicina?",
            "activities": [
                {
                    "type": "guied_practice", 
                    "title": "L Hospital de Peons", 
                    "desc": "Diagnosticar peons doblats i aïllats amb metàfores mèdiques."
                },
                {
                    "type": "cooperative", 
                    "title": "Atacar el Doblat", 
                    "desc": "Parelles. Un defensa l estructura feble, l altre la bloqueja."
                },
                {
                    "type": "prototyping", 
                    "title": "Esborrany de l Informe", 
                    "desc": "Analitzar una partida clàssica i marcar el moment de la fractura."
                }
            ]
        }'::jsonb
    );

    -- Lliçó 3: Comunicació i Tancament
    INSERT INTO public.academy_lessons (module_id, title, description, "order", phase_type, content)
    VALUES (
        v_module_id,
        'El Peó Endarrerit',
        'Fase 3: Comunicació i Tancament. Lliurament del producte final.',
        3,
        'communication',
        '{
            "introduction": "Presentació de l informe tècnic final.",
            "activities": [
                {
                    "type": "synthesis", 
                    "title": "El Forat", 
                    "desc": "Entendre el concepte de casella forta davant del peó endarrerit."
                },
                {
                    "type": "presentation", 
                    "title": "L Auditoria (Producte Final)", 
                    "desc": "Presentació oral/gràfica del diagnòstic d una posició."
                },
                {
                    "type": "metacognition", 
                    "title": "Diari d Aprenentatge", 
                    "desc": "Reflexió: Què he après sobre les estructures?"
                }
            ]
        }'::jsonb
    );

END $$;
