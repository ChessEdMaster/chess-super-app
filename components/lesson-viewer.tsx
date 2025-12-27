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
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Panel } from '@/components/ui/design-system/Panel';

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
    const [clickedSquares, setClickedSquares] = useState<string[]>([]);
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
                setClickedSquares([]);
                setOptionSquares({});
                setMoveFrom(null);
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
            <div className="w-full max-w-4xl mx-auto">
                <GameCard variant="default" className="bg-zinc-900 border-zinc-800 p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-indigo-600 rounded-xl shadow-lg border border-indigo-500/50">
                            <Trophy className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white font-display uppercase tracking-wide">{lessonTitle}</h2>
                            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Activitats Offline / Aula</p>
                        </div>
                    </div>

                    <div className="grid gap-4 mb-8">
                        {content.activities.map((activity, idx) => (
                            <div key={idx} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-5 flex flex-col gap-2 hover:border-indigo-500/50 transition-colors group">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest px-3 py-1 bg-indigo-900/40 rounded border border-indigo-500/20 shadow-sm">
                                        {activity.type}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{activity.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{activity.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <ShinyButton
                            variant="success"
                            onClick={() => onComplete(100)}
                            className="w-full sm:w-auto px-8 py-4 text-sm uppercase tracking-widest font-bold"
                        >
                            <CheckCircle size={20} className="mr-2" />
                            Marcar com a Completat
                        </ShinyButton>
                    </div>
                </GameCard>
            </div>
        );
    }

    if (!content || (!content.steps && !content.activities)) {
        return (
            <GameCard variant="default" className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900 border-zinc-800">
                <p className="text-white font-black text-xl mb-2 font-display uppercase tracking-wide">Error de contingut</p>
                <p className="text-zinc-500 font-bold text-sm">Aquesta lliçó no té passos definits o el format és incorrecte.</p>
            </GameCard>
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
                    ? 'radial-gradient(circle, rgba(239, 68, 68, .6) 25%, transparent 25%)'
                    : 'radial-gradient(circle, rgba(16, 185, 129, .6) 25%, transparent 25%)', // Green/Red dots for consistency
                borderRadius: '50%',
            };
            return move;
        });
        newSquares[square] = {
            background: 'rgba(245, 158, 11, 0.5)', // Amber selection
        };
        setOptionSquares(newSquares);
        return true;
    }

    function onSquareClick(square: string) {
        if (isCompleted || !currentStep) return;

        // Handle click_square
        if (currentStep.type === 'click_square') {
            setTotalAttempts(prev => prev + 1);
            if (square === currentStep.target) {
                setCorrectMoves(prev => prev + 1);
                setFeedback({
                    type: 'success',
                    message: currentStep.explanation || 'Recte!'
                });
                playSound('move');
                setOptionSquares({ [square]: { background: 'rgba(16, 185, 129, 0.6)' } });
                setTimeout(() => (isLastStep ? completeLesson() : nextStep()), 1500);
            } else {
                setFeedback({ type: 'error', message: 'No és la casella correcta. Torna-ho a provar!' });
                playSound('illegal');
                setOptionSquares({ [square]: { background: 'rgba(239, 68, 68, 0.6)' } });
                setTimeout(() => setOptionSquares({}), 500);
            }
            return;
        }

        // Handle click_multiple
        if (currentStep.type === 'click_multiple') {
            if (clickedSquares.includes(square)) return;

            const newClicked = [...clickedSquares, square];
            setClickedSquares(newClicked);

            const targets = currentStep.targets || [];
            if (targets.includes(square)) {
                playSound('move');
                const newOptionSquares = { ...optionSquares, [square]: { background: 'rgba(16, 185, 129, 0.6)' } };
                setOptionSquares(newOptionSquares);

                // Check if all targets are found
                const allFound = targets.every(t => newClicked.includes(t));
                if (allFound) {
                    setTotalAttempts(prev => prev + 1);
                    setCorrectMoves(prev => prev + 1);
                    setFeedback({
                        type: 'success',
                        message: currentStep.explanation || 'Molt bé! Has trobat totes les caselles.'
                    });
                    setTimeout(() => (isLastStep ? completeLesson() : nextStep()), 1500);
                }
            } else {
                setTotalAttempts(prev => prev + 1);
                setFeedback({ type: 'error', message: 'Aquesta casella no forma part de l\'objectiu.' });
                playSound('illegal');
                const newOptionSquares = { ...optionSquares, [square]: { background: 'rgba(239, 68, 68, 0.6)' } };
                setOptionSquares(newOptionSquares);
                setTimeout(() => {
                    const resetOptions = { ...newOptionSquares };
                    delete resetOptions[square];
                    setOptionSquares(resetOptions);
                    setClickedSquares(prev => prev.filter(s => s !== square));
                }, 500);
            }
            return;
        }

        // Default: move interaction
        if (moveFrom) {
            if (moveFrom === square) {
                setMoveFrom(null);
                setOptionSquares({});
                return;
            }
            const moveResult = handleMove(moveFrom, square);
            if (moveResult) {
                setMoveFrom(null);
                setOptionSquares({});
                return;
            }
            const clickedPiece = game.get(square as Square);
            if (clickedPiece && clickedPiece.color === game.turn()) {
                setMoveFrom(square);
                getMoveOptions(square);
                return;
            }
            setMoveFrom(null);
            setOptionSquares({});
        } else {
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
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">

                <div className="flex-1">
                    <GameCard variant="default" className="relative w-full aspect-square mx-auto shadow-2xl overflow-hidden border-zinc-800 p-1 bg-zinc-950">
                        <Chessboard2D
                            fen={fen}
                            orientation="white"
                            onSquareClick={onSquareClick}
                            customSquareStyles={optionSquares}
                        />
                    </GameCard>

                    <div className="mt-4 max-w-full mx-auto px-1">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Pas {currentStepIndex + 1} de {content.steps?.length || 0}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Precisió: {totalAttempts > 0 ? Math.round((correctMoves / totalAttempts) * 100) : 0}%
                            </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
                            <div
                                className="bg-amber-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                style={{ width: `${((currentStepIndex + 1) / (content.steps?.length || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-4">

                    <Panel className="bg-zinc-900 border-zinc-700 p-5 rounded-2xl">
                        <h2 className="text-xl font-black text-white mb-2 font-display uppercase tracking-wide leading-none">{lessonTitle}</h2>
                        {isFirstStep && content.introduction && (
                            <p className="text-zinc-400 text-xs font-bold leading-relaxed">{content.introduction}</p>
                        )}
                    </Panel>

                    <Panel className="bg-zinc-900 border-zinc-700 p-5 rounded-2xl flex-1 flex flex-col">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20 mt-0.5">
                                <Lightbulb className="text-amber-500" size={18} />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest mb-1">
                                    Instrucció
                                </h3>
                                <p className="text-white text-sm font-medium leading-relaxed">
                                    {currentStep?.instruction}
                                </p>
                            </div>
                        </div>

                        {currentStep?.type === 'click_area' && currentStep?.options && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {currentStep.options.map(option => (
                                    <ShinyButton
                                        key={option}
                                        variant="neutral"
                                        onClick={() => {
                                            setTotalAttempts(prev => prev + 1);
                                            // Simple logic for 'dynamic' or fixed correct_option
                                            // In Session 1, mission 1 is dynamic, but for now we'll accept any if correct_option is dynamic
                                            // or check against a fixed value. 
                                            // Let's assume for now we just want them to click one to learn.
                                            setCorrectMoves(prev => prev + 1);
                                            setFeedback({ type: 'success', message: 'Correcte!' });
                                            playSound('confirm');
                                            setTimeout(() => (isLastStep ? completeLesson() : nextStep()), 1500);
                                        }}
                                        className="text-xs py-2"
                                    >
                                        {option}
                                    </ShinyButton>
                                ))}
                            </div>
                        )}

                        {!isCompleted && (
                            <button
                                onClick={toggleHint}
                                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition font-bold uppercase tracking-wide ml-auto mb-2"
                            >
                                {showHint ? 'Amagar pista' : 'Mostrar pista'}
                            </button>
                        )}

                        {showHint && (
                            <div className="mb-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-xl relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                <p className="text-xs text-indigo-200 font-medium pl-2">
                                    Busca moviments que segueixin la instrucció. Pensa en la seguretat del teu rei i l&apos;activitat de les peces.
                                </p>
                            </div>
                        )}

                        <div className="mt-auto space-y-3">
                            {feedback && (
                                <div className={`border-l-4 rounded-r-xl p-3 animate-in slide-in-from-right-2 duration-300 ${feedback.type === 'success'
                                    ? 'bg-emerald-950/30 border-emerald-500'
                                    : feedback.type === 'error'
                                        ? 'bg-red-950/30 border-red-500'
                                        : 'bg-blue-950/30 border-blue-500'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`
                                            p-1 rounded-full 
                                             ${feedback.type === 'success'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : feedback.type === 'error'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-blue-500/20 text-blue-400'
                                            }
                                        `}>
                                            {feedback.type === 'success' ? (
                                                <CheckCircle size={14} />
                                            ) : feedback.type === 'error' ? (
                                                <XCircle size={14} />
                                            ) : (
                                                <Lightbulb size={14} />
                                            )}
                                        </div>

                                        <p className={`text-xs font-bold ${feedback.type === 'success'
                                            ? 'text-emerald-300'
                                            : feedback.type === 'error'
                                                ? 'text-red-300'
                                                : 'text-blue-300'
                                            }`}>
                                            {feedback.message}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <ShinyButton
                                    variant="neutral"
                                    onClick={previousStep}
                                    disabled={isFirstStep}
                                    className="flex-1 h-10 text-xs uppercase tracking-wider"
                                >
                                    <ChevronLeft size={16} /> Prev
                                </ShinyButton>

                                <ShinyButton
                                    variant="neutral"
                                    onClick={resetStep}
                                    className="w-10 h-10 p-0 flex items-center justify-center shrink-0"
                                    title="Reiniciar pas"
                                >
                                    <RotateCcw size={16} />
                                </ShinyButton>

                                {!isCompleted && !isLastStep && (
                                    <ShinyButton
                                        variant="primary"
                                        onClick={nextStep}
                                        className="flex-1 h-10 text-xs uppercase tracking-wider"
                                    >
                                        Next <ChevronRight size={16} />
                                    </ShinyButton>
                                )}
                            </div>
                        </div>

                    </Panel>

                    {isCompleted && (
                        <div className="space-y-4 animate-in fade-in zoom-in duration-500">
                            <GameCard variant="gold" className="text-center p-6 border-amber-500/50">
                                <Trophy className="text-amber-400 mx-auto mb-3 drop-shadow-md" size={48} />
                                <h3 className="text-xl font-black text-white mb-1 font-display uppercase tracking-wide text-stroke">
                                    Lliçó Completada!
                                </h3>
                                <p className="text-amber-200 text-xs font-bold uppercase tracking-widest mb-4">
                                    Puntuació: {Math.round((correctMoves / Math.max(totalAttempts, 1)) * 100)}%
                                </p>
                                <div className="text-[10px] text-zinc-400 font-bold bg-black/20 rounded-full py-1 px-3 inline-block border border-black/10">
                                    Moviments correctes: {correctMoves} / {totalAttempts}
                                </div>
                            </GameCard>

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
