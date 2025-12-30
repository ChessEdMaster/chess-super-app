'use client';

import React, { useState, useEffect } from 'react';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { playSound } from '@/lib/sounds';

interface InteractiveBoardProps {
    data: {
        id: number;
        description?: string; // For examples
        instruction?: string; // For exercises
        visual_cues?: string; // Text description of cues, we need to parse or map this?
        setup_description?: string;
        solution_mechanic?: string;
        validation?: {
            type: 'any_of' | 'exact' | 'sequence';
            values: string[];
        };
    };
    mode: 'example' | 'exercise';
    onComplete: (success: boolean) => void;
}

export const InteractiveBoard: React.FC<InteractiveBoardProps> = ({ data, mode, onComplete }) => {
    // State
    const [fen, setFen] = useState('8/8/8/8/8/8/8/8 w - - 0 1'); // Default empty board for setup
    const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [sequenceProgress, setSequenceProgress] = useState<string[]>([]);

    // Parse visual cues text to actual styles? 
    // Ideally the data would be structured. For now, we'll hardcode some "Demo" highlights based on ID for the specific lesson 1.
    // In a real app, visual_cues should be a JSON object like { "h1": "green", "a8": "green", "arrow": ["e1", "e4"] }

    useEffect(() => {
        // Reset state on data change
        setFeedback(null);
        setSequenceProgress([]);
        setCustomSquareStyles({});

        // --- DEMO LOADER FOR VISUAL CUES ---
        // Mapping Lesson 1 specific cues based on ID
        if (mode === 'example') {
            if (data.id === 1) {
                // "Resaltar en VERDE la casilla h1 y a8"
                setCustomSquareStyles({
                    h1: { backgroundColor: 'rgba(34, 197, 94, 0.5)' }, // Green
                    a8: { backgroundColor: 'rgba(34, 197, 94, 0.5)' }
                });
            } else if (data.id === 2) {
                // "Colorear fila 4 roja, col e azul..."
                const styles: Record<string, React.CSSProperties> = {};
                // Col E
                ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'].forEach(s => styles[s] = { backgroundColor: 'rgba(59, 130, 246, 0.4)' }); // Blue
                // Row 4
                ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4'].forEach(s => styles[s] = { backgroundColor: 'rgba(239, 68, 68, 0.4)' }); // Red (overwrite overlap)
                // Diagonal a1-h8
                ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'].forEach(s => styles[s] = { backgroundColor: 'rgba(234, 179, 8, 0.5)' }); // Yellow
                setCustomSquareStyles(styles);
            }
        }
    }, [data, mode]);

    const handleSquareClick = (square: string) => {
        if (mode !== 'exercise' || feedback === 'correct') return;

        if (!data.validation) {
            // No validation data? Just pass for demo
            playSound('move');
            setFeedback('correct');
            setTimeout(() => onComplete(true), 1000);
            return;
        }

        const { type, values } = data.validation;

        if (type === 'any_of' || type === 'exact') {
            if (values.includes(square)) {
                playSound('move');
                setFeedback('correct');
                setCustomSquareStyles({ [square]: { backgroundColor: 'rgba(34, 197, 94, 0.6)' } });
                setTimeout(() => onComplete(true), 1500);
            } else {
                playSound('illegal');
                setFeedback('incorrect');
                setCustomSquareStyles({ [square]: { backgroundColor: 'rgba(239, 68, 68, 0.6)' } });
                setTimeout(() => {
                    setFeedback(null);
                    setCustomSquareStyles({});
                }, 1000);
            }
        } else if (type === 'sequence') {
            const nextExpected = values[sequenceProgress.length];
            if (square === nextExpected) {
                playSound('move');
                const newSeq = [...sequenceProgress, square];
                setSequenceProgress(newSeq);
                setCustomSquareStyles(prev => ({ ...prev, [square]: { backgroundColor: 'rgba(34, 197, 94, 0.6)' } }));

                if (newSeq.length === values.length) {
                    setFeedback('correct');
                    setTimeout(() => onComplete(true), 1500);
                }
            } else {
                playSound('illegal');
                setFeedback('incorrect');
                // Flash error
                const oldStyles = { ...customSquareStyles };
                setCustomSquareStyles(prev => ({ ...prev, [square]: { backgroundColor: 'rgba(239, 68, 68, 0.6)' } }));
                setTimeout(() => {
                    setFeedback(null);
                    setCustomSquareStyles(oldStyles);
                    // Reset sequence? Or just let them retry? Let's just let them retry the step.
                }, 1000);
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 w-full h-full max-w-5xl mx-auto items-center justify-center">
            {/* Instruction Panel */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4 order-2 lg:order-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/80 border border-zinc-700 p-6 rounded-2xl backdrop-blur-sm"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <HelpCircle size={24} />
                        </div>
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                            {mode === 'example' ? 'Observa' : 'Mishión'}
                        </h3>
                    </div>

                    <p className="text-xl font-bold text-white leading-relaxed">
                        {data.description || data.instruction}
                    </p>

                    {data.setup_description && (
                        <p className="mt-4 text-xs text-zinc-500 border-l-2 border-zinc-700 pl-3">
                            Config: {data.setup_description}
                        </p>
                    )}
                </motion.div>

                {mode === 'exercise' && feedback === 'incorrect' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200"
                    >
                        <XCircle size={20} />
                        <span className="font-bold">Incorrecte. Torna-ho a provar!</span>
                    </motion.div>
                )}
            </div>

            {/* Board */}
            <div className="w-full lg:w-1/2 aspect-square relative order-1 lg:order-2 shadow-2xl rounded-lg overflow-hidden border-4 border-zinc-800 bg-zinc-950">
                <Chessboard2D
                    fen={fen}
                    customSquareStyles={customSquareStyles}
                    onSquareClick={handleSquareClick}
                    orientation="white"
                />

                {mode === 'example' && (
                    <div className="absolute bottom-6 right-6">
                        <button
                            onClick={() => onComplete(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-all"
                        >
                            Entesos <CheckCircle2 size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
