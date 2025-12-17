/**
 * PGN Types and Interfaces
 * Comprehensive type definitions for PGN tree structure with variations and annotations
 */

// Numeric Annotation Glyphs (NAGs) - Standard chess symbols
export enum NAGSymbol {
    // Move quality
    GOOD_MOVE = 1,              // !
    POOR_MOVE = 2,              // ?
    BRILLIANT_MOVE = 3,         // !!
    BLUNDER = 4,                // ??
    INTERESTING_MOVE = 5,       // !?
    DUBIOUS_MOVE = 6,           // ?!
    FORCED_MOVE = 7,            // □

    // Position evaluation
    EQUAL = 10,                 // =
    UNCLEAR = 13,               // ∞
    SLIGHT_ADVANTAGE_WHITE = 14, // ⩲
    SLIGHT_ADVANTAGE_BLACK = 15, // ⩱
    ADVANTAGE_WHITE = 16,       // ±
    ADVANTAGE_BLACK = 17,       // ∓
    WINNING_WHITE = 18,         // +−
    WINNING_BLACK = 19,         // −+

    // Time pressure
    TIME_PRESSURE = 22,         // ⨀

    // Space advantage
    SPACE_ADVANTAGE_WHITE = 26,
    SPACE_ADVANTAGE_BLACK = 27,

    // Initiative
    INITIATIVE_WHITE = 36,
    INITIATIVE_BLACK = 37,

    // Attack
    ATTACK_WHITE = 40,
    ATTACK_BLACK = 41,

    // Compensation
    COMPENSATION_WHITE = 44,
    COMPENSATION_BLACK = 45,

    // Development
    DEVELOPMENT_ADVANTAGE_WHITE = 132,
    DEVELOPMENT_ADVANTAGE_BLACK = 133,

    // Novelty
    NOVELTY = 146,              // N
}

// Map NAG numbers to display symbols
export const NAG_SYMBOLS: Record<number, string> = {
    1: '!',
    2: '?',
    3: '!!',
    4: '??',
    5: '!?',
    6: '?!',
    7: '□',
    10: '=',
    13: '∞',
    14: '⩲',
    15: '⩱',
    16: '±',
    17: '∓',
    18: '+−',
    19: '−+',
    22: '⨀',
    26: '⟳',
    27: '⟲',
    36: '↑',
    37: '↓',
    40: '→',
    41: '←',
    44: '=/∞',
    45: '∞/=',
    132: '⟳',
    133: '⟲',
    146: 'N',
};

// Evaluation type
export interface Evaluation {
    type: 'cp' | 'mate';  // centipawns or mate
    value: number;         // positive = white advantage, negative = black advantage
    depth?: number;        // depth of the evaluation
}

// Visual annotation (arrows and highlights)
export interface VisualAnnotation {
    type: 'arrow' | 'highlight';
    from?: string;  // square (e.g., 'e4')
    to?: string;    // square (e.g., 'e5')
    square?: string; // for highlights
    color: string;   // hex color
}

// Comment annotation
export interface Comment {
    text: string;
    position: 'before' | 'after'; // before or after the move
}

// Video link
export interface VideoLink {
    url: string;
    title?: string;
    startTime?: number; // in seconds
}

// External link
export interface WebLink {
    url: string;
    title: string;
}

// Complete annotation for a move
export interface Annotation {
    comments: Comment[];
    nags: NAGSymbol[];
    evaluation?: Evaluation;
    visualAnnotations: VisualAnnotation[];
    images?: string[]; // URLs to attached images
    videos?: VideoLink[]; // URLs to videos
    links?: WebLink[]; // External links
    presentationSteps?: string[]; // Steps for a presentation/slideshow
    custom?: Record<string, any>; // Custom properties (emojis etc)
    clock?: number; // time in seconds
}

// Logical move in the infinite tree
export interface LogicalMove {
    uci: string;
    san: string;
    weight: number; // 0-1 probability for humans/computers
    evaluation?: Evaluation;
    nextFen: string;
}

// Position in the infinite database
export interface ChessPositionNode {
    fen: string;
    moves: LogicalMove[];
    annotations: Annotation;
    metadata: Record<string, any>;
}

// Complete WorkPGN Data Structure (for JSON storage)
export interface WorkPGNData {
    metadata: PGNMetadata;
    rootPosition: string;
    moves: MoveNode[]; // Serialized moves (mainLine)
    version: number;
}

// Single move node in the tree
export interface MoveNode {
    id: string;                    // unique identifier
    move: string;                  // SAN notation (e.g., 'Nf3')
    fen: string;                   // position after this move
    uci?: string;                  // UCI notation (e.g., 'g1f3')
    annotation: Annotation;        // all annotations for this move
    variations: Variation[];       // alternative moves from parent position
    parent: MoveNode | null;       // parent move
    mainLine: boolean;             // is this part of the main line?
    moveNumber: number;            // full move number
    color: 'w' | 'b';              // who made this move
}

// Variation (alternative line)
export interface Variation {
    id: string;                    // unique identifier
    moves: MoveNode[];             // sequence of moves in this variation
    startingFen: string;           // FEN where variation begins
    comment?: string;              // optional comment for the variation
    isMainLine: boolean;           // is this the main variation?
}

// PGN metadata (headers)
export interface PGNMetadata {
    event?: string;
    site?: string;
    date?: string;
    round?: string;
    white?: string;
    black?: string;
    result?: string;
    whiteElo?: string;
    blackElo?: string;
    eco?: string;                  // opening code
    opening?: string;              // opening name
    timeControl?: string;
    annotator?: string;
    [key: string]: string | undefined; // allow custom headers
}

// Complete PGN game structure
export interface PGNGame {
    metadata: PGNMetadata;
    rootPosition: string;          // starting FEN (usually standard position)
    mainLine: MoveNode[];          // main variation
    currentNode: MoveNode | null;  // current position in navigation
}

// Navigation path (for tracking position in tree)
export interface NavigationPath {
    nodes: MoveNode[];
    variationIndices: number[];    // which variation was chosen at each branch
}

// Export options
export interface PGNExportOptions {
    includeVariations: boolean;
    includeComments: boolean;
    includeNAGs: boolean;
    includeEvaluations: boolean;
    includeClock: boolean;
    maxLineLength: number;         // wrap lines at this length
    indentVariations: boolean;
    sortVariations: boolean;       // sort by evaluation
}
