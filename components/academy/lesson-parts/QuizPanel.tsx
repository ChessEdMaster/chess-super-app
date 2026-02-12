'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, HelpCircle, ArrowRight, Trophy, Flame } from 'lucide-react';
import { playSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';

interface QuizPanelProps {
    questions: {
        question: string;
        options: string[];
        correct_option_index: number;
    }[];
    onComplete: (score: number) => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({ questions, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [showResult, setShowResult] = useState(false);

    const currentQuestion = questions[currentIndex];

    // Trigger completion if we've gone past the last question
    useEffect(() => {
        if (showResult) {
            const finalScore = Math.round((score / questions.length) * 100);
            const timer = setTimeout(() => {
                onComplete(finalScore);
            }, 3000); // Give them 3 seconds to admire their score
            return () => clearTimeout(timer);
        }
    }, [showResult, score, questions.length, onComplete]);

    const handleOptionClick = (idx: number) => {
        if (selectedOption !== null) return; // Prevent double click

        setSelectedOption(idx);
        const correct = idx === currentQuestion.correct_option_index;
        setIsCorrect(correct);

        if (correct) {
            playSound('confirm');
            setScore(prev => prev + 1);
            setStreak(prev => prev + 1);
            if (streak > 1) {
                // playSound('streak'); // Optional: Add streak sound
            }
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#10B981', '#34D399']
            });
        } else {
            playSound('illegal');
            setStreak(0);
        }

        // Auto advance after delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsCorrect(null);
            } else {
                setShowResult(true);
            }
        }, 1500);
    };

    if (showResult) {
        const finalScore = Math.round((score / questions.length) * 100);
        return (
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-zinc-900 border border-zinc-800 p-12 rounded-3xl shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10" />

                    <div className="relative z-10">
                        <div className="w-24 h-24 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                            <Trophy size={48} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-2 font-display uppercase tracking-wide">
                            Quiz Completat!
                        </h2>

                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                            {finalScore}%
                        </div>

                        <p className="text-zinc-400 font-medium">
                            Has encertat {score} de {questions.length} preguntes
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col justify-center min-h-[500px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
                >
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <HelpCircle size={200} />
                    </div>

                    {/* Progress Bar & Streak */}
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                                Pregunta {currentIndex + 1} / {questions.length}
                            </span>
                            {streak > 1 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-950/30 px-3 py-1 rounded-full border border-amber-500/20"
                                >
                                    <Flame size={12} fill="currentColor" /> {streak} COMBO
                                </motion.div>
                            )}
                        </div>

                        {/* Visual Timer or just decoration */}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-snug relative z-10">
                        {currentQuestion.question}
                    </h2>

                    <div className="grid gap-4 relative z-10">
                        {currentQuestion.options.map((option, idx) => {
                            let stateStyles = "bg-zinc-900 border-zinc-700 hover:border-indigo-500 hover:bg-zinc-800 hover:shadow-lg hover:shadow-indigo-500/10";
                            let icon = <div className="w-6 h-6 rounded-full border-2 border-zinc-600 group-hover:border-indigo-500 transition-colors" />;

                            if (selectedOption !== null) {
                                if (idx === currentQuestion.correct_option_index) {
                                    stateStyles = "bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
                                    icon = <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={14} className="text-white" /></div>;
                                } else if (idx === selectedOption) {
                                    stateStyles = "bg-red-950/40 border-red-500 text-red-100";
                                    icon = <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"><X size={14} className="text-white" /></div>;
                                } else {
                                    stateStyles = "opacity-40 grayscale border-zinc-800";
                                }
                            }

                            return (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    disabled={selectedOption !== null}
                                    onClick={() => handleOptionClick(idx)}
                                    className={`
                                        w-full p-6 rounded-2xl text-left border-2 transition-all duration-200 flex items-center justify-between group 
                                        ${stateStyles}
                                    `}
                                >
                                    <span className="font-semibold text-lg">{option}</span>
                                    {icon}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Bottom Progress Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-900">
                        <motion.div
                            className="h-full bg-indigo-500"
                            initial={{ width: `${(currentIndex / questions.length) * 100}%` }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
