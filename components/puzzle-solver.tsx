'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Chess, Square } from 'chess.js';
import {
    CheckCircle,
    XCircle,
    Lightbulb,
    RotateCcw,
    Trophy,
    Clock,
    Target
} from 'lucide-react';
import { AcademyExercise } from '@/lib/academy-types';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { playSound } from '@/lib/sounds';

// CRÍTICO: Dynamic import para evitar problemas de SSR
const ChessScene = dynamic(() => import('@/components/3d/ChessScene'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg" />
});

interface PuzzleSolverProps {
    exercise: AcademyExercise;
    onSolved: (timeSpent: number, attempts: number, hintsUsed: number) => void;
    onSkip?: () => void;
}

export function PuzzleSolver({ exercise, onSolved, onSkip }: PuzzleSolverProps) {
    // CRÍTICO: Inicializar directamente con el FEN del ejercicio
    const [game, setGame] = useState<Chess>(() => {
        if (exercise?.fen) {
            return new Chess(exercise.fen);
        }
        return new Chess();
    });
    const [fen, setFen] = useState(() => {
        if (exercise?.fen) {
            return exercise.fen;
        }
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    });
    const [moveIndex, setMoveIndex] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [startTime] = useState(() => Date.now());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSolved, setIsSolved] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [showHint, setShowHint] = useState(false);

    // Click to move state
    const [moveFrom, setMoveFrom] = useState<string | null>(null);
    const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

    const { boardTheme } = useSettings();
    const theme = BOARD_THEMES[boardTheme];

    const currentTurn = game.turn() === 'w' ? 'white' : 'black';

    // Timer effect
    useEffect(() => {
        if (isSolved) return;

        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, isSolved]);

    // CRÍTICO: Resetear completamente cuando cambia el exercise
    useEffect(() => {
        if (!exercise?.fen) {
            console.warn('PuzzleSolver: exercise.fen no está disponible');
            return;
        }

        try {
            // Crear nueva instancia de Chess con el FEN del puzzle
            const newGame = new Chess(exercise.fen);
            const newFen = newGame.fen();

            // Actualizar estado con nuevas referencias para forzar re-render
            setGame(newGame);
            setFen(newFen);
            setMoveIndex(0);
            setAttempts(0);
            setHintsUsed(0);
            setIsSolved(false);
            setFeedback(null);
            setShowHint(false);
            setElapsedTime(0);
        } catch (error) {
            console.error('Error inicializando puzzle con FEN:', exercise.fen, error);
        }
    }, [exercise?.fen, exercise?.id]);

    const handleMove = (sourceSquare: string, targetSquare: string): boolean => {
        if (isSolved) return false;

        // CRÍTICO: "Copy before Move" pattern
        const gameCopy = new Chess(game.fen());
        const uciMove = `${sourceSquare}${targetSquare}`;
        let result = null;

        try {
            result = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });
        } catch {
            return false;
        }

        if (!result) return false;

        setAttempts(prev => prev + 1);

        const expectedMove = exercise.solution[moveIndex];

        if (uciMove === expectedMove) {
            // Moviment Correcte
            setGame(gameCopy);
            setFen(gameCopy.fen());
            setMoveIndex(prev => prev + 1);
            playSound('move');

            if (moveIndex + 1 >= exercise.solution.length) {
                solvePuzzle();
            } else {
                setFeedback({
                    type: 'success',
                    message: '✅ Correcte! Continua...'
                });

                setTimeout(() => {
                    makeOpponentMove(gameCopy);
                }, 500);
            }

            return true;
        } else {
            // Moviment Incorrecte
            setFeedback({
                type: 'error',
                message: '❌ Aquest no és el moviment correcte. Torna-ho a intentar!'
            });
            playSound('illegal');
            return false;
        }
    };

    function getMoveOptions(square: string) {
        const moves = game.moves({
            square: square as Square,
            verbose: true,
        });
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
        moves.map((move) => {
            const targetPiece = game.get(move.to as Square);
            const sourcePiece = game.get(square as Square);
            const isCapture = targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color;

            newSquares[move.to] = {
                background: isCapture
                    ? 'radial-gradient(circle, rgba(255,0,0,.5) 25%, transparent 25%)'
                    : 'radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)',
                borderRadius: '50%',
            };
            return move;
        });
        newSquares[square] = {
            background: 'rgba(255, 255, 0, 0.4)',
        };
        setOptionSquares(newSquares);
        return true;
    }

    function onSquareClick(square: string) {
        if (isSolved) return;

        // If we have a moveFrom, try to move to the clicked square
        if (moveFrom) {
            // If clicked on the same square, deselect
            if (moveFrom === square) {
                setMoveFrom(null);
                setOptionSquares({});
                return;
            }

            // Attempt move
            const moveResult = handleMove(moveFrom, square);
            if (moveResult) {
                setMoveFrom(null);
                setOptionSquares({});
                return;
            }

            // If move failed, check if we clicked on another piece of our own to select it instead
            const clickedPiece = game.get(square as Square);
            if (clickedPiece && clickedPiece.color === game.turn()) {
                setMoveFrom(square);
                getMoveOptions(square);
                return;
            }

            // Otherwise, just deselect
            setMoveFrom(null);
            setOptionSquares({});
        } else {
            // No piece selected, try to select
            const piece = game.get(square as Square);
            if (piece && piece.color === game.turn()) {
                setMoveFrom(square);
                getMoveOptions(square);
            }
        }
    }

    const makeOpponentMove = (baseGame: Chess) => {
        const nextMoveIndex = moveIndex + 1;
        if (nextMoveIndex < exercise.solution.length) {
            const opponentMove = exercise.solution[nextMoveIndex];
            const from = opponentMove.substring(0, 2);
            const to = opponentMove.substring(2, 4);

            // CRÍTICO: Crear nova còpia per al moviment del rival
            const gameCopy = new Chess(baseGame.fen());

            try {
                const result = gameCopy.move({
                    from,
                    to,
                    promotion: 'q'
                });

                if (result) {
                    setGame(gameCopy);
                    setFen(gameCopy.fen());
                    setMoveIndex(prev => prev + 2);
                    playSound('move');

                    if (nextMoveIndex + 1 >= exercise.solution.length) {
                        setTimeout(() => solvePuzzle(), 500);
                    }
                }
            } catch (error) {
                console.error('Error making opponent move:', error);
            }
        }
    };

    const solvePuzzle = () => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setIsSolved(true);
        setFeedback({
            type: 'success',
            message: '🎉 Puzzle resolt correctament!'
        });
        playSound('game_end');
        onSolved(timeSpent, attempts, hintsUsed);
    };

    const resetPuzzle = () => {
        const newGame = new Chess(exercise.fen);
        setGame(newGame);
        setFen(exercise.fen);
        setMoveIndex(0);
        setFeedback(null);
        setShowHint(false);
    };

    const toggleHint = () => {
        if (!showHint) {
            setHintsUsed(prev => prev + 1);
        }
        setShowHint(!showHint);
    };

    const getHintText = () => {
        if (moveIndex >= exercise.solution.length) return '';

        const nextMove = exercise.solution[moveIndex];
        const from = nextMove.substring(0, 2);

        return `Pista: Busca un moviment des de ${from.toUpperCase()}`;
    };

    const getDifficultyColor = () => {
        switch (exercise.difficulty) {
            case 'easy': return 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30';
            case 'medium': return 'text-amber-400 bg-amber-900/30 border-amber-500/30';
            case 'hard': return 'text-red-400 bg-red-900/30 border-red-500/30';
            default: return 'text-slate-400 bg-slate-900/30 border-slate-500/30';
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            <div className="flex flex-col lg:flex-row gap-6">

                <div className="flex-1">
                    <div className="relative w-full max-w-[600px] aspect-square mx-auto shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
                        <ChessScene
                            key={exercise.id} // CRÍTICO: Força re-render quan canvia l'exercici
                            fen={fen}
                            orientation={currentTurn}
                            onSquareClick={onSquareClick}
                            customSquareStyles={optionSquares}
                        />
                    </div>

                    <div className="mt-4 max-w-[600px] mx-auto flex gap-4">
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
                            <Target className="text-indigo-400" size={20} />
                            <div>
                                <div className="text-xs text-slate-400">Intents</div>
                                <div className="text-lg font-bold text-white">{attempts}</div>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
                            <Clock className="text-amber-400" size={20} />
                            <div>
                                <div className="text-xs text-slate-400">Temps</div>
                                <div className="text-lg font-bold text-white">
                                    {elapsedTime}s
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
                            <Lightbulb className="text-emerald-400" size={20} />
                            <div>
                                <div className="text-xs text-slate-400">Pistes</div>
                                <div className="text-lg font-bold text-white">{hintsUsed}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-4">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    {exercise.title || 'Puzzle Tàctic'}
                                </h2>
                                {exercise.description && (
                                    <p className="text-slate-400 text-sm">{exercise.description}</p>
                                )}
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getDifficultyColor()}`}>
                                {exercise.difficulty === 'easy' ? 'Fàcil' : exercise.difficulty === 'medium' ? 'Mitjà' : 'Difícil'}
                            </span>
                        </div>

                        {exercise.tags && exercise.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {exercise.tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <div className="flex items-center gap-2">
                                <Trophy className="text-amber-400" size={16} />
                                <span className="text-sm text-slate-400">
                                    Rating: <span className="text-white font-bold">{exercise.rating}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <Target className="text-indigo-400 mt-1" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Objectiu
                                </h3>
                                <p className="text-white text-base">
                                    {currentTurn === 'white' ? 'Les blanques' : 'Les negres'} mouen i guanyen.
                                </p>
                                <p className="text-slate-400 text-sm mt-2">
                                    Troba la millor seqüència de moviments.
                                </p>
                            </div>
                        </div>

                        {!isSolved && (
                            <button
                                onClick={toggleHint}
                                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition"
                            >
                                <Lightbulb size={16} />
                                {showHint ? 'Amagar pista' : 'Mostrar pista'}
                            </button>
                        )}

                        {showHint && (
                            <div className="mt-3 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                                <p className="text-sm text-indigo-200">
                                    {getHintText()}
                                </p>
                            </div>
                        )}
                    </div>

                    {feedback && (
                        <div className={`border rounded-xl p-4 ${feedback.type === 'success'
                            ? 'bg-emerald-900/20 border-emerald-500/30'
                            : feedback.type === 'error'
                                ? 'bg-red-900/20 border-red-500/30'
                                : 'bg-blue-900/20 border-blue-500/30'
                            }`}>
                            <div className="flex items-start gap-3">
                                {feedback.type === 'success' ? (
                                    <CheckCircle className="text-emerald-400 mt-0.5" size={20} />
                                ) : feedback.type === 'error' ? (
                                    <XCircle className="text-red-400 mt-0.5" size={20} />
                                ) : (
                                    <Lightbulb className="text-blue-400 mt-0.5" size={20} />
                                )}
                                <p className={`text-sm ${feedback.type === 'success'
                                    ? 'text-emerald-200'
                                    : feedback.type === 'error'
                                        ? 'text-red-200'
                                        : 'text-blue-200'
                                    }`}>
                                    {feedback.message}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={resetPuzzle}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                        >
                            <RotateCcw size={20} />
                            Reiniciar
                        </button>

                        {onSkip && !isSolved && (
                            <button
                                onClick={onSkip}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition"
                            >
                                Saltar
                            </button>
                        )}
                    </div>

                    {isSolved && (
                        <div className="bg-gradient-to-r from-emerald-900/40 to-green-900/40 border border-emerald-500/50 rounded-xl p-6 text-center">
                            <Trophy className="text-amber-400 mx-auto mb-3" size={48} />
                            <h3 className="text-xl font-bold text-white mb-2">
                                Puzzle Resolt!
                            </h3>
                            <div className="text-sm text-slate-300 space-y-1">
                                <div>Temps: {elapsedTime}s</div>
                                <div>Intents: {attempts}</div>
                                <div>Pistes usades: {hintsUsed}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
