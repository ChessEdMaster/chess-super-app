import { Chess } from 'chess.js';

export interface SyzygyResponse {
    wdl: number; // Win-Draw-Loss (1=Win, 0=Draw, -1=Loss, etc.)
    dtz: number; // Distance To Zero (moves until pawn move or capture)
    dtm?: number; // Distance To Mate (optional)
    moves: Record<string, {
        wdl: number;
        dtz: number;
        dtm?: number;
    }>;
}

export interface SyzygyMove {
    uci: string;
    san: string | null;
    wdl: number;
    dtz: number;
    dtm?: number;
}

export interface SyzygyResult {
    evaluation: string; // "Win in 54", "Draw", "Loss"
    bestMove: string | null; // UCI format
    wdl: number;
    moves: SyzygyMove[];
}

// L'API només funciona amb 7 peces o menys (incloent reis)
export const canUseSyzygy = (fen: string): boolean => {
    try {
        const chess = new Chess(fen);
        // Comptem les peces (excloent espais i metadades del FEN)
        // fen.split(' ')[0] gets the board part
        // replace(/\//g, '') removes row separators
        // replace(/\d/g, '') removes empty square counts
        const pieceCount = fen.split(' ')[0].replace(/\//g, '').replace(/\d/g, '').length;
        return pieceCount <= 7;
    } catch (e) {
        return false;
    }
};

export const fetchSyzygyData = async (fen: string): Promise<SyzygyResponse | null> => {
    if (!canUseSyzygy(fen)) return null;

    try {
        // Normalitzem el FEN per l'URL
        const encodedFen = encodeURIComponent(fen);
        // Utilitzem el nostre proxy per evitar CORS
        const response = await fetch(`/api/syzygy?fen=${encodedFen}`);

        if (!response.ok) throw new Error('Error fetching tablebase');

        return await response.json();
    } catch (error) {
        console.error("Syzygy API Error:", error);
        return null;
    }
};

// Funció helper per interpretar el WDL per a humans
export const getHumanEval = (wdl: number, dtz: number): string => {
    if (wdl > 0) return `Guany en ${Math.abs(dtz)} (DTZ)`;
    if (wdl < 0) return `Pèrdua en ${Math.abs(dtz)} (DTZ)`;
    return "Taules Teòriques";
};
