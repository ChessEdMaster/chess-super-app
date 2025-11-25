import { useState, useCallback } from 'react';
import { Chess, Move } from 'chess.js';

export function useChessGame(initialFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
    const [game, setGame] = useState<Chess>(new Chess(initialFen));
    const [fen, setFen] = useState<string>(initialFen);

    const makeMove = useCallback((moveData: { from: string; to: string; promotion?: string }) => {
        try {
            // CRÍTICO: Sempre treballar sobre una còpia per evitar mutacions d'estat
            const gameCopy = new Chess(game.fen());

            const result = gameCopy.move(moveData);

            if (result) {
                setGame(gameCopy);
                setFen(gameCopy.fen());
                return result;
            }
        } catch (e) {
            // chess.js v1 throws errors for invalid moves
            return null;
        }
        return null;
    }, [game]);

    const setPosition = useCallback((newFen: string) => {
        try {
            const newGame = new Chess(newFen);
            setGame(newGame);
            setFen(newFen);
        } catch (e) {
            console.error("Invalid FEN:", newFen);
        }
    }, []);

    const resetGame = useCallback(() => {
        const newGame = new Chess();
        setGame(newGame);
        setFen(newGame.fen());
    }, []);

    return {
        game,
        fen,
        makeMove,
        setPosition,
        resetGame,
        setGame // Exposem setGame per a casos avançats si cal
    };
}
