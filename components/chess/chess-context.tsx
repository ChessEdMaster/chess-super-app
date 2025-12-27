import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { useStockfish, Evaluation as EngineEvaluation, EngineLine } from '@/hooks/use-stockfish';
import { toast } from 'sonner';
import { PGNTree } from '@/lib/pgn/tree';
import { MoveNode, Annotation, Variation, NAGSymbol, Evaluation } from '@/types/pgn';

interface ChessContextType {
    // Game State
    game: Chess;
    fen: string;
    orientation: 'white' | 'black';
    setOrientation: (o: 'white' | 'black') => void;

    // Tree State
    tree: PGNTree;
    currentNode: MoveNode | null;
    mainLine: MoveNode[];

    // Actions
    makeMove: (from: string, to: string, promotion?: string) => boolean;
    setGameFromFen: (fen: string) => void;
    importPGN: (pgn: string) => void;
    resetGame: () => void;
    undo: () => void;
    redo: () => void;

    // Navigation
    currentHistoryIndex: number;
    goToMove: (index: number) => void;
    goToNode: (node: MoveNode | null) => void;

    // Annotations
    addComment: (text: string, position?: 'before' | 'after') => void;
    updateComment: (index: number, text: string) => void;
    removeComment: (index: number) => void;
    toggleNAG: (nag: NAGSymbol) => void;
    setEvaluation: (evaluation: Evaluation | undefined) => void;

    // Engine
    isEvaluating: boolean;
    evaluation: EngineEvaluation | null;
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
    // Core PGN Tree (Source of truth)
    const [tree, setTree] = useState(() => new PGNTree(initialFen));
    const [revision, setRevision] = useState(0); // Trigger re-renders on tree changes

    // Memoized derivatives
    const game = useMemo(() => tree['chess'], [tree, revision]);
    const fen = useMemo(() => tree.getCurrentFen(), [tree, revision]);
    const currentNode = useMemo(() => tree.getCurrentNode(), [tree, revision]);
    const mainLine = useMemo(() => tree.getMainLine(), [tree, revision]);

    const [orientation, setOrientation] = useState<'white' | 'black'>('white');

    // Engine State
    const [engineEnabled, setEngineEnabled] = useState(false);
    const [engineEvaluation, setEngineEvaluation] = useState<EngineEvaluation | null>(null);
    const [lines, setLines] = useState<EngineLine[]>([]);

    // Stockfish Hook
    const { startAnalysis, stopAnalysis, isAnalyzing } = useStockfish({
        depth: 15, // Alpha limit for better battery/performance on tablets
        multipv: 1, // Focus on single best move
        onEval: setEngineEvaluation,
        onLines: (newLines) => {
            setLines(prev => {
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

    // Reset analysis when FEN changes
    useEffect(() => {
        if (engineEnabled) {
            startAnalysis(fen);
        } else {
            stopAnalysis();
            setEngineEvaluation(null);
            setLines([]);
        }
    }, [engineEnabled, fen, startAnalysis, stopAnalysis]);

    const triggerUpdate = useCallback(() => setRevision(r => r + 1), []);

    const makeMove = useCallback((from: string, to: string, promotion: string = 'q') => {
        const gameCopy = new Chess(fen);
        try {
            const result = gameCopy.move({ from, to, promotion });
            if (result) {
                // If the move already exists from this position, just navigate to it
                // Otherwise, add it. PGNTree.addMove doesn't automatically check for duplicates in variations...
                // Actually PGNTree.addMove always adds a new node.
                // We should check if this move is already a continuation or variation.

                // For now, let's keep it simple: add it as a move.
                // If it's the same move as the mainline continuation, we might want to just go forward.

                tree.addMove(result.san);
                triggerUpdate();
                return true;
            }
        } catch (e) {
            console.error("Move failed", e);
        }
        return false;
    }, [fen, tree, triggerUpdate]);

    const setGameFromFen = useCallback((newFen: string) => {
        try {
            const newTree = new PGNTree(newFen);
            setTree(newTree);
            triggerUpdate();
        } catch (e) {
            toast.error("Invalid FEN string");
        }
    }, [triggerUpdate]);

    const importPGN = useCallback((pgn: string) => {
        try {
            const { PGNParser } = require('@/lib/pgn/parser');
            const newTree = PGNParser.parse(pgn);
            setTree(newTree);
            triggerUpdate();
            toast.success("PGN carregat correctament");
        } catch (e) {
            console.error("PGN Import error:", e);
            toast.error("Error al carregar el PGN");
        }
    }, [triggerUpdate]);

    const resetGame = useCallback(() => {
        setGameFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }, [setGameFromFen]);

    const undo = useCallback(() => {
        tree.goBack();
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const redo = useCallback(() => {
        tree.goForward();
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const goToNode = useCallback((node: MoveNode | null) => {
        tree.goToNode(node);
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const goToMove = useCallback((index: number) => {
        // Compatibility for linear history
        const moves = tree.getMainLine();
        if (index === -1) {
            tree.goToNode(null);
        } else if (index >= 0 && index < moves.length) {
            tree.goToNode(moves[index]);
        }
        triggerUpdate();
    }, [tree, triggerUpdate]);

    // Annotation Actions
    const addComment = useCallback((text: string, position: 'before' | 'after' = 'after') => {
        tree.addComment(text, position);
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const updateComment = useCallback((index: number, text: string) => {
        tree.updateComment(index, text);
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const removeComment = useCallback((index: number) => {
        tree.removeComment(index);
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const toggleNAG = useCallback((nag: NAGSymbol) => {
        const node = tree.getCurrentNode();
        if (!node) return;
        if (node.annotation.nags.includes(nag)) {
            tree.removeNAG(nag);
        } else {
            tree.addNAG(nag);
        }
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const setEvaluation = useCallback((evaluation: Evaluation | undefined) => {
        if (evaluation) {
            tree.setEvaluation(evaluation);
        } else {
            // Remove evaluation (not explicitly in PGNTree, but we can set it to undefined)
            const node = tree.getCurrentNode();
            if (node) node.annotation.evaluation = undefined;
        }
        triggerUpdate();
    }, [tree, triggerUpdate]);

    const toggleEngine = useCallback((active: boolean) => {
        setEngineEnabled(active);
    }, []);

    return (
        <ChessContext.Provider value={{
            game,
            fen,
            orientation,
            setOrientation,
            tree,
            currentNode,
            mainLine,
            makeMove,
            setGameFromFen,
            importPGN,
            resetGame,
            undo,
            redo,
            currentHistoryIndex: mainLine.indexOf(currentNode as any),
            goToMove,
            goToNode,
            addComment,
            updateComment,
            removeComment,
            toggleNAG,
            setEvaluation,
            isEvaluating: isAnalyzing,
            evaluation: engineEvaluation,
            lines,
            toggleEngine,
            engineEnabled
        }}>
            {children}
        </ChessContext.Provider>
    );
}
