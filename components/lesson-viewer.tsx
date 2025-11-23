'use client';

import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    Lightbulb,
    Trophy,
    RotateCcw
} from 'lucide-react';
import { LessonContent } from '@/lib/academy-types';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';
import { playSound } from '@/lib/sounds';

interface LessonViewerProps {
    content: LessonContent;
    onComplete: (score: number) => void;
    lessonTitle: string;
}

export function LessonViewer({ content, onComplete, lessonTitle }: LessonViewerProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [game, setGame] = useState<Chess>(new Chess());
    const [fen, setFen] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
    const [correctMoves, setCorrectMoves] = useState(0);
    const [totalAttempts, setTotalAttempts] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const { boardTheme } = useSettings();
    const theme = BOARD_THEMES[boardTheme];

    const currentStep = content.steps[currentStepIndex];
    const isLastStep = currentStepIndex === content.steps.length - 1;
    const isFirstStep = currentStepIndex === 0;

    useEffect(() => {
        if (currentStep) {
            const newGame = new Chess(currentStep.fen);
            setGame(newGame);
            setFen(currentStep.fen);
            setFeedback(null);
            setShowHint(false);
        }
    }, [currentStepIndex, currentStep]);

    const handleMove = (sourceSquare: string, targetSquare: string) => {
        if (isCompleted) return false;

        const gameCopy = new Chess(game.fen());

        try {
            const result = gameCopy.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q'
            });

            if (!result) return false;

            const uciMove = `${sourceSquare}${targetSquare}`;
            setTotalAttempts(prev => prev + 1);

            if (currentStep.correctMoves.includes(uciMove)) {
                setCorrectMoves(prev => prev + 1);
                setFeedback({
                    type: 'success',
                    message: currentStep.explanation
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
        } catch (error) {
            return false;
        }
    };

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
        const newGame = new Chess(currentStep.fen);
        setGame(newGame);
        setFen(currentStep.fen);
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
        <div className="w-full max-w-6xl mx-auto p-4">
            <div className="flex flex-col lg:flex-row gap-6">

                <div className="flex-1">
                    <div className="relative w-full max-w-[600px] aspect-square mx-auto shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
                        <Chessboard
                            id={`lesson-${currentStepIndex}`}
                            position={fen}
                            onPieceDrop={({ sourceSquare, targetSquare }) => {
                                if (!targetSquare) return false;
                                return handleMove(sourceSquare, targetSquare);
                            }}
                            boardOrientation="white"
                            customDarkSquareStyle={{ backgroundColor: theme.dark }}
                            customLightSquareStyle={{ backgroundColor: theme.light }}
                            arePiecesDraggable={!isCompleted}
                        />
                    </div>

                    <div className="mt-4 max-w-[600px] mx-auto">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">
                                Pas {currentStepIndex + 1} de {content.steps.length}
                            </span>
                            <span className="text-sm text-slate-400">
                                Precisió: {totalAttempts > 0 ? Math.round((correctMoves / totalAttempts) * 100) : 0}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full transition-all duration-300"
                                style={{ width: `${((currentStepIndex + 1) / content.steps.length) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-4">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-2">{lessonTitle}</h2>
                        {isFirstStep && content.introduction && (
                            <p className="text-slate-400 text-sm mb-4">{content.introduction}</p>
                        )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <Lightbulb className="text-amber-400 mt-1" size={20} />
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Instrucció
                                </h3>
                                <p className="text-white text-base leading-relaxed">
                                    {currentStep.instruction}
                                </p>
                            </div>
                        </div>

                        {!isCompleted && (
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
                                    Busca moviments que segueixin la instrucció. Pensa en la seguretat del teu rei i l'activitat de les peces.
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
                            onClick={previousStep}
                            disabled={isFirstStep}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                        >
                            <ChevronLeft size={20} />
                            Anterior
                        </button>

                        <button
                            onClick={resetStep}
                            className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg transition"
                            title="Reiniciar pas"
                        >
                            <RotateCcw size={20} />
                        </button>

                        {!isCompleted && !isLastStep && (
                            <button
                                onClick={nextStep}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
                            >
                                Següent
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>

                    {isCompleted && (
                        <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/50 rounded-xl p-6 text-center">
                            <Trophy className="text-amber-400 mx-auto mb-3" size={48} />
                            <h3 className="text-xl font-bold text-white mb-2">
                                Lliçó Completada!
                            </h3>
                            <p className="text-slate-300 text-sm mb-4">
                                Puntuació: {Math.round((correctMoves / Math.max(totalAttempts, 1)) * 100)}%
                            </p>
                            <div className="text-xs text-slate-400">
                                Moviments correctes: {correctMoves} / {totalAttempts}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
