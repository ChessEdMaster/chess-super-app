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
    Check,
    Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PGNTagsEditor } from './pgn-tags-editor';
import { PGNTree } from '@/lib/pgn/tree';
import { PGNParser } from '@/lib/pgn/parser';
import type { MoveNode, Evaluation, NAGSymbol, PGNMetadata } from '@/types/pgn';
import { VariationTree, MoveList } from './variation-tree';
import { AnnotationPanel } from './annotation-panel';

interface PGNEditorProps {
    tree: PGNTree;
    onTreeChange: (tree: PGNTree) => void;
    onPositionChange: (fen: string) => void;
    currentMove?: string; // Last move made
    autoAnnotate?: boolean; // Auto-add engine evaluations
    engineEval?: Evaluation | null;
    isWorkMode?: boolean;
    onAddImage?: (url: string) => void;
    onRemoveImage?: (index: number) => void;
}

export function PGNEditor({
    tree,
    onTreeChange,
    onPositionChange,
    autoAnnotate = false,
    engineEval,
    isWorkMode = false,
    onAddImage,
    onRemoveImage,
}: PGNEditorProps) {
    const [viewMode, setViewMode] = useState<'tree' | 'linear'>('linear');
    const [showAnnotationPanel] = useState(true);
    const [isTagsEditorOpen, setIsTagsEditorOpen] = useState(false);

    const game = tree.getGame();
    const currentNode = tree.getCurrentNode();

    // Auto-annotate with engine evaluation
    useEffect(() => {
        if (autoAnnotate && engineEval && currentNode) {
            const currentEval = currentNode.annotation.evaluation;
            if (
                currentEval &&
                currentEval.type === engineEval.type &&
                currentEval.value === engineEval.value
            ) {
                return;
            }

            const newTree = new PGNTree();
            Object.assign(newTree, tree);
            newTree.setEvaluation(engineEval);
            onTreeChange(newTree);
        }
    }, [engineEval, currentNode, autoAnnotate, tree, onTreeChange]);

    const handleSelectNode = (node: MoveNode | null) => {
        tree.goToNode(node);
        onPositionChange(tree.getCurrentFen());
        onTreeChange(tree);
    };

    const handleAddComment = (text: string, position: 'before' | 'after') => {
        tree.addComment(text, position);
        onTreeChange(tree);
    };

    const handleUpdateComment = (index: number, text: string) => {
        tree.updateComment(index, text);
        onTreeChange(tree);
    };

    const handleRemoveComment = (index: number) => {
        tree.removeComment(index);
        onTreeChange(tree);
    };

    const handleToggleNAG = (nag: NAGSymbol) => {
        if (currentNode?.annotation.nags.includes(nag)) {
            tree.removeNAG(nag);
        } else {
            tree.addNAG(nag);
        }
        onTreeChange(tree);
    };

    const handleSetEvaluation = (evaluation: Evaluation | undefined) => {
        if (evaluation) {
            tree.setEvaluation(evaluation);
        } else {
            const node = tree.getCurrentNode();
            if (node) {
                node.annotation.evaluation = undefined;
            }
        }
        onTreeChange(tree);
    };

    const handleDeleteVariation = (variationId: string, parentNode: MoveNode) => {
        tree.goToNode(parentNode);
        tree.deleteVariation(variationId);
        onPositionChange(tree.getCurrentFen());
        onTreeChange(tree);
    };

    const handlePromoteVariation = (variationId: string, parentNode: MoveNode) => {
        tree.goToNode(parentNode);
        tree.promoteVariation(variationId);
        onTreeChange(tree);
    };

    const handleAddImage = (url: string) => {
        tree.addImage(url);
        onTreeChange(tree);
    };

    const handleRemoveImage = (index: number) => {
        tree.removeImage(index);
        onTreeChange(tree);
    };

    const handleUpdateMetadata = (newMetadata: PGNMetadata) => {
        tree.setMetadata(newMetadata);
        onTreeChange(tree);
    };

    return (
        <div className="flex flex-col h-full gap-2">
            {/* Header Info */}
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/50 rounded-lg border border-white/5">
                <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                        <span className="text-zinc-200">{game.metadata.White || 'White'}</span>
                        <span className="text-zinc-500 font-light">vs</span>
                        <span className="text-zinc-200">{game.metadata.Black || 'Black'}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                        {game.metadata.Event || 'Analysis'} • {game.metadata.Date || '????.??.??'}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTagsEditorOpen(true)}
                    className="h-8 px-2 text-xs gap-1.5 text-zinc-400 hover:text-white"
                >
                    <Settings2 size={14} />
                    Game Info
                </Button>
            </div>

            {/* Move Display */}
            <div className="flex-1 bg-zinc-950/30 rounded-lg overflow-y-auto scrollbar-subtle border border-white/5 relative group">
                {/* View Mode Toggle - Floating */}
                <div className="absolute top-2 right-2 bg-zinc-900/90 backdrop-blur border border-white/10 rounded-lg p-0.5 z-10 flex text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setViewMode('linear')}
                        className={`px-2 py-1 rounded ${viewMode === 'linear' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Linear
                    </button>
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`px-2 py-1 rounded ${viewMode === 'tree' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        Tree
                    </button>
                </div>

                <div className="p-3">
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
                <div className="shrink-0 bg-transparent">
                    <AnnotationPanel
                        node={currentNode}
                        onAddComment={handleAddComment}
                        onUpdateComment={handleUpdateComment}
                        onRemoveComment={handleRemoveComment}
                        onToggleNAG={handleToggleNAG}
                        onSetEvaluation={handleSetEvaluation}
                        isWorkMode={isWorkMode}
                        onAddImage={handleAddImage}
                        onRemoveImage={handleRemoveImage}
                    />
                </div>
            )}

            <PGNTagsEditor
                isOpen={isTagsEditorOpen}
                onClose={() => setIsTagsEditorOpen(false)}
                metadata={game.metadata}
                onSave={handleUpdateMetadata}
            />
        </div>
    );
}

