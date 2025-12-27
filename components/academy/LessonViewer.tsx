'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Assumim que aquests components existeixen o els hem d'adaptar del projecte
import Chessboard2D from '@/components/2d/Chessboard2D';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonViewerProps {
    lesson: {
        id: string;
        title: string;
        description: string;
        videoUrl?: string;
        steps: {
            fen: string;
            correctMove: string;
            comment: string;
        }[];
    };
}

export default function LessonViewer({ lesson }: LessonViewerProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    // Interaction State
    const [sourceSquare, setSourceSquare] = useState<string | null>(null);
    const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});

    const step = lesson.steps[currentStep];

    const handleSquareClick = (square: string) => {
        if (sourceSquare === square) {
            setSourceSquare(null);
            setCustomSquareStyles({});
            return;
        }

        if (sourceSquare) {
            const moveStr = `${sourceSquare}${square}`;
            if (moveStr === step.correctMove) {
                setFeedback('correct');
                setSourceSquare(null);
                setCustomSquareStyles({});

                setTimeout(() => {
                    if (currentStep < lesson.steps.length - 1) {
                        setCurrentStep(prev => prev + 1);
                        setFeedback(null);
                    }
                }, 1500);
            } else {
                setFeedback('incorrect');
                setSourceSquare(null);
                setCustomSquareStyles({});
                setTimeout(() => setFeedback(null), 1000);
            }
        } else {
            setSourceSquare(square);
            setCustomSquareStyles({
                [square]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            });
        }
    };

    return (
        <div className="h-full w-full flex flex-col md:flex-row bg-[#020617] text-white overflow-hidden">
            {/* Esquerra: Contingut (Video/Text) - 1/3 en Landscape */}
            <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col border-b md:border-b-0 md:border-r border-amber-500/20 bg-slate-950/50 backdrop-blur-xl z-10">
                <div className="p-4 border-b border-amber-500/10">
                    <h2 className="text-amber-500 font-black tracking-tighter text-xl uppercase italic">
                        {lesson.title}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">
                        PAS {currentStep + 1} DE {lesson.steps.length}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {lesson.videoUrl && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            {/* Aquí aniria el component de vídeo real */}
                            <div className="w-full h-full flex items-center justify-center text-slate-700">
                                VIDEO PLAYER
                            </div>
                        </div>
                    )}

                    <div className="glass-panel p-4 bg-slate-900/40 border-slate-800 rounded-xl">
                        <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Instruccions</h3>
                        <p className="text-sm leading-relaxed text-slate-200">
                            {step.comment}
                        </p>
                    </div>
                </div>

                <div className="p-4 border-t border-amber-500/10 flex justify-between gap-2 bg-black/20">
                    <button
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        disabled={currentStep === lesson.steps.length - 1}
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Dreta: Tauler Interactiu - Ocupa la resta */}
            <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#020617] to-[#020617] p-4 lg:p-12 overflow-hidden">

                {/* Gràfics de fons Neon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

                <div className="w-full max-w-[600px] aspect-square relative z-10">
                    <Chessboard2D
                        fen={step.fen}
                        onSquareClick={handleSquareClick}
                        customSquareStyles={customSquareStyles}
                        orientation="white"
                    />

                    {/* Feedback Overlay */}
                    <AnimatePresence>
                        {feedback && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className={cn(
                                    "absolute inset-0 z-20 flex flex-col items-center justify-center backdrop-blur-[2px] rounded-lg pointer-events-none",
                                    feedback === 'correct' ? "bg-green-500/10" : "bg-red-500/10"
                                )}
                            >
                                <div className={cn(
                                    "flex flex-col items-center gap-4 p-8 rounded-3xl shadow-2xl border-2 backdrop-blur-xl",
                                    feedback === 'correct' ? "bg-green-900/80 border-green-400 text-green-100" : "bg-red-900/80 border-red-400 text-red-100"
                                )}>
                                    {feedback === 'correct' ? (
                                        <>
                                            <CheckCircle2 size={80} className="text-green-400 animate-pulse" />
                                            <span className="text-2xl font-black italic tracking-tighter uppercase">Molt Bé!</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={80} className="text-red-400 animate-bounce" />
                                            <span className="text-2xl font-black italic tracking-tighter uppercase">Incorrecte</span>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Floating Controls (Mobile toggle for instructions) */}
                <div className="absolute bottom-6 right-6 md:hidden">
                    <button className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                        <AlertCircle size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
