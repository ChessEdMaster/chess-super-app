// @ts-nocheck
const fs = require('fs');
const path = require('path');

// User provided example for Level 1 Lesson 1
const level1Lesson1 = {
  meta: {
    level: 1,
    lesson_number: 1,
    title: "El Tablero: Nuestro Campo de Batalla",
    concept_summary: "Conocer la estructura del tablero (filas, columnas, diagonales) y su correcta orientación."
  },
  online_content: {
    video_script: {
      intro: "¡Bienvenido, estratega! Antes de conocer a tu ejército, necesitas entender el terreno donde lucharás. Imagina que vas a construir un castillo; el tablero son los cimientos. Sin ellos, ¡todo se derrumba!",
      key_concepts: [
        "El tablero tiene 64 casillas alternas: claras (blancas) y oscuras (negras). Es como un piso de baldosas.",
        "Regla de oro de la orientación: 'La casilla blanca siempre a la derecha'. Si ves una casilla negra en tu esquina inferior derecha, el tablero está mal colocado.",
        "Tenemos 'Filas' (los números, van de lado a lado) y 'Columnas' (las letras, van de arriba a abajo). Juntas forman la dirección de cada casilla."
      ],
      outro: "Ahora que tienes el mapa en tus manos y el tablero bien orientado, estamos listos para colocar las piezas. ¡Asegúrate de que la luz (casilla blanca) esté a tu derecha!"
    },
    pgn_examples: [
      {
        id: 1,
        description: "Tablero vacío mostrando la orientación correcta.",
        visual_cues: "Resaltar en VERDE la casilla h1 y a8. Flecha indicando la esquina inferior derecha del jugador."
      },
      {
        id: 2,
        description: "Diferenciación entre Fila, Columna y Diagonal.",
        visual_cues: "Colorear toda la columna 'e' de azul, toda la fila '4' de rojo y la gran diagonal a1-h8 de amarillo."
      }
    ],
    pgn_exercises_interactive: [
      {
        id: 1,
        instruction: "Haz clic en cualquier casilla que pertenezca a una COLUMNA.",
        setup_description: "Tablero vacío resaltando una columna vertical (ej. columna d) y una fila horizontal.",
        solution_mechanic: "El usuario debe seleccionar una casilla de la estructura vertical.",
        validation: {
            type: "any_of",
            values: ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"]
        }
      },
      {
        id: 2,
        instruction: "¡Orienta el tablero! Selecciona la esquina correcta para el jugador de las piezas blancas.",
        setup_description: "Se muestran dos casillas de esquina inferior derecha parpadeando: h1 (blanca) y a1 (negra, incorrecta para la perspectiva).",
        solution_mechanic: "Clic en la casilla h1 (Blanca).",
        validation: {
            type: "exact",
            values: ["h1"]
        }
      },
      {
        id: 3,
        instruction: "Encuentra el centro del campo de batalla. Haz clic en las 4 casillas centrales.",
        setup_description: "Tablero vacío.",
        solution_mechanic: "Clic secuencial en d4, d5, e4, e5.",
        validation: {
            type: "sequence",
            values: ["d4", "d5", "e4", "e5"]
        }
      }
    ],
    quiz: [
      {
        question: "¿De qué color debe ser la casilla en la esquina inferior derecha de cada jugador?",
        options: [
          "Negra (Oscura)",
          "Blanca (Clara)",
          "Del color que yo prefiera"
        ],
        correct_option_index: 1
      },
      {
        question: "¿Cuántas casillas tiene un tablero de ajedrez en total?",
        options: [
          "32 casillas",
          "100 casillas",
          "64 casillas"
        ],
        correct_option_index: 2
      },
      {
        question: "¿Cómo se llaman las líneas que van de izquierda a derecha (horizontales)?",
        options: [
          "Filas (Números)",
          "Columnas (Letras)",
          "Diagonales"
        ],
        correct_option_index: 0
      }
    ],
    gamification: {
      badge_name: "Cartógrafo Real",
      badge_emoji: "🗺️",
      badge_description: "Has aprendido a leer el mapa del reino y orientarte correctamente."
    }
  },
  classroom_content: {
    objectives: [
      "Colocar correctamente el tablero físico (casilla blanca a la derecha).",
      "Identificar verbalmente filas (números) y columnas (letras).",
      "Comprender la alternancia de colores."
    ],
    age_adaptation: {
      infant_narrative: "El tablero es el piso del castillo del Rey. Está hecho de chocolate (negro) y vainilla (blanco). Para que el Rey no se tropiece, siempre tiene que tener una baldosa de vainilla en su mano derecha. Las filas son los pisos del edificio y las columnas son las torres del castillo.",
      junior_logic: "El tablero funciona como un plano de coordenadas (X, Y) o como el juego de 'Hundir la flota'. Las Columnas son calles con nombre (letras) y las Filas son las alturas de los edificios (números). La casilla h1 es el ancla de nuestra orientación.",
      activity_game: {
        title: "El Tablero Gigante (Humano)",
        setup: "Crear un tablero de 4x4 o 8x8 en el suelo usando folios de colores o aros, o usar un tablero mural grande.",
        levels: {
          level_a_basic: "Música suena. Cuando para, el profesor grita '¡Vainilla!' o '¡Chocolate!'. Los alumnos deben saltar al color correcto.",
          level_b_standard: "El profesor grita '¡Columna!' (todos se ponen en fila india vertical) o '¡Fila!' (todos se cogen de las manos horizontalmente).",
          level_c_advanced: "Carrera de coordenadas: El profesor dice 'e4' y el primero en llegar a esa casilla (o señalarla en el mural) gana un punto."
        }
      },
      printables: {
        worksheet_infant_desc: "Dibujo de un tablero vacío donde deben colorear las casillas oscuras para crear el patrón de ajedrez (damero).",
        worksheet_general_desc: "Hoja de 'Batalla Naval': Identificar casillas específicas (ej: dibuja una estrella en e4, un círculo en h8) y corregir tableros mal orientados impresos."
      }
    }
  }
};

function generatePlaceholderLesson(level, i) {
    return {
        meta: {
            level: level,
            lesson_number: i,
            title: `Lección ${i}: Título pendiente`,
            concept_summary: "Resumen pendiente."
        },
        online_content: {
            video_script: {
                intro: "Intro pendiente...",
                key_concepts: ["Concepto 1", "Concepto 2"],
                outro: "Outro pendiente..."
            },
            pgn_examples: [],
            pgn_exercises_interactive: [],
            quiz: [],
            gamification: {
                badge_name: `Medalla Nivel ${level}-${i}`,
                badge_emoji: "🏅",
                badge_description: "Descripción pendiente."
            }
        },
        classroom_content: {
            objectives: ["Objetivo 1"],
            age_adaptation: {
                infant_narrative: "Narrativa infantil...",
                junior_logic: "Lógica junior...",
                activity_game: {
                    title: "Juego de clase",
                    setup: "Setup...",
                    levels: {
                        level_a_basic: "Nivel A",
                        level_b_standard: "Nivel B",
                        level_c_advanced: "Nivel C"
                    }
                },
                printables: {
                    worksheet_infant_desc: "Ficha infantil",
                    worksheet_general_desc: "Ficha general"
                }
            }
        }
    };
}

function generateCourse(level, title, slug, description) {
    const lessons = [];
    for (let i = 1; i <= 30; i++) {
        if (level === 1 && i === 1) {
            lessons.push(level1Lesson1);
        } else {
            lessons.push(generatePlaceholderLesson(level, i));
        }
    }

    return {
        title,
        slug,
        description,
        modules: [
            {
                title: "Módulo Único (30 Clases)",
                order: 1,
                lessons: lessons
            }
        ]
    };
}

const courses = [
    generateCourse(1, "Nivel 1: Iniciación", "level-1-beginners", "De 0 a saber jugar todas las reglas."),
    generateCourse(2, "Nivel 2: Intermedio", "level-2-intermediate", "Táctica y estrategia básica."),
    generateCourse(3, "Nivel 3: Competición", "level-3-competition", "Preparación para torneos y juego avanzado.")
];

const outputDir = path.resolve(__dirname, '../database/courses');

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

courses.forEach(course => {
    const filename = `${course.slug}.json`;
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(course, null, 2));
    console.log(`Generated ${filename}`);
});
