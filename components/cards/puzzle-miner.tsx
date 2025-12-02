'use client';

import React, { useState, useEffect } from 'react';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { Chess } from 'chess.js';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

interface PuzzleMinerProps {
    puzzleId: string;
    onComplete: (success: boolean) => void;
    onClose: () => void;
}

// Mock Puzzle Data (In real app, fetch from DB)
const MOCK_PUZZLE = {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
    moves: ['f3e5', 'c6e5'], // Simple capture sequence
    targetFen: 'r1bqkbnr/pppp1ppp/8/4n3/4P3/8/PPPP1PPP/RNBQKB1R w KQkq - 0 4'
};

export function PuzzleMiner({ puzzleId, onComplete, onClose }: PuzzleMinerProps) {
    const [game, setGame] = useState(new Chess(MOCK_PUZZLE.fen));
    const [status, setStatus] = useState<'playing' | 'success' | 'fail'>('playing');
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

    const handleSquareClick = (square: string) => {
        if (status !== 'playing') return;

        // If no square selected, select it
        if (!selectedSquare) {
            const piece = game.get(square as any);
            if (piece && piece.color === game.turn()) {
                setSelectedSquare(square);
            }
            return;
        }

        // If square selected, try to move
        try {
            const move = { from: selectedSquare, to: square, promotion: 'q' };
            const result = game.move(move);

            if (result) {
                setGame(new Chess(game.fen()));
                setSelectedSquare(null);

                if (result.captured) {
                    setStatus('success');
                    setTimeout(() => onComplete(true), 1500);
                }
            } else {
                // If invalid move, but clicked on own piece, change selection
                const piece = game.get(square as any);
                if (piece && piece.color === game.turn()) {
                    setSelectedSquare(square);
                } else {
                    setSelectedSquare(null);
                }
            }
        } catch (e) {
            setSelectedSquare(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-700 shadow-2xl relative">

                {/* Header */}
                <div className="bg-zinc-800 p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold uppercase tracking-wider">Mining...</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white">Close</button>
                </div>

                {/* Board */}
                <div className="aspect-square w-full relative">
                    <Chessboard2D
                        fen={game.fen()}
                        orientation="white"
                        onSquareClick={handleSquareClick}
                        customSquareStyles={selectedSquare ? { [selectedSquare]: { background: 'rgba(255, 255, 0, 0.5)' } } : {}}
                    />

                    {/* Feedback Overlay */}
                    {status !== 'playing' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                        >
                            {status === 'success' ? (
                                <div className="flex flex-col items-center text-green-500">
                                    <CheckCircle size={64} />
                                    <span className="font-black text-2xl uppercase mt-2">Success!</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-red-500">
                                    <XCircle size={64} />
                                    <span className="font-black text-2xl uppercase mt-2">Failed</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 text-center">
                    <p className="text-zinc-400 text-sm mb-4">Find the best move to extract resources!</p>
                </div>
            </div>
        </div>
    );
}
