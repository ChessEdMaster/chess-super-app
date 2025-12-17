/**
 * NAG Selector Component
 * Visual selector for Numeric Annotation Glyphs (chess symbols)
 */

'use client';

import React from 'react';
import { NAGSymbol, NAG_SYMBOLS } from '@/types/pgn';

interface NAGSelectorProps {
    selectedNAGs: number[];
    onToggleNAG: (nag: number) => void;
}

// Common NAGs with labels and colors
const NAG_OPTIONS = [
    { code: NAGSymbol.GOOD_MOVE, label: '!', description: 'Good move', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { code: NAGSymbol.POOR_MOVE, label: '?', description: 'Mistake', color: 'text-amber-400', border: 'border-amber-500/30' },
    { code: NAGSymbol.BRILLIANT_MOVE, label: '!!', description: 'Brilliant', color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { code: NAGSymbol.BLUNDER, label: '??', description: 'Blunder', color: 'text-red-500', border: 'border-red-500/30' },
    { code: NAGSymbol.INTERESTING_MOVE, label: '!?', description: 'Interesting', color: 'text-indigo-400', border: 'border-indigo-500/30' },
    { code: NAGSymbol.DUBIOUS_MOVE, label: '?!', description: 'Dubious', color: 'text-yellow-400', border: 'border-yellow-500/30' },
    { code: NAGSymbol.FORCED_MOVE, label: '□', description: 'Forced', color: 'text-zinc-300', border: 'border-zinc-500/30' },
    { code: NAGSymbol.EQUAL, label: '=', description: 'Equal', color: 'text-zinc-400', border: 'border-zinc-500/30' },
    { code: NAGSymbol.UNCLEAR, label: '∞', description: 'Unclear', color: 'text-purple-400', border: 'border-purple-500/30' },
    { code: NAGSymbol.SLIGHT_ADVANTAGE_WHITE, label: '⩲', description: 'White slight adv', color: 'text-zinc-200', border: 'border-zinc-500/30' },
    { code: NAGSymbol.SLIGHT_ADVANTAGE_BLACK, label: '⩱', description: 'Black slight adv', color: 'text-zinc-200', border: 'border-zinc-500/30' },
    { code: NAGSymbol.ADVANTAGE_WHITE, label: '±', description: 'White adv', color: 'text-zinc-100', border: 'border-zinc-500/30' },
    { code: NAGSymbol.ADVANTAGE_BLACK, label: '∓', description: 'Black adv', color: 'text-zinc-100', border: 'border-zinc-500/30' },
    { code: NAGSymbol.WINNING_WHITE, label: '+-', description: 'Winning White', color: 'text-zinc-50', border: 'border-zinc-500/30' },
    { code: NAGSymbol.WINNING_BLACK, label: '-+', description: 'Winning Black', color: 'text-zinc-50', border: 'border-zinc-500/30' },
    { code: NAGSymbol.TIME_PRESSURE, label: '⨀', description: 'Time trouble', color: 'text-orange-400', border: 'border-orange-500/30' },
];

export function NAGSelector({ selectedNAGs, onToggleNAG }: NAGSelectorProps) {
    return (
        <div className="grid grid-cols-4 gap-2">
            {NAG_OPTIONS.map((option) => {
                const isSelected = selectedNAGs.includes(option.code);
                return (
                    <button
                        key={option.code}
                        onClick={() => onToggleNAG(option.code)}
                        className={`
                            flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                            ${isSelected
                                ? `bg-zinc-800 ${option.border} shadow-[0_0_10px_rgba(0,0,0,0.2)]`
                                : 'bg-zinc-950/30 border-white/5 hover:bg-zinc-800 hover:border-white/10'
                            }
                        `}
                        title={option.description}
                    >
                        <span className={`text-lg font-bold font-mono ${option.color}`}>{option.label}</span>
                        <span className="text-[10px] text-zinc-500 truncate w-full text-center">{option.description}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function NAGDisplay({ nags }: { nags: number[] }) {
    if (!nags || nags.length === 0) return null;

    return (
        <span className="inline-flex gap-0.5 ml-0.5">
            {nags.map((code) => {
                // Use symbol from map or generic
                const symbol = NAG_SYMBOLS[code as NAGSymbol] || `$${code}`;
                // Simple color logic or default
                let colorClass = "text-zinc-400";
                if (code === 1 || code === 3) colorClass = "text-emerald-400";
                if (code === 2 || code === 6) colorClass = "text-amber-400";
                if (code === 4) colorClass = "text-red-500";
                if (code === 5) colorClass = "text-indigo-400";

                return (
                    <span key={code} className={`font-bold text-xs ${colorClass}`}>
                        {symbol}
                    </span>
                );
            })}
        </span>
    );
}
