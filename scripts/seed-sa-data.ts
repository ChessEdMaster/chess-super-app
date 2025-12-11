// @ts-nocheck
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase variables (url or service role key).');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('🌱 Seeding Learning Situation (SA) Example...');

    // 1. Create/Update Course
    const courseData = {
        title: '1r ESO: Anatomia de la Posició',
        slug: '1r-eso-anatomia',
        target_grade: '1r ESO',
        description: 'Curs de fonaments estratègics i estructures de peons.',
        track: 'academic',
        difficulty_level: 'Principiant'
    };

    let { data: course, error: courseError } = await supabase
        .from('academy_courses')
        .select('id')
        .eq('slug', courseData.slug)
        .single();

    if (!course) {
        console.log('Creating course...');
        const { data, error } = await supabase.from('academy_courses').insert(courseData).select().single();
        if (error) { console.error(error); process.exit(1); }
        course = data;
    } else {
        console.log('Updating course...');
        const { error } = await supabase.from('academy_courses').update(courseData).eq('id', course.id);
        if (error) console.error(error);
    }

    console.log(`✅ Course ID: ${course.id}`);

    // 2. Create Module (SA)
    const moduleData = {
        course_id: course.id,
        title: 'Arquitectes del Tauler: Per què cauen els edificis?',
        description: "Imagina que ets un arquitecte i t'encarreguen reformar un edifici que té esquerdes. Si l'estructura cau, la partida es perd.",
        icon: 'castle',
        level: 'Principiant',
        order: 1,
        // SA Metadata
        duration: '3 Sessions',
        context_description: "Imagina que ets un arquitecte i t'encarreguen reformar un edifici que té esquerdes. En els escacs, els peons són les parets i les columnes de la teva posició.",
        challenge_description: "Com podem diagnosticar la 'salut' d'una posició només mirant els peons, sense calcular cap variant tàctica?",
        final_product: "L'Informe Tècnic d'Estructures: Analitzar una posició i marcar debilitats (vermell) i fortaleses (verd).",
        transversal_vectors: ['Pensament Crític', 'Benestar Emocional'],
        competencies: {
            "CE1": "Anàlisi: Identificar patrons estructurals i relacionar-los amb plans estratègics.",
            "CE2": "Comunicació: Utilitzar vocabulari tècnic per argumentar una valoració."
        },
        knowledge_topics: ['Estructures de peons (Cadenes vs Illes)', 'Debilitats (doblats, aïllats, endarrerits)', 'Tècnica de bloqueig'],
        learning_objective: "Analitzar (Capacitat) l'estructura de peons d'una posició (Saber) per elaborar un pla estratègic que ataqui les debilitats del rival (Finalitat).",
        dua_guidelines: {
            "representacio": ["Colors sobre el tauler", "Comparacions vida real"],
            "accio_expressio": ["Informe escrit o gràfic"],
            "compromis": ["Partides curtes (miniatures)"]
        },
        evaluation_criteria: {
            "rubrica": {
                "expert": "Identifica correctament illes, cadenes i debilitats subtils. Proposa pla de bloqueig.",
                "avancat": "Identifica illes i peons doblats. Proposa atacar.",
                "aprenent": "Confon peons aïllats amb passats.",
                "novell": "Només compta punts de material."
            }
        }
    };

    // Remove existing module with same title to avoid duplicates/mess
    await supabase.from('academy_modules').delete().eq('title', moduleData.title);

    const { data: module, error: moduleError } = await supabase
        .from('academy_modules')
        .insert(moduleData)
        .select()
        .single();

    if (moduleError) {
        console.error('Error creating module:', moduleError);
        process.exit(1);
    }

    console.log(`✅ Module SA Created: ${module.id}`);

    // 3. Create Lessons
    const lessonsData = [
        {
            module_id: module.id,
            title: 'Illes i Cadenes',
            description: 'Fase 1: Motivació i Exploració. El Ganxo i la investigació inicial.',
            order: 1,
            phase_type: 'motivation',
            difficulty: 1,
            content: {
                introduction: "Qui està més segur? Una cadena de 6 peons o 8 peons dispersos?",
                activities: [
                    {
                        type: "provocacio",
                        title: "Menys és Més",
                        "desc": "Comparativa visual entre Cadenes i Illes. Debat inicial."
                    },
                    {
                        type: "rutina_pensament",
                        title: "El Pont",
                        "desc": "Dibuixar línies connectant els peons que es defensen."
                    }
                ]
            }
        },
        {
            module_id: module.id,
            title: 'Peons Malalts',
            description: 'Fase 2: Aplicació i Creació. El Taller i el treball pràctic.',
            order: 2,
            phase_type: 'application',
            difficulty: 2,
            content: {
                introduction: "Diagnostiquem els pacients. Qui necessita medicina?",
                activities: [
                    {
                        type: "guied_practice",
                        title: "L Hospital de Peons",
                        "desc": "Diagnosticar peons doblats i aïllats amb metàfores mèdiques."
                    },
                    {
                        type: "cooperative",
                        title: "Atacar el Doblat",
                        "desc": "Parelles. Un defensa l estructura feble, l altre la bloqueja."
                    }
                ]
            }
        },
        {
            module_id: module.id,
            title: 'El Peó Endarrerit',
            description: 'Fase 3: Comunicació i Tancament. Lliurament del producte final.',
            order: 3,
            phase_type: 'communication',
            difficulty: 3,
            content: {
                introduction: "Presentació de l informe tècnic final.",
                activities: [
                    {
                        type: "synthesis",
                        title: "El Forat",
                        "desc": "Entendre el concepte de casella forta davant del peó endarrerit."
                    },
                    {
                        type: "presentation",
                        title: "L Auditoria (Producte Final)",
                        "desc": "Presentació oral/gràfica del diagnòstic d una posició."
                    }
                ]
            }
        }
    ];

    const { error: lessonsError } = await supabase.from('academy_lessons').insert(lessonsData);
    if (lessonsError) {
        console.error('Error creating lessons:', lessonsError);
        process.exit(1);
    }

    console.log('✅ Lessons Created!');
    console.log('🎉 Seeding Complete!');
}

seed();
