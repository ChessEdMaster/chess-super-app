'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useChessEngine } from '@/hooks/use-chess-engine';

interface SmartChessboardProps {
    initialFen?: string;
    onMove?: (fen: string) => void;
    boardOrientation?: 'white' | 'black';
    customArrows?: [string, string, string][];
    customSquareStyles?: Record<string, React.CSSProperties>;
    onSquareClick?: (square: string) => void;
    onSquareRightClick?: (square: string) => void;
    customDarkSquareStyle?: React.CSSProperties;
    customLightSquareStyle?: React.CSSProperties;
    animationDurationInMs?: number;
    onPieceDrop?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
}

export default function SmartChessboard({
    initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    onMove,
    boardOrientation = 'white',
    customArrows,
    customSquareStyles,
    onSquareClick,
    onSquareRightClick,
    customDarkSquareStyle,
    customLightSquareStyle,
    animationDurationInMs = 200,
    onPieceDrop
}: SmartChessboardProps) {

    // 1. SETUP SEGUR: Use custom hook to handle React 19 immutability
    const { fen, makeMove, setGameFromFen, game } = useChessEngine(initialFen);

    // Sincronitzar si initialFen canvia des de fora (ex: reset o undo)
    useEffect(() => {
        if (initialFen && initialFen !== fen) {
            setGameFromFen(initialFen);
        }
    }, [initialFen, setGameFromFen]); // Removed 'fen' from deps to avoid loops, though logic handles it

    // 2. CORRECCIÓ DE L'ERROR DE MOVIMENT (Chess.js v1 vs React)
    // Adaptem la signatura a la que espera react-chessboard
    const internalOnDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string) => {
        if (!targetSquare) return false;

        // Use the hook's makeMove which handles mutation and state update
        const move = makeMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q', // Per defecte promocionem a Dama per simplificar
        });

        // Si arribem aquí, el moviment és legal
        if (move) {
            // Notifiquem al pare si cal (per guardar a DB, etc)
            if (onMove) onMove(game.fen());

            return true; // Retornar true diu a react-chessboard que deixi la peça a la nova casella
        }
        return false;
    }, [makeMove, game, onMove]);

    // 3. PROTECCIÓ CONTRA HIDRATACIÓ (Hydration Mismatch)
    // Ens assegurem que el component només es mostri quan el client està llest
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-full aspect-square bg-gray-100 rounded-lg animate-pulse" />;

    return (
        <div className="w-full max-w-[600px] mx-auto shadow-xl rounded-lg overflow-hidden border-4 border-slate-700">
            <Chessboard
                id="SmartBoard"
                position={fen}
                onPieceDrop={(onPieceDrop as any) || (internalOnDrop as any)}
                boardOrientation={boardOrientation}
                // Personalització visual per fer-ho "Super App"
                customDarkSquareStyle={customDarkSquareStyle || { backgroundColor: '#779954' }}
                customLightSquareStyle={customLightSquareStyle || { backgroundColor: '#e9edcc' }}
                animationDurationInMs={animationDurationInMs}
                customArrows={customArrows}
                customSquareStyles={customSquareStyles}
                onSquareClick={onSquareClick}
                onSquareRightClick={onSquareRightClick}
            />
        </div>
    );
}
