'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface SmartChessboardProps {
    initialFen?: string;
    onMove?: (fen: string) => void;
    boardOrientation?: 'white' | 'black';
}

export default function SmartChessboard({
    initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    onMove,
    boardOrientation = 'white'
}: SmartChessboardProps) {

    // 1. SETUP SEGUR: Utilitzem una funció d'inicialització per evitar
    // que el Strict Mode de React 19 creï dues instàncies del joc.
    const [game, setGame] = useState(() => new Chess(initialFen));

    // Estat per forçar el re-renderitzat visual quan l'estat intern canvia
    const [fen, setFen] = useState(initialFen);

    // 2. CORRECCIÓ DE L'ERROR DE MOVIMENT (Chess.js v1 vs React)
    // Adaptem la signatura a la que espera react-chessboard (objecte amb propietats)
    const onDrop = useCallback((args: { sourceSquare: string, targetSquare: string | null }) => {
        const { sourceSquare, targetSquare } = args;

        if (!targetSquare) return false;

        try {
            // Important: Treballem sobre una còpia per no mutar l'estat directament
            // això ajuda a React a detectar els canvis.
            const gameCopy = new Chess(game.fen());

            // A la versió v1 de chess.js, .move() llança una excepció si el moviment és il·legal
            // en lloc de retornar null. Per això necessitem el bloc try/catch.
            const move = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // Per defecte promocionem a Dama per simplificar
            });

            // Si arribem aquí, el moviment és legal
            if (move) {
                setGame(gameCopy);
                setFen(gameCopy.fen());

                // Notifiquem al pare si cal (per guardar a DB, etc)
                if (onMove) onMove(gameCopy.fen());

                return true; // Retornar true diu a react-chessboard que deixi la peça a la nova casella
            }
        } catch (error) {
            // Silenciem l'error de "moviment il·legal" per evitar que l'app peti
            // Opcionalment pots fer un console.log per depurar
            return false; // Retornar false fa que la peça torni a la seva casella original
        }
        return false;
    }, [game, onMove]);

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
                onPieceDrop={onDrop}
                boardOrientation={boardOrientation}
                // Personalització visual per fer-ho "Super App"
                customDarkSquareStyle={{ backgroundColor: '#779954' }}
                customLightSquareStyle={{ backgroundColor: '#e9edcc' }}
                animationDuration={200}
            />
        </div>
    );
}
