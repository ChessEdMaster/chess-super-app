// ============================================
// INITIAL DATA FOR CHESS ACADEMY
// This file contains the initial modules, lessons, exercises, and achievements
// ============================================

import {
    AcademyModule,
    AcademyLesson,
    AcademyExercise,
    AcademyAchievement
} from './academy-types';

// ============================================
// MODULES
// ============================================

export const INITIAL_MODULES: Omit<AcademyModule, 'id' | 'created_at'>[] = [
    {
        title: "Fonaments",
        description: "Aprèn com es mouen les peces i les regles bàsiques.",
        icon: "BookOpen",
        level: "Principiant",
        order: 1
    },
    {
        title: "Tàctica Bàsica",
        description: "Descobreix els patrons com la clavada, l'atac doble i l'enfilada.",
        icon: "Puzzle",
        level: "Intermedi",
        order: 2
    },
    {
        title: "Finals Essencials",
        description: "Com guanyar quan queden poques peces al tauler.",
        icon: "GraduationCap",
        level: "Avançat",
        order: 3
    },
    {
        title: "Estratègia",
        description: "Aprèn a planificar i executar plans a llarg termini.",
        icon: "Target",
        level: "Intermedi",
        order: 4
    }
];

// ============================================
// LESSONS - FONAMENTS
// ============================================

export const FUNDAMENTALS_LESSONS: Omit<AcademyLesson, 'id' | 'module_id' | 'created_at'>[] = [
    {
        title: "Moviment del Peó",
        description: "Aprèn com es mou el peó, la peça més nombrosa del tauler.",
        order: 1,
        difficulty: 1,
        content: {
            introduction: "El peó és la peça més bàsica però molt important. Es mou cap endavant i captura en diagonal.",
            steps: [
                {
                    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    instruction: "Mou el peó de e2 una casella endavant a e3",
                    correctMoves: ["e2e3"],
                    explanation: "Correcte! El peó pot moure's una casella endavant."
                },
                {
                    fen: "rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
                    instruction: "Ara mou el peó de d2 dues caselles endavant a d4",
                    correctMoves: ["d2d4"],
                    explanation: "Excel·lent! En el seu primer moviment, el peó pot avançar dues caselles."
                },
                {
                    fen: "rnbqkbnr/ppp1pppp/8/3p4/3P4/4P3/PPP2PPP/RNBQKBNR w KQkq - 0 2",
                    instruction: "Captura el peó negre de d5 amb el teu peó de e3",
                    correctMoves: ["e3d4"],
                    explanation: "Perfecte! Els peons capturen en diagonal, una casella endavant."
                }
            ],
            conclusion: "Has après els moviments bàsics del peó. Recorda: endavant per moure, diagonal per capturar!"
        }
    },
    {
        title: "Moviment del Cavall",
        description: "El cavall té un moviment únic en forma de L.",
        order: 2,
        difficulty: 1,
        content: {
            introduction: "El cavall és l'única peça que pot saltar sobre altres peces. Es mou en forma de L.",
            steps: [
                {
                    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    instruction: "Mou el cavall de g1 a f3",
                    correctMoves: ["g1f3"],
                    explanation: "Correcte! El cavall es mou en forma de L: 2 caselles en una direcció i 1 perpendicular."
                },
                {
                    fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 1",
                    instruction: "Mou el cavall de b1 a c3",
                    correctMoves: ["b1c3"],
                    explanation: "Excel·lent! El cavall pot saltar sobre els peons."
                },
                {
                    fen: "rnbqkb1r/pppppppp/5n2/8/8/2N2N2/PPPPPPPP/R1BQKB1R w KQkq - 0 2",
                    instruction: "Mou el cavall de f3 a e5, atacant el cavall negre",
                    correctMoves: ["f3e5"],
                    explanation: "Perfecte! Els cavalls són excel·lents per atacar múltiples peces."
                }
            ],
            conclusion: "El cavall és una peça tàctica molt poderosa. Practica el seu moviment en L!"
        }
    },
    {
        title: "Moviment de l'Alfil",
        description: "L'alfil es mou en diagonal qualsevol nombre de caselles.",
        order: 3,
        difficulty: 1,
        content: {
            introduction: "L'alfil es mou en diagonal. Cada alfil sempre es queda al mateix color de caselles.",
            steps: [
                {
                    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
                    instruction: "Mou el peó de e2 a e4 per alliberar l'alfil",
                    correctMoves: ["e2e4"],
                    explanation: "Bé! Primer hem d'obrir línies per als alfils."
                },
                {
                    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
                    instruction: "Ara mou l'alfil de f1 a c4",
                    correctMoves: ["f1c4"],
                    explanation: "Excel·lent! L'alfil es mou en diagonal qualsevol nombre de caselles."
                },
                {
                    fen: "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 2",
                    instruction: "Captura el peó de f7 amb l'alfil (escac!)",
                    correctMoves: ["c4f7"],
                    explanation: "Perfecte! Aquest és un atac tàctic comú anomenat 'Escac del Pastor'."
                }
            ],
            conclusion: "Els alfils són poderosos en diagonals obertes. Intenta controlar les diagonals llargues!"
        }
    },
    {
        title: "Moviment de la Torre",
        description: "La torre es mou en línies rectes horitzontals i verticals.",
        order: 4,
        difficulty: 1,
        content: {
            introduction: "La torre és una peça poderosa que controla files i columnes.",
            steps: [
                {
                    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
                    instruction: "Mou la torre de h1 a f1",
                    correctMoves: ["h1f1"],
                    explanation: "Correcte! La torre es mou horitzontalment per la primera fila."
                },
                {
                    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5",
                    instruction: "Mou la torre de a1 a e1",
                    correctMoves: ["a1e1"],
                    explanation: "Excel·lent! Les torres són molt efectives en columnes obertes."
                }
            ],
            conclusion: "Les torres són més fortes en files i columnes obertes. Intenta activar-les aviat!"
        }
    },
    {
        title: "Moviment de la Dama i el Rei",
        description: "La dama és la peça més poderosa. El rei és la més important.",
        order: 5,
        difficulty: 2,
        content: {
            introduction: "La dama combina el poder de la torre i l'alfil. El rei es mou una casella en qualsevol direcció.",
            steps: [
                {
                    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
                    instruction: "Mou la dama de d1 a h5, atacant el peó de e5",
                    correctMoves: ["d1h5"],
                    explanation: "Correcte! La dama pot moure's com una torre o un alfil."
                },
                {
                    fen: "rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 2",
                    instruction: "Captura el peó de e5 amb la dama (escac!)",
                    correctMoves: ["h5e5"],
                    explanation: "Excel·lent! La dama és la peça més versàtil del tauler."
                }
            ],
            conclusion: "La dama és poderosa però valuosa. No la perdis! El rei sempre ha d'estar protegit."
        }
    }
];

// ============================================
// LESSONS - TÀCTICA BÀSICA
// ============================================

export const TACTICS_LESSONS: Omit<AcademyLesson, 'id' | 'module_id' | 'created_at'>[] = [
    {
        title: "La Clavada",
        description: "Aprèn a immobilitzar peces enemigues.",
        order: 1,
        difficulty: 2,
        content: {
            introduction: "Una clavada succeeix quan una peça no pot moure's sense exposar una peça més valuosa.",
            steps: [
                {
                    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
                    instruction: "Mou l'alfil de c1 a g5, clavant el cavall a la dama",
                    correctMoves: ["c1g5"],
                    explanation: "Perfecte! El cavall de f6 està clavat: no pot moure's sense perdre la dama."
                }
            ],
            conclusion: "Les clavades són una tàctica molt poderosa. Busca oportunitats per clavar peces!"
        }
    },
    {
        title: "L'Atac Doble (Fork)",
        description: "Ataca dues peces alhora amb una sola peça.",
        order: 2,
        difficulty: 2,
        content: {
            introduction: "Un atac doble succeeix quan una peça ataca dues o més peces enemigues simultàniament.",
            steps: [
                {
                    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4",
                    instruction: "Mou el cavall de f3 a g5, atacant f7 i h7",
                    correctMoves: ["f3g5"],
                    explanation: "Excel·lent! El cavall ataca dos peons alhora. Aquest és un atac doble clàssic."
                }
            ],
            conclusion: "Els cavalls són especialment bons per fer atacs dobles. Busca forquilles!"
        }
    },
    {
        title: "L'Enfilada (Skewer)",
        description: "Força una peça valuosa a moure's i captura la peça del darrere.",
        order: 3,
        difficulty: 2,
        content: {
            introduction: "Una enfilada és l'oposat d'una clavada: forces una peça valuosa a moure's.",
            steps: [
                {
                    fen: "4k3/8/8/8/8/8/4R3/4K3 w - - 0 1",
                    instruction: "Mou la torre de e2 a e8, donant escac i enfilant el rei",
                    correctMoves: ["e2e8"],
                    explanation: "Perfecte! El rei ha de moure's, i després pots capturar qualsevol peça que estigui darrere."
                }
            ],
            conclusion: "Les enfilades són devastadores contra peces valuoses. Busca-les amb torres i alfils!"
        }
    }
];

// ============================================
// LESSONS - FINALS
// ============================================

export const ENDGAME_LESSONS: Omit<AcademyLesson, 'id' | 'module_id' | 'created_at'>[] = [
    {
        title: "Mat amb Dues Torres",
        description: "Aprèn la tècnica bàsica per fer mat amb dues torres.",
        order: 1,
        difficulty: 2,
        content: {
            introduction: "Amb dues torres, pots fer escac i mat forçant el rei enemic cap a la vora del tauler.",
            steps: [
                {
                    fen: "4k3/8/8/8/8/8/R7/R3K3 w - - 0 1",
                    instruction: "Mou la torre de a2 a a8, donant escac",
                    correctMoves: ["a2a8"],
                    explanation: "Correcte! Forces el rei a moure's cap a la vora."
                },
                {
                    fen: "R3k3/8/8/8/8/8/8/R3K3 w - - 0 2",
                    instruction: "Ara mou la torre de a1 a b1, tallant la sortida del rei",
                    correctMoves: ["a1b1"],
                    explanation: "Excel·lent! Aquesta és la tècnica de l'escala: una torre dona escac, l'altra talla."
                }
            ],
            conclusion: "Practica aquesta tècnica fins que la dominis. És un final essencial!"
        }
    },
    {
        title: "Mat amb Dama i Rei",
        description: "Com fer mat amb dama contra rei solitari.",
        order: 2,
        difficulty: 2,
        content: {
            introduction: "La dama i el rei poden fer mat fàcilment contra un rei solitari.",
            steps: [
                {
                    fen: "4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1",
                    instruction: "Mou la dama a e7, reduint l'espai del rei negre",
                    correctMoves: ["e2e7"],
                    explanation: "Correcte! La dama talla files i columnes, reduint l'espai del rei."
                }
            ],
            conclusion: "Amb la dama, pots fer mat en poques jugades. Practica per fer-ho ràpidament!"
        }
    }
];

// ============================================
// EXERCISES - TACTICAL PUZZLES
// ============================================

export const INITIAL_EXERCISES: Omit<AcademyExercise, 'id' | 'created_at'>[] = [
    // EASY PUZZLES
    {
        title: "Fork Bàsic",
        description: "Troba l'atac doble amb el cavall",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
        solution: ["f3g5"],
        difficulty: "easy",
        tags: ["fork", "knight"],
        rating: 800
    },
    {
        title: "Clavada Simple",
        description: "Clava el cavall a la dama",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
        solution: ["c1g5"],
        difficulty: "easy",
        tags: ["pin", "bishop"],
        rating: 850
    },
    {
        title: "Mat en 1 - Escac del Pastor",
        description: "Troba el mat en una jugada",
        fen: "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 0 3",
        solution: ["d1h5", "h5f7"],
        difficulty: "easy",
        tags: ["checkmate", "queen"],
        rating: 700
    },

    // MEDIUM PUZZLES
    {
        title: "Atac Doble de Torre",
        description: "La torre pot atacar dues peces",
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 6",
        solution: ["f1e1"],
        difficulty: "medium",
        tags: ["fork", "rook"],
        rating: 1200
    },
    {
        title: "Enfilada amb Alfil",
        description: "Enfila el rei i la torre",
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 7",
        solution: ["c1g5"],
        difficulty: "medium",
        tags: ["skewer", "bishop"],
        rating: 1300
    },

    // HARD PUZZLES
    {
        title: "Combinació Tàctica",
        description: "Sacrifici i mat forçat",
        fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP1QPPP/RNB2RK1 w kq - 0 8",
        solution: ["c4f7", "e8f7", "e2c4"],
        difficulty: "hard",
        tags: ["sacrifice", "combination"],
        rating: 1600
    }
];

// ============================================
// ACHIEVEMENTS
// ============================================

export const INITIAL_ACHIEVEMENTS: Omit<AcademyAchievement, 'id' | 'created_at'>[] = [
    {
        title: "Primer Pas",
        description: "Completa la teva primera lliçó",
        icon: "Award",
        requirement: { type: "lessons_completed", count: 1 }
    },
    {
        title: "Estudiant Dedicat",
        description: "Completa 5 lliçons",
        icon: "BookOpen",
        requirement: { type: "lessons_completed", count: 5 }
    },
    {
        title: "Mestre dels Fonaments",
        description: "Completa tots els fonaments",
        icon: "GraduationCap",
        requirement: { type: "module_completed", module_id: "fundamentals" }
    },
    {
        title: "Tàctic Brillant",
        description: "Resol 10 exercicis tàctics",
        icon: "Zap",
        requirement: { type: "exercises_solved", count: 10 }
    },
    {
        title: "Perfeccionista",
        description: "Completa una lliçó amb puntuació perfecta",
        icon: "Star",
        requirement: { type: "perfect_lesson" }
    },
    {
        title: "Racha de 7 Dies",
        description: "Estudia durant 7 dies consecutius",
        icon: "Flame",
        requirement: { type: "streak_days", count: 7 }
    },
    {
        title: "Racha de 30 Dies",
        description: "Estudia durant 30 dies consecutius",
        icon: "Trophy",
        requirement: { type: "streak_days", count: 30 }
    },
    {
        title: "Solucionador d'Enigmes",
        description: "Resol 50 exercicis tàctics",
        icon: "Puzzle",
        requirement: { type: "exercises_solved", count: 50 }
    },
    {
        title: "Gran Mestre de l'Acadèmia",
        description: "Completa tots els mòduls",
        icon: "Crown",
        requirement: { type: "lessons_completed", count: 50 }
    }
];
