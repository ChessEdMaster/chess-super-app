/**
 * Annotation Panel Component
 * Edit comments, evaluations, and annotations for moves
 */

'use client';

import React, { useState } from 'react';
import { MessageSquare, TrendingUp, Palette, Plus, Trash2 } from 'lucide-react';
import type { MoveNode, Evaluation } from '@/lib/pgn-types';
import { NAGSelector, NAGDisplay } from './nag-selector';

interface AnnotationPanelProps {
    node: MoveNode | null;
    onAddComment: (text: string, position: 'before' | 'after') => void;
    onUpdateComment: (index: number, text: string) => void;
    onRemoveComment: (index: number) => void;
    onToggleNAG: (nag: number) => void;
    onSetEvaluation: (evaluation: Evaluation | undefined) => void;
}

export function AnnotationPanel({
    node,
    onAddComment,
    onUpdateComment,
    onRemoveComment,
    onToggleNAG,
    onSetEvaluation,
}: AnnotationPanelProps) {
    const [activeTab, setActiveTab] = useState<'comments' | 'symbols' | 'evaluation'>('comments');
    const [newComment, setNewComment] = useState('');
    const [evalType, setEvalType] = useState<'cp' | 'mate'>('cp');
    const [evalValue, setEvalValue] = useState('');

    if (!node) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                <MessageSquare className="mx-auto mb-2 text-slate-600" size={32} />
                <p className="text-slate-500 text-sm">
                    Select a move to add annotations
                </p>
            </div>
        );
    }

    const handleAddComment = () => {
        if (newComment.trim()) {
            onAddComment(newComment.trim(), 'after');
            setNewComment('');
        }
    };

    const handleSetEvaluation = () => {
        if (evalValue.trim()) {
            const value = parseFloat(evalValue);
            if (!isNaN(value)) {
                onSetEvaluation({
                    type: evalType,
                    value: evalType === 'cp' ? Math.round(value * 100) : value,
                });
            }
        }
    };

    const handleClearEvaluation = () => {
        onSetEvaluation(undefined);
        setEvalValue('');
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            {/* Header with Move Info */}
            <div className="bg-slate-800 border-b border-slate-700 p-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-slate-400 text-xs">Annotating</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-white font-bold text-lg">{node.move}</span>
                            <NAGDisplay nags={node.annotation.nags} onRemove={onToggleNAG} />
                        </div>
                    </div>
                    <div className="text-xs text-slate-500">
                        Move {node.moveNumber}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === 'comments'
                        ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                >
                    <MessageSquare size={16} />
                    Comments
                </button>
                <button
                    onClick={() => setActiveTab('symbols')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === 'symbols'
                        ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                >
                    <Palette size={16} />
                    Symbols
                </button>
                <button
                    onClick={() => setActiveTab('evaluation')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === 'evaluation'
                        ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                >
                    <TrendingUp size={16} />
                    Evaluation
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto max-h-96">
                {/* Comments Tab */}
                {activeTab === 'comments' && (
                    <div className="space-y-3">
                        {/* Existing Comments */}
                        {node.annotation.comments.map((comment, index) => (
                            <div
                                key={index}
                                className="bg-slate-800 border border-slate-700 rounded-lg p-3 group"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <textarea
                                        value={comment.text}
                                        onChange={(e) => onUpdateComment(index, e.target.value)}
                                        className="flex-1 bg-transparent text-slate-200 text-sm resize-none outline-none"
                                        rows={2}
                                    />
                                    <button
                                        onClick={() => onRemoveComment(index)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add New Comment */}
                        <div className="space-y-2">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm placeholder-slate-500 outline-none focus:border-indigo-500 transition resize-none"
                                rows={3}
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                Add Comment
                            </button>
                        </div>
                    </div>
                )}

                {/* Symbols Tab */}
                {activeTab === 'symbols' && (
                    <div>
                        <NAGSelector
                            selectedNAGs={node.annotation.nags}
                            onToggleNAG={onToggleNAG}
                        />
                    </div>
                )}

                {/* Evaluation Tab */}
                {activeTab === 'evaluation' && (
                    <div className="space-y-4">
                        {/* Current Evaluation Display */}
                        {node.annotation.evaluation && (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-slate-400 mb-1">Current Evaluation</div>
                                        <div className="text-2xl font-bold text-indigo-400">
                                            {node.annotation.evaluation.type === 'mate'
                                                ? `M${node.annotation.evaluation.value}`
                                                : (node.annotation.evaluation.value / 100).toFixed(2)}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClearEvaluation}
                                        className="p-2 hover:bg-red-500/20 text-red-400 rounded transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Set Evaluation */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 mb-2 block">Evaluation Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEvalType('cp')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${evalType === 'cp'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Centipawns
                                    </button>
                                    <button
                                        onClick={() => setEvalType('mate')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${evalType === 'mate'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                            }`}
                                    >
                                        Mate
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 mb-2 block">
                                    Value {evalType === 'cp' ? '(e.g., 1.5 for +1.50)' : '(moves to mate)'}
                                </label>
                                <input
                                    type="number"
                                    step={evalType === 'cp' ? '0.1' : '1'}
                                    value={evalValue}
                                    onChange={(e) => setEvalValue(e.target.value)}
                                    placeholder={evalType === 'cp' ? '0.0' : '0'}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <button
                                onClick={handleSetEvaluation}
                                disabled={!evalValue.trim()}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition"
                            >
                                Set Evaluation
                            </button>
                        </div>

                        {/* Info */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                            <p className="text-xs text-slate-400">
                                💡 Positive values favor White, negative values favor Black
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
