/**
 * PGN Editor Component
 * Main editor for managing PGN games with variations and annotations
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
    Download,
    Upload,
    Copy,
    FileText,
    GitBranch,
    Plus,
    Settings,
    Check,
} from 'lucide-react';
import { PGNTree } from '@/lib/pgn-tree';
import { PGNParser, PGNOptimizer } from '@/lib/pgn-parser';
import type { MoveNode, Evaluation, NAGSymbol } from '@/lib/pgn-types';
import { VariationTree, MoveList } from './variation-tree';
import { AnnotationPanel } from './annotation-panel';

interface PGNEditorProps {
    tree: PGNTree;
    onTreeChange: (tree: PGNTree) => void;
    onPositionChange: (fen: string) => void;
    currentMove?: string; // Last move made
    autoAnnotate?: boolean; // Auto-add engine evaluations
    engineEval?: Evaluation | null;
}

export function PGNEditor({
    tree,
    onTreeChange,
    onPositionChange,
    currentMove,
    autoAnnotate = false,
    engineEval,
}: PGNEditorProps) {
    const [viewMode, setViewMode] = useState<'tree' | 'linear'>('linear');
    const [showAnnotationPanel, setShowAnnotationPanel] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);

    const game = tree.getGame();
    const currentNode = tree.getCurrentNode();

    // Auto-annotate with engine evaluation
    useEffect(() => {
        if (autoAnnotate && engineEval && currentNode) {
            // Create new tree instance for immutability
            const newTree = new PGNTree();
            Object.assign(newTree, tree);
            newTree.setEvaluation(engineEval);
            onTreeChange(newTree);
        }
    }, [engineEval, currentNode?.id, autoAnnotate, tree, onTreeChange]);

    // Handle node selection
    const handleSelectNode = (node: MoveNode | null) => {
        tree.goToNode(node);
        onPositionChange(tree.getCurrentFen());
        onTreeChange(tree);
    };

    // Handle adding comment
    const handleAddComment = (text: string, position: 'before' | 'after') => {
        tree.addComment(text, position);
        onTreeChange(tree);
    };

    // Handle updating comment
    const handleUpdateComment = (index: number, text: string) => {
        tree.updateComment(index, text);
        onTreeChange(tree);
    };

    // Handle removing comment
    const handleRemoveComment = (index: number) => {
        tree.removeComment(index);
        onTreeChange(tree);
    };

    // Handle toggling NAG
    const handleToggleNAG = (nag: NAGSymbol) => {
        if (currentNode?.annotation.nags.includes(nag)) {
            tree.removeNAG(nag);
        } else {
            tree.addNAG(nag);
        }
        onTreeChange(tree);
    };

    // Handle setting evaluation
    const handleSetEvaluation = (evaluation: Evaluation | undefined) => {
        if (evaluation) {
            tree.setEvaluation(evaluation);
        } else {
            // Clear evaluation
            if (currentNode) {
                currentNode.annotation.evaluation = undefined;
            }
        }
        onTreeChange(tree);
    };

    // Handle deleting variation
    const handleDeleteVariation = (variationId: string, parentNode: MoveNode) => {
        // Navigate to parent first
        tree.goToNode(parentNode);
        tree.deleteVariation(variationId);
        onPositionChange(tree.getCurrentFen());
        onTreeChange(tree);
    };

    // Handle promoting variation
    const handlePromoteVariation = (variationId: string, parentNode: MoveNode) => {
        tree.goToNode(parentNode);
        tree.promoteVariation(variationId);
        onTreeChange(tree);
    };

    // Export PGN
    const handleExportPGN = () => {
        const pgn = PGNParser.export(tree, {
            includeVariations: true,
            includeComments: true,
            includeNAGs: true,
            includeEvaluations: true,
            includeClock: false,
            maxLineLength: 80,
            indentVariations: true,
            sortVariations: false,
        });

        // Download as file
        const blob = new Blob([pgn], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-${Date.now()}.pgn`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Copy PGN to clipboard
    const handleCopyPGN = async () => {
        const pgn = PGNParser.export(tree, {
            includeVariations: true,
            includeComments: true,
            includeNAGs: true,
            includeEvaluations: true,
            includeClock: false,
            maxLineLength: 80,
            indentVariations: true,
            sortVariations: false,
        });

        try {
            await navigator.clipboard.writeText(pgn);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy PGN:', error);
        }
    };

    // Import PGN
    const handleImportPGN = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pgn';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const pgnString = e.target?.result as string;
                    try {
                        const newTree = PGNParser.parse(pgnString);
                        onTreeChange(newTree);
                        onPositionChange(newTree.getCurrentFen());
                    } catch (error) {
                        console.error('Failed to import PGN:', error);
                        alert('Error importing PGN file');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                {/* View Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('linear')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${viewMode === 'linear'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <FileText size={16} />
                        Linear
                    </button>
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${viewMode === 'tree'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <GitBranch size={16} />
                        Tree
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={handleImportPGN}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-2 text-white"
                        title="Import PGN"
                    >
                        <Upload size={16} />
                        Import
                    </button>
                    <button
                        onClick={handleCopyPGN}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition flex items-center gap-2 text-white"
                        title="Copy PGN"
                    >
                        {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                        {copySuccess ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handleExportPGN}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition flex items-center gap-2 text-white"
                        title="Export PGN"
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Move Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                        Moves
                    </h3>
                    <div className="text-xs text-slate-500">
                        {game.mainLine.length} moves
                    </div>
                </div>

                <div className="p-4">
                    {viewMode === 'linear' ? (
                        <MoveList
                            moves={game.mainLine}
                            currentNode={currentNode}
                            onSelectNode={handleSelectNode}
                        />
                    ) : (
                        <VariationTree
                            mainLine={game.mainLine}
                            currentNode={currentNode}
                            onSelectNode={handleSelectNode}
                            onDeleteVariation={handleDeleteVariation}
                            onPromoteVariation={handlePromoteVariation}
                        />
                    )}
                </div>
            </div>

            {/* Annotation Panel */}
            {showAnnotationPanel && (
                <AnnotationPanel
                    node={currentNode}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onRemoveComment={handleRemoveComment}
                    onToggleNAG={handleToggleNAG}
                    onSetEvaluation={handleSetEvaluation}
                />
            )}

            {/* Game Info */}
            {(game.metadata.white || game.metadata.black) && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                        Game Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {game.metadata.white && (
                            <div>
                                <div className="text-slate-500 text-xs">White</div>
                                <div className="text-slate-200 font-medium">{game.metadata.white}</div>
                            </div>
                        )}
                        {game.metadata.black && (
                            <div>
                                <div className="text-slate-500 text-xs">Black</div>
                                <div className="text-slate-200 font-medium">{game.metadata.black}</div>
                            </div>
                        )}
                        {game.metadata.event && (
                            <div>
                                <div className="text-slate-500 text-xs">Event</div>
                                <div className="text-slate-200 font-medium">{game.metadata.event}</div>
                            </div>
                        )}
                        {game.metadata.date && (
                            <div>
                                <div className="text-slate-500 text-xs">Date</div>
                                <div className="text-slate-200 font-medium">{game.metadata.date}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
