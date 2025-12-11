'use client';

import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import Chessboard2D from '@/components/2d/Chessboard2D';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Lightbulb,
    Trophy,
    RotateCcw
} from 'lucide-react';
import { LessonContent } from '@/types/academy';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { playSound } from '@/lib/sounds';
import { LearningDiary } from './academy/sa-view/learning-diary';

interface LessonViewerProps {
    content: LessonContent;
    onComplete: (score: number) => void;
    lessonTitle: string;
    userId?: string;
    lessonId?: string;
}

export function LessonViewer({ content, onComplete, lessonTitle, userId, lessonId }: LessonViewerProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [game, setGame] = useState<Chess>(new Chess());
    const [fen, setFen] = useState('start');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [correctMoves, setCorrectMoves] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showHint, setShowHint] = useState(false);

    // Click to move state
    const [moveFrom, setMoveFrom] = useState<string | null>(null);
    const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

    const { boardTheme } = useSettings();
    const theme = BOARD_THEMES[boardTheme];

    const currentStep = content?.steps?.[currentStepIndex];
    const isLastStep = content?.steps ? currentStepIndex === content.steps.length - 1 : true;
    const isFirstStep = currentStepIndex === 0;

    useEffect(() => {
        if (currentStep) {
            let validFen = currentStep.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            try {
                // Validate FEN by attempting to load it
                const tempGame = new Chess();
                tempGame.load(validFen);
            } catch (e) {
                console.warn('Invalid FEN in lesson step, falling back to start position:', currentStep.fen);
                validFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            }

            try {
                const newGame = new Chess(validFen);
                setGame(newGame);
                setFen(validFen);
                setFeedback(null);
                setShowHint(false);
            } catch (e) {
                console.error("Critical error setting up chess game:", e);
                // Fallback to start just in case constructor fails differently
                const safeGame = new Chess();
                setGame(safeGame);
                setFen(safeGame.fen());
            }
        }
    }, [currentStepIndex, currentStep]);

    if (content.activities && content.activities.length > 0) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Trophy className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{lessonTitle}</h2>
                            <p className="text-slate-400 text-sm">Activitats Offline / Aula</p>
                        </div>
                    </div>

                    <div className="grid gap-3 mb-6">
                        {content.activities.map((activity, idx) => (
                            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-col gap-1.5 hover:border-indigo-500/50 transition-colors">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider px-2 py-0.5 bg-indigo-900/40 rounded border border-indigo-500/20">
                                        {activity.type}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-white">{activity.title}</h3>
                                <p className="text-slate-300 text-xs leading-relaxed">{activity.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => onComplete(100)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold text-base shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                            <CheckCircle size={18} />
                            Marcar com a Completat
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!content || (!content.steps && !content.activities)) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
                <p className="text-white font-bold mb-2">Error de contingut</p>
                <p className="text-slate-400">Aquesta lliçó no té passos definits o el format és incorrecte.</p>
            </div>
        );
    }

    if (!currentStep) return null; // Should be handled by effect, but safety first

    const handleMove = (sourceSquare: string, targetSquare: string) => {
        if (isCompleted) return false;

        let gameCopy;
        try {
            gameCopy = new Chess(game.fen());
        } catch (e) {
            console.error("Error cloning game state:", e);
            return false;
        }

        try {
            const result = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (!result) return false;

            const uciMove = `${sourceSquare}${targetSquare}`;
            setTotalAttempts(prev => prev + 1);

            // Defensive check for correctMoves array
            const validMoves = currentStep.correctMoves || [];
            if (validMoves.includes(uciMove)) {
                setCorrectMoves(prev => prev + 1);
                setFeedback({
                    type: 'success',
                    message: currentStep.explanation || 'Molt bé!'
                });
                playSound('move');

                setGame(gameCopy);
                setFen(gameCopy.fen());

                setTimeout(() => {
                    if (isLastStep) {
                        completeLesson();
                    } else {
                        nextStep();
                    }
                }, 2000);

                return true;
            } else {
                setFeedback({
                    type: 'error',
                    message: 'Aquest no és el millor moviment. Torna-ho a intentar!'
                });
                playSound('illegal');
                return false;
            }
        } catch {
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
        if (isCompleted) return;

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

    const nextStep = () => {
        if (!isLastStep) {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    const previousStep = () => {
        if (!isFirstStep) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const resetStep = () => {
        // Safe FEN reset
        let validFen = currentStep.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        try {
            const temp = new Chess();
            temp.load(validFen);
        } catch {
            validFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        }

        const newGame = new Chess(validFen);
        setGame(newGame);
        setFen(validFen);
        setFeedback(null);
        setShowHint(false);
    };

    const completeLesson = () => {
        const score = Math.round((correctMoves / Math.max(totalAttempts, 1)) * 100);
        setIsCompleted(true);
        setFeedback({
            type: 'success',
            message: content.conclusion || '🎉 Has completat la lliçó!'
        });
        playSound('game_end');
        onComplete(score);
    };

    const toggleHint = () => {
        setShowHint(!showHint);
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4">
            <div className="flex flex-col lg:flex-row gap-4">

                <div className="flex-1">
                    <div className="relative w-full max-w-[480px] aspect-square mx-auto shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
                        <Chessboard2D
                            fen={fen}
                            orientation="white"
                            onSquareClick={onSquareClick}
                            customSquareStyles={optionSquares}
                        />
                    </div>

                    <div className="mt-3 max-w-[480px] mx-auto">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-slate-400">
                                Pas {currentStepIndex + 1} de {content.steps?.length || 0}
                            </span>
                            <span className="text-xs text-slate-400">
                                Precisió: {totalAttempts > 0 ? Math.round((correctMoves / totalAttempts) * 100) : 0}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full transition-all duration-300"
                                style={{ width: `${((currentStepIndex + 1) / (content.steps?.length || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-80 flex flex-col gap-3">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <h2 className="text-lg font-bold text-white mb-2">{lessonTitle}</h2>
                        {isFirstStep && content.introduction && (
                            <p className="text-slate-400 text-xs mb-3">{content.introduction}</p>
                        )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-start gap-2 mb-3">
                            <Lightbulb className="text-amber-400 mt-0.5" size={18} />
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    Instrucció
                                </h3>
                                <p className="text-white text-sm leading-relaxed">
                                    {currentStep.instruction}
                                </p>
                            </div>
                        </div>

                        {!isCompleted && (
                            <button
                                onClick={toggleHint}
                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
                            >
                                <Lightbulb size={14} />
                                {showHint ? 'Amagar pista' : 'Mostrar pista'}
                            </button>
                        )}

                        {showHint && (
                            <div className="mt-2 p-2.5 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                                <p className="text-xs text-indigo-200">
                                    Busca moviments que segueixin la instrucció. Pensa en la seguretat del teu rei i l&apos;activitat de les peces.
                                </p>
                            </div>
                        )}
                    </div>

                    {feedback && (
                        <div className={`border rounded-xl p-3 ${feedback.type === 'success'
                            ? 'bg-emerald-900/20 border-emerald-500/30'
                            : feedback.type === 'error'
                                ? 'bg-red-900/20 border-red-500/30'
                                : 'bg-blue-900/20 border-blue-500/30'
                            }`}>
                            <div className="flex items-start gap-2">
                                {feedback.type === 'success' ? (
                                    <CheckCircle className="text-emerald-400 mt-0.5" size={18} />
                                ) : feedback.type === 'error' ? (
                                    <XCircle className="text-red-400 mt-0.5" size={18} />
                                ) : (
                                    <Lightbulb className="text-blue-400 mt-0.5" size={18} />
                                )}
                                <p className={`text-xs ${feedback.type === 'success'
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

                    <div className="flex gap-2">
                        <button
                            onClick={previousStep}
                            disabled={isFirstStep}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition"
                        >
                            <ChevronLeft size={18} />
                            Anterior
                        </button>

                        <button
                            onClick={resetStep}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-lg transition"
                            title="Reiniciar pas"
                        >
                            <RotateCcw size={18} />
                        </button>

                        {!isCompleted && !isLastStep && (
                            <button
                                onClick={nextStep}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 transition"
                            >
                                Següent
                                <ChevronRight size={18} />
                            </button>
                        )}
                    </div>

                    {isCompleted && (
                        <div className="space-y-4">
                            <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-4 text-center">
                                <Trophy className="text-amber-400 mx-auto mb-2" size={32} />
                                <h3 className="text-lg font-bold text-white mb-1.5">
                                    Lliçó Completada!
                                </h3>
                                <p className="text-slate-300 text-xs mb-2">
                                    Puntuació: {Math.round((correctMoves / Math.max(totalAttempts, 1)) * 100)}%
                                </p>
                                <div className="text-[10px] text-slate-400">
                                    Moviments correctes: {correctMoves} / {totalAttempts}
                                </div>
                            </div>

                            {/* Learning Diary Integration */}
                            {(userId && lessonId) && (
                                <LearningDiary
                                    userId={userId}
                                    lessonId={lessonId}
                                    className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
