/**
 * Variation Tree Component
 * Interactive display of game variations
 */

'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2, ArrowUp } from 'lucide-react';
import type { MoveNode } from '@/types/pgn';
import { NAG_SYMBOLS } from '@/types/pgn';

interface VariationTreeProps {
    mainLine: MoveNode[];
    currentNode: MoveNode | null;
    onSelectNode: (node: MoveNode) => void;
    onDeleteVariation?: (variationId: string, parentNode: MoveNode) => void;
    onPromoteVariation?: (variationId: string, parentNode: MoveNode) => void;
}

export function VariationTree({
    mainLine,
    currentNode,
    onSelectNode,
    onDeleteVariation,
    onPromoteVariation,
}: VariationTreeProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    const toggleExpand = (nodeId: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const renderMove = (node: MoveNode, depth: number = 0) => {
        const isActive = currentNode?.id === node.id;
        const hasVariations = node.variations.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const indent = depth * 16;

        return (
            <div key={node.id}>
                {/* Move Row */}
                <div
                    className={`flex items-center gap-2 py-1.5 px-2 rounded group hover:bg-slate-800/50 transition ${isActive ? 'bg-indigo-600/20 border-l-2 border-indigo-500' : ''
                        }`}
                    style={{ paddingLeft: `${indent + 8}px` }}
                >
                    {/* Expand/Collapse Button */}
                    {hasVariations ? (
                        <button
                            onClick={() => toggleExpand(node.id)}
                            className="p-0.5 hover:bg-slate-700 rounded transition text-slate-400"
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <div className="w-[18px]" />
                    )}

                    {/* Move Number */}
                    {node.color === 'w' && (
                        <span className="text-slate-500 text-xs font-mono w-8">
                            {node.moveNumber}.
                        </span>
                    )}
                    {node.color === 'b' && depth > 0 && (
                        <span className="text-slate-500 text-xs font-mono w-8">
                            {node.moveNumber}...
                        </span>
                    )}

                    {/* Move */}
                    <button
                        onClick={() => onSelectNode(node)}
                        className={`font-mono text-sm font-medium transition ${isActive ? 'text-indigo-300' : 'text-slate-300 hover:text-white'
                            }`}
                    >
                        {node.move}
                    </button>

                    {/* NAG Symbols */}
                    {node.annotation.nags.length > 0 && (
                        <span className="text-amber-400 text-xs font-bold">
                            {node.annotation.nags.map((nag) => NAG_SYMBOLS[nag] || `$${nag}`).join('')}
                        </span>
                    )}

                    {/* Evaluation */}
                    {node.annotation.evaluation && (
                        <span className="text-emerald-400 text-xs font-mono">
                            {node.annotation.evaluation.type === 'mate'
                                ? `M${node.annotation.evaluation.value}`
                                : (node.annotation.evaluation.value / 100).toFixed(1)}
                        </span>
                    )}

                    {/* Comment Indicator */}
                    {node.annotation.comments.length > 0 && (
                        <span className="text-blue-400 text-xs">💬</span>
                    )}

                    {/* Variation Count */}
                    {hasVariations && (
                        <span className="text-slate-500 text-xs">
                            ({node.variations.length})
                        </span>
                    )}
                </div>

                {/* Variations */}
                {hasVariations && isExpanded && (
                    <div className="ml-4 border-l border-slate-700/50">
                        {node.variations.map((variation, index) => (
                            <div key={variation.id} className="relative">
                                {/* Variation Header */}
                                <div
                                    className="flex items-center gap-2 py-1 px-2 text-xs text-slate-400 group/var"
                                    style={{ paddingLeft: `${indent + 16}px` }}
                                >
                                    <span className="font-medium">
                                        Variation {index + 1}
                                        {variation.isMainLine && ' (Main)'}
                                    </span>

                                    {/* Variation Actions */}
                                    <div className="opacity-0 group-hover/var:opacity-100 flex gap-1 ml-auto">
                                        {onPromoteVariation && !variation.isMainLine && (
                                            <button
                                                onClick={() => onPromoteVariation(variation.id, node)}
                                                className="p-1 hover:bg-slate-700 rounded transition text-slate-400 hover:text-indigo-400"
                                                title="Promote to main line"
                                            >
                                                <ArrowUp size={12} />
                                            </button>
                                        )}
                                        {onDeleteVariation && (
                                            <button
                                                onClick={() => onDeleteVariation(variation.id, node)}
                                                className="p-1 hover:bg-slate-700 rounded transition text-slate-400 hover:text-red-400"
                                                title="Delete variation"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Variation Moves */}
                                {variation.moves.map((varNode) => renderMove(varNode, depth + 1))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 p-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                    Game Tree
                </h3>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto p-2 max-h-[500px]">
                {mainLine.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                        No moves yet
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {mainLine.map((node) => renderMove(node, 0))}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Compact Move List (Linear view)
 */
interface MoveListProps {
    moves: MoveNode[];
    currentNode: MoveNode | null;
    onSelectNode: (node: MoveNode | null) => void;
}

export function MoveList({ moves, currentNode, onSelectNode }: MoveListProps) {
    return (
        <div className="flex flex-wrap gap-1 items-center">
            {/* Starting position button */}
            <button
                onClick={() => onSelectNode(null)}
                className={`px-2 py-1 rounded text-xs font-medium transition ${currentNode === null
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
                    }`}
            >
                Start
            </button>

            {moves.map((node) => {
                const isActive = currentNode?.id === node.id;
                const showMoveNumber = node.color === 'w';

                return (
                    <React.Fragment key={node.id}>
                        {showMoveNumber && (
                            <span className="text-slate-500 text-xs font-mono select-none">
                                {node.moveNumber}.
                            </span>
                        )}
                        <button
                            onClick={() => onSelectNode(node)}
                            className={`px-2 py-1 rounded font-mono text-sm transition ${isActive
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                                }`}
                        >
                            {node.move}
                            {node.annotation.nags.length > 0 && (
                                <span className="text-amber-400 ml-0.5">
                                    {node.annotation.nags.map((nag) => NAG_SYMBOLS[nag] || '').join('')}
                                </span>
                            )}
                        </button>
                    </React.Fragment>
                );
            })}
        </div>
    );
}

