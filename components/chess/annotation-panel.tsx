/**
 * Annotation Panel Component
 * Edit comments, evaluations, and annotations for moves
 */

'use client';

import React, { useState } from 'react';
import { MessageSquare, TrendingUp, Palette, Plus, Trash2, Image as ImageIcon, Smile } from 'lucide-react';
import type { MoveNode, Evaluation } from '@/types/pgn';
import { NAGSelector, NAGDisplay } from './nag-selector';

interface AnnotationPanelProps {
    node: MoveNode | null;
    onAddComment: (text: string, position: 'before' | 'after') => void;
    onUpdateComment: (index: number, text: string) => void;
    onRemoveComment: (index: number) => void;
    onToggleNAG: (nag: number) => void;
    onSetEvaluation: (evaluation: Evaluation | undefined) => void;
    isWorkMode?: boolean;
    onAddImage?: (url: string) => void;
    onRemoveImage?: (index: number) => void;
}

export function AnnotationPanel({
    node,
    onAddComment,
    onUpdateComment,
    onRemoveComment,
    onToggleNAG,
    onSetEvaluation,
    isWorkMode = false,
    onAddImage,
    onRemoveImage,
}: AnnotationPanelProps) {
    const [activeTab, setActiveTab] = useState<'comments' | 'symbols' | 'evaluation' | 'media'>('comments');
    const [newComment, setNewComment] = useState('');
    const [evalType, setEvalType] = useState<'cp' | 'mate'>('cp');
    const [evalValue, setEvalValue] = useState('');
    const [newImageUrl, setNewImageUrl] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const EMOJIS = ['👍', '👎', '🤔', '😮', '❤️', '🔥', '🎯', '🛡️', '⚔️', '🏳️', '🏁', '🕰️', '🧠', '⚡', '💀', '👻', '📉', '📈', '🤝', '👀'];

    if (!node) {
        return (
            <div className="bg-zinc-900/40 border border-white/5 rounded-lg p-4 text-center">
                <p className="text-zinc-500 text-xs italic">
                    Select a move to annotate
                </p>
            </div>
        );
    }

    const handleAddComment = () => {
        if (newComment.trim()) {
            onAddComment(newComment.trim(), 'after');
            setNewComment('');
            setShowEmojiPicker(false);
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setNewComment(prev => prev + emoji);
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

    const handleAddImage = () => {
        if (newImageUrl.trim() && onAddImage) {
            onAddImage(newImageUrl.trim());
            setNewImageUrl('');
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-lg overflow-hidden flex flex-col">
            {/* Minimal Tabs */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex-1 py-2 flex items-center justify-center transition-colors ${activeTab === 'comments' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Comments"
                >
                    <MessageSquare size={14} />
                </button>
                <button
                    onClick={() => setActiveTab('symbols')}
                    className={`flex-1 py-2 flex items-center justify-center transition-colors ${activeTab === 'symbols' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Symbols (NAGs)"
                >
                    <Palette size={14} />
                </button>
                <button
                    onClick={() => setActiveTab('evaluation')}
                    className={`flex-1 py-2 flex items-center justify-center transition-colors ${activeTab === 'evaluation' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Evaluation"
                >
                    <TrendingUp size={14} />
                </button>
                {isWorkMode && (
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex-1 py-2 flex items-center justify-center transition-colors ${activeTab === 'media' ? 'bg-zinc-800 text-pink-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Media"
                    >
                        <ImageIcon size={14} />
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="p-2 min-h-[120px] max-h-60 overflow-y-auto scrollbar-subtle">
                {activeTab === 'comments' && (
                    <div className="space-y-2">
                        {node.annotation.comments.map((comment, index) => (
                            <div key={index} className="flex gap-2 group">
                                <textarea
                                    value={comment.text}
                                    onChange={(e) => onUpdateComment(index, e.target.value)}
                                    className="flex-1 bg-zinc-950/50 text-zinc-300 text-xs p-2 rounded border border-white/5 resize-none focus:outline-none focus:border-zinc-700"
                                    rows={2}
                                />
                                <button
                                    onClick={() => onRemoveComment(index)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all self-start"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-2 relative">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                placeholder="Add comment..."
                                className="flex-1 bg-zinc-950 text-zinc-300 text-xs p-2 rounded border border-white/5 focus:outline-none focus:border-zinc-700"
                            />
                            <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2 ${showEmojiPicker ? 'bg-zinc-700 text-yellow-400' : 'bg-zinc-800 text-zinc-400'} hover:bg-zinc-700 rounded transition-colors`}
                                title="Add Emoji"
                            >
                                <Smile size={14} />
                            </button>
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors disabled:opacity-50"
                            >
                                <Plus size={14} />
                            </button>

                            {/* Emoji Picker Popover */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-full right-0 mb-2 p-2 bg-zinc-900 border border-white/10 rounded-lg shadow-xl grid grid-cols-5 gap-1 w-[160px] z-50">
                                    {EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleEmojiClick(emoji)}
                                            className="hover:bg-zinc-700 p-1 rounded text-sm transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'symbols' && (
                    <div>
                        <NAGSelector
                            selectedNAGs={node.annotation.nags}
                            onToggleNAG={onToggleNAG}
                        />
                    </div>
                )}

                {activeTab === 'evaluation' && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold">Manual Eval</span>
                            <div className="flex bg-zinc-950 rounded p-0.5 ml-auto">
                                <button onClick={() => setEvalType('cp')} className={`px-2 py-0.5 text-[10px] rounded ${evalType === 'cp' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>CP</button>
                                <button onClick={() => setEvalType('mate')} className={`px-2 py-0.5 text-[10px] rounded ${evalType === 'mate' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}>Mate</button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={evalValue}
                                onChange={(e) => setEvalValue(e.target.value)}
                                placeholder={evalType === 'cp' ? "0.00" : "Moves"}
                                className="flex-1 bg-zinc-950 border border-white/5 rounded px-2 text-xs py-1"
                            />
                            <button
                                onClick={handleSetEvaluation}
                                className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1 rounded text-xs border border-indigo-500/20 transition-colors"
                            >
                                Set
                            </button>
                        </div>
                        {node.annotation.evaluation && (
                            <div className="flex items-center justify-between bg-zinc-950/30 p-1.5 rounded border border-white/5 mt-2">
                                <span className="text-xs text-zinc-400 ml-1">Current: <span className="text-zinc-200 font-mono font-bold">{node.annotation.evaluation.type === 'mate' ? `M${node.annotation.evaluation.value}` : (node.annotation.evaluation.value / 100).toFixed(2)}</span></span>
                                <button onClick={() => onSetEvaluation(undefined)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'media' && isWorkMode && (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <input
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
                                placeholder="Image URL..."
                                className="flex-1 bg-zinc-950 text-zinc-300 text-xs p-2 rounded border border-white/5 focus:outline-none focus:border-zinc-700"
                            />
                            <button
                                onClick={handleAddImage}
                                disabled={!newImageUrl.trim()}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors disabled:opacity-50"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {node.annotation.images?.map((url, index) => (
                                <div key={index} className="relative group aspect-video bg-zinc-950 rounded border border-white/5 overflow-hidden">
                                    <img src={url} alt="Attached" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => onRemoveImage && onRemoveImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded hover:bg-red-500 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            {(!node.annotation.images || node.annotation.images.length === 0) && (
                                <p className="col-span-2 text-center text-zinc-500 text-xs py-4">No images attached</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

