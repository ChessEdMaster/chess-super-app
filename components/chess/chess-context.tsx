'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { useStockfish, Evaluation, EngineLine } from '@/hooks/use-stockfish';
import { toast } from 'sonner';

interface ChessContextType {
    // Game State
    game: Chess;
    fen: string;
    orientation: 'white' | 'black';
    setOrientation: (o: 'white' | 'black') => void;

    // Actions
    makeMove: (from: string, to: string, promotion?: string) => boolean;
    setGameFromFen: (fen: string) => void;
    resetGame: () => void;
    undo: () => void;
    redo: () => void;

    // History
    history: string[]; // FEN history
    currentHistoryIndex: number;
    goToMove: (index: number) => void;

    // Engine
    isEvaluating: boolean;
    evaluation: Evaluation | null;
    lines: EngineLine[];
    toggleEngine: (active: boolean) => void;
    engineEnabled: boolean;
}

const ChessContext = createContext<ChessContextType | null>(null);

export function useChess() {
    const context = useContext(ChessContext);
    if (!context) throw new Error("useChess must be used within a ChessProvider");
    return context;
}

interface ChessProviderProps {
    children: React.ReactNode;
    initialFen?: string;
}

export function ChessProvider({ children, initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }: ChessProviderProps) {
    // Core Game State
    const [game, setGame] = useState(() => new Chess(initialFen));
    const [fen, setFen] = useState(initialFen);
    const [orientation, setOrientation] = useState<'white' | 'black'>('white');

    // History State
    const [history, setHistory] = useState<string[]>([initialFen]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

    // Engine State
    const [engineEnabled, setEngineEnabled] = useState(false);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [lines, setLines] = useState<EngineLine[]>([]);

    // Engine Hook
    const { startAnalysis, stopAnalysis, isAnalyzing } = useStockfish({
        depth: 20,
        multipv: 3, // Default to 3 lines
        onEval: setEvaluation,
        onLines: (newLines) => {
            setLines(prev => {
                // Merge lines logic: update existing ID or append
                const updated = [...prev];
                newLines.forEach(line => {
                    const idx = updated.findIndex(l => l.id === line.id);
                    if (idx >= 0) updated[idx] = line;
                    else updated.push(line);
                });
                return updated.sort((a, b) => a.id - b.id);
            });
        }
    });

    // ENGINE EFFECTS
    useEffect(() => {
        if (engineEnabled) {
            startAnalysis(fen);
        } else {
            stopAnalysis();
            setEvaluation(null);
            setLines([]);
        }
    }, [engineEnabled, fen, startAnalysis, stopAnalysis]);

    const updateGameState = useCallback((newGame: Chess) => {
        const newFen = newGame.fen();
        setGame(newGame);
        setFen(newFen);

        // Update History
        // If we are in the middle of history and make a move, we overwrite the future
        const newHistory = [...history.slice(0, currentHistoryIndex + 1), newFen];
        setHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    }, [history, currentHistoryIndex]);

    const makeMove = useCallback((from: string, to: string, promotion: string = 'q') => {
        const gameCopy = new Chess(fen);
        try {
            const result = gameCopy.move({ from, to, promotion });
            if (result) {
                updateGameState(gameCopy);

                // Sound Effects (Placeholder)
                // const audio = new Audio(result.capture ? '/sounds/capture.mp3' : '/sounds/move.mp3');
                // audio.play();

                return true;
            }
        } catch (e) {
            console.error("Move failed", e);
        }
        return false;
    }, [fen, updateGameState]);

    const setGameFromFen = useCallback((newFen: string) => {
        try {
            const newGame = new Chess(newFen);
            setGame(newGame);
            setFen(newFen);
            // Reset history when manually setting FEN (New Chapter)
            setHistory([newFen]);
            setCurrentHistoryIndex(0);
        } catch (e) {
            toast.error("Invalid FEN string");
        }
    }, []);

    const resetGame = useCallback(() => {
        setGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }, [setGameFromFen]);

    const undo = useCallback(() => {
        if (currentHistoryIndex > 0) {
            goToMove(currentHistoryIndex - 1);
        }
    }, [currentHistoryIndex]);

    const redo = useCallback(() => {
        if (currentHistoryIndex < history.length - 1) {
            goToMove(currentHistoryIndex + 1);
        }
    }, [currentHistoryIndex, history.length]);

    const goToMove = useCallback((index: number) => {
        if (index >= 0 && index < history.length) {
            const targetFen = history[index];
            try {
                const newGame = new Chess(targetFen);
                setGame(newGame);
                setFen(targetFen);
                setCurrentHistoryIndex(index);
            } catch (e) {
                console.error("History corruption", e);
            }
        }
    }, [history]);

    const toggleEngine = useCallback((active: boolean) => {
        setEngineEnabled(active);
    }, []);

    return (
        <ChessContext.Provider value={{
            game,
            fen,
            orientation,
            setOrientation,
            makeMove,
            setGameFromFen,
            resetGame,
            undo,
            redo,
            history,
            currentHistoryIndex,
            goToMove,
            isEvaluating: isAnalyzing,
            evaluation,
            lines,
            toggleEngine,
            engineEnabled
        }}>
            {children}
        </ChessContext.Provider>
    );
}
