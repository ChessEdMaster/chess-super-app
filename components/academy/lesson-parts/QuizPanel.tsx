'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, HelpCircle, ArrowRight } from 'lucide-react';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { playSound } from '@/lib/sounds';

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

    const currentQuestion = questions[currentIndex];

    const handleOptionClick = (idx: number) => {
        if (selectedOption !== null) return; // Prevent double click

        setSelectedOption(idx);
        const correct = idx === currentQuestion.correct_option_index;
        setIsCorrect(correct);

        if (correct) {
            playSound('confirm');
            setScore(prev => prev + 1);
        } else {
            playSound('illegal');
        }

        // Auto advance after delay
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsCorrect(null);
            } else {
                // Finish
                const finalScore = Math.round(((score + (correct ? 1 : 0)) / questions.length) * 100);
                onComplete(finalScore);
            }
        }, 1500);
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-xl relative overflow-hidden"
            >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>

                <div className="mt-4 flex items-center justify-between mb-8">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">
                        Pregunta {currentIndex + 1} de {questions.length}
                    </span>
                    <HelpCircle size={18} className="text-zinc-600" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-8 leading-tight">
                    {currentQuestion.question}
                </h2>

                <div className="grid gap-3">
                    {currentQuestion.options.map((option, idx) => {
                        let stateStyles = "bg-zinc-800/50 border-zinc-700 hover:border-indigo-500 hover:bg-zinc-800";
                        if (selectedOption !== null) {
                            if (idx === currentQuestion.correct_option_index) {
                                stateStyles = "bg-green-900/30 border-green-500 text-green-100";
                            } else if (idx === selectedOption) {
                                stateStyles = "bg-red-900/30 border-red-500 text-red-100";
                            } else {
                                stateStyles = "opacity-50 grayscale";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                disabled={selectedOption !== null}
                                onClick={() => handleOptionClick(idx)}
                                className={`w-full p-4 rounded-xl text-left border transition-all flex items-center justify-between group ${stateStyles}`}
                            >
                                <span className="font-medium">{option}</span>
                                {selectedOption !== null && idx === currentQuestion.correct_option_index && (
                                    <Check className="text-green-500" />
                                )}
                                {selectedOption === idx && idx !== currentQuestion.correct_option_index && (
                                    <X className="text-red-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};
