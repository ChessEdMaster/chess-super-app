/**
 * NAG Selector Component
 * Visual selector for Numeric Annotation Glyphs (chess symbols)
 */

'use client';

import React, { useState } from 'react';
import { NAGSymbol, NAG_SYMBOLS } from '@/types/pgn';
import { X } from 'lucide-react';

interface NAGCategory {
    name: string;
    nags: { symbol: NAGSymbol; display: string; description: string }[];
}

const NAG_CATEGORIES: NAGCategory[] = [
    {
        name: 'Move Quality',
        nags: [
            { symbol: NAGSymbol.GOOD_MOVE, display: '!', description: 'Good move' },
            { symbol: NAGSymbol.POOR_MOVE, display: '?', description: 'Mistake' },
            { symbol: NAGSymbol.BRILLIANT_MOVE, display: '!!', description: 'Brilliant move' },
            { symbol: NAGSymbol.BLUNDER, display: '??', description: 'Blunder' },
            { symbol: NAGSymbol.INTERESTING_MOVE, display: '!?', description: 'Interesting move' },
            { symbol: NAGSymbol.DUBIOUS_MOVE, display: '?!', description: 'Dubious move' },
            { symbol: NAGSymbol.FORCED_MOVE, display: '□', description: 'Forced move' },
        ],
    },
    {
        name: 'Position Evaluation',
        nags: [
            { symbol: NAGSymbol.EQUAL, display: '=', description: 'Equal position' },
            { symbol: NAGSymbol.UNCLEAR, display: '∞', description: 'Unclear position' },
            { symbol: NAGSymbol.SLIGHT_ADVANTAGE_WHITE, display: '⩲', description: 'Slight advantage White' },
            { symbol: NAGSymbol.SLIGHT_ADVANTAGE_BLACK, display: '⩱', description: 'Slight advantage Black' },
            { symbol: NAGSymbol.ADVANTAGE_WHITE, display: '±', description: 'Advantage White' },
            { symbol: NAGSymbol.ADVANTAGE_BLACK, display: '∓', description: 'Advantage Black' },
            { symbol: NAGSymbol.WINNING_WHITE, display: '+−', description: 'Winning for White' },
            { symbol: NAGSymbol.WINNING_BLACK, display: '−+', description: 'Winning for Black' },
        ],
    },
    {
        name: 'Special',
        nags: [
            { symbol: NAGSymbol.TIME_PRESSURE, display: '⨀', description: 'Time pressure' },
            { symbol: NAGSymbol.NOVELTY, display: 'N', description: 'Novelty' },
            { symbol: NAGSymbol.INITIATIVE_WHITE, display: '↑', description: 'White has initiative' },
            { symbol: NAGSymbol.INITIATIVE_BLACK, display: '↓', description: 'Black has initiative' },
        ],
    },
];

interface NAGSelectorProps {
    selectedNAGs: NAGSymbol[];
    onToggleNAG: (nag: NAGSymbol) => void;
    onClose?: () => void;
}

export function NAGSelector({ selectedNAGs, onToggleNAG, onClose }: NAGSelectorProps) {
    const [activeCategory, setActiveCategory] = useState(0);

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Annotation Symbols
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 border-b border-slate-700">
                {NAG_CATEGORIES.map((category, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveCategory(index)}
                        className={`px-3 py-2 text-xs font-medium transition border-b-2 ${activeCategory === index
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        {category.name}
                    </button>
                ))}
            </div>

            {/* NAG Grid */}
            <div className="grid grid-cols-4 gap-2">
                {NAG_CATEGORIES[activeCategory].nags.map(({ symbol, display, description }) => {
                    const isSelected = selectedNAGs.includes(symbol);

                    return (
                        <button
                            key={symbol}
                            onClick={() => onToggleNAG(symbol)}
                            className={`p-3 rounded-lg border-2 transition group relative ${isSelected
                                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700'
                                }`}
                            title={description}
                        >
                            <div className="text-2xl font-bold">{display}</div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950 text-slate-200 text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                {description}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                    Tip: Use keyboard shortcuts for quick access
                </p>
            </div>
        </div>
    );
}

/**
 * Compact NAG Display
 * Shows selected NAGs inline
 */
interface NAGDisplayProps {
    nags: NAGSymbol[];
    onRemove?: (nag: NAGSymbol) => void;
}

export function NAGDisplay({ nags, onRemove }: NAGDisplayProps) {
    if (nags.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1">
            {nags.map((nag) => {
                const display = NAG_SYMBOLS[nag] || `$${nag}`;

                return (
                    <span
                        key={nag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-sm font-bold border border-amber-500/30"
                    >
                        {display}
                        {onRemove && (
                            <button
                                onClick={() => onRemove(nag)}
                                className="hover:text-amber-100 transition"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

