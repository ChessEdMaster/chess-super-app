import { useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';

export const useChessEngine = (initialFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') => {
    // 1. Immutable State for UI Rendering (The FEN string)
    const [fen, setFen] = useState(initialFen);

    // 2. Mutable Ref for Logic (The Engine)
    // We initialize it once.
    const game = useRef(new Chess(initialFen));

    // 3. Memoized Move Function
    const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
        try {
            // Mutate the engine
            const result = game.current.move(move);

            if (result) {
                // FORCE a re-render by updating the primitive string state
                // React 19 Compiler detects this as a valid state change
                setFen(game.current.fen());
                return result;
            }
        } catch (e) {
            // console.warn('Invalid move:', move);
            return null;
        }
        return null;
    }, []);

    // Helper to reset the board
    const resetGame = useCallback((newFen?: string) => {
        const startFen = newFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        game.current = new Chess(startFen);
        setFen(startFen);
    }, []);

    // Helper to set game from FEN (e.g. from external update)
    const setGameFromFen = useCallback((newFen: string) => {
        game.current = new Chess(newFen);
        setFen(newFen);
    }, []);

    return {
        fen,
        makeMove,
        game: game.current,
        resetGame,
        setGameFromFen
    };
};
