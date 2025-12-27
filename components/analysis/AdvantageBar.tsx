'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Evaluation as EngineEvaluation } from '@/hooks/use-stockfish';

interface AdvantageBarProps {
    evaluation: EngineEvaluation | null;
    orientation?: 'white' | 'black';
    className?: string;
}

export const AdvantageBar = ({ evaluation, orientation = 'white', className }: AdvantageBarProps) => {
    const percentage = useMemo(() => {
        if (!evaluation) return 50;

        if (evaluation.type === 'mate') {
            return evaluation.value > 0 ? 100 : 0;
        }

        // Normalizing cp (-500 to +500 is a good range for children)
        // Formula: 50 + (cp / 10) clamped between 0 and 100
        const cp = evaluation.value;
        const val = 50 + (cp / 20); // 500cp = 75%, 1000cp = 100%
        return Math.max(5, Math.min(95, val));
    }, [evaluation]);

    // If orientation is black, flip the bar
    const displayPercentage = orientation === 'black' ? 100 - percentage : percentage;

    return (
        <div className={cn(
            "relative w-8 h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)]",
            className
        )}>
            {/* Black Advantage Area */}
            <div className="flex-1 bg-slate-950 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-transparent opacity-30" />
            </div>

            {/* Advantage Indicator Line (The Split) */}
            <motion.div
                initial={false}
                animate={{ bottom: `${displayPercentage}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                className="absolute left-0 right-0 h-1 bg-white z-20 shadow-[0_0_10px_rgba(255,255,255,1)]"
            />

            {/* White Advantage Area (Fills from bottom) */}
            <motion.div
                initial={false}
                animate={{ height: `${displayPercentage}%` }}
                transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                className="absolute bottom-0 left-0 right-0 bg-white"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent opacity-50" />
                {/* Neon Glow top edge */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-white blur-md opacity-40" />
            </motion.div>

            {/* Evaluation Labels */}
            <div className="absolute inset-0 flex flex-col justify-between p-1 pointer-events-none z-30 font-mono font-black text-[8px]">
                <span className={cn(
                    "transition-opacity duration-300",
                    displayPercentage < 90 ? "text-slate-500" : "text-slate-900"
                )}>
                    {orientation === 'white' ? 'B' : 'W'}
                </span>

                {/* Center Marker */}
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-700/50" />

                <span className={cn(
                    "transition-opacity duration-300 text-right self-end",
                    displayPercentage > 10 ? "text-slate-400" : "text-white"
                )}>
                    {orientation === 'white' ? 'W' : 'B'}
                </span>
            </div>

            {/* Numeric Indicator */}
            {evaluation && (
                <motion.div
                    animate={{ bottom: `${displayPercentage}%` }}
                    className="absolute -right-12 translate-y-1/2 z-40 bg-black/80 border border-slate-700 px-2 py-1 rounded text-[10px] font-bold text-white shadow-xl"
                >
                    {evaluation.type === 'mate' ? `M${Math.abs(evaluation.value)}` : (evaluation.value / 100).toFixed(1)}
                </motion.div>
            )}
        </div>
    );
};
