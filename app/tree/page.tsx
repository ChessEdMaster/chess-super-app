'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Chessboard2D from '@/components/2d/Chessboard2D';
import { Chess } from 'chess.js';
import { supabase } from '@/lib/supabase';
import { AnnotationPanel } from '@/components/chess/annotation-panel';
import { OpeningExplorer } from '@/components/analysis/opening-explorer';
import { ArrowProps, MarkProps } from '@/components/2d/Chessboard2D';
import { MoveNode, Annotation, ChessPositionNode, LogicalMove } from '@/types/pgn';
import { Loader2, Save, Share2, Plus, Play, ExternalLink, Video, Trash2, MousePointer2 } from 'lucide-react';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export default function TreeExplorerPage() {
    const [fen, setFen] = useState(INITIAL_FEN);
    const [positionData, setPositionData] = useState<ChessPositionNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<string[]>([INITIAL_FEN]);
    const [activeTab, setActiveTab] = useState<'moves' | 'annotate' | 'media'>('moves');

    // Fetch and Touch position data
    const fetchPosition = useCallback(async (currentFen: string) => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            const { data, error } = await supabase
                .from('chess_positions')
                .select('*')
                .eq('fen', currentFen)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching position:', error);
            }

            if (data) {
                // Update view count
                const metadata = { ...(data.metadata || {}) };
                metadata.view_count = (metadata.view_count || 0) + 1;
                metadata.last_viewed_at = new Date().toISOString();

                await supabase
                    .from('chess_positions')
                    .update({ metadata })
                    .eq('fen', currentFen);

                setPositionData({ ...data, metadata } as unknown as ChessPositionNode);
            } else {
                // Initialize NEW position (Discovery)
                const newMetadata = {
                    discovered_by: user?.email || 'Anonymous Discovery',
                    discovered_at: new Date().toISOString(),
                    view_count: 1,
                    analysis_status: 'queued'
                };

                const newNode = {
                    fen: currentFen,
                    moves: [],
                    annotations: {
                        comments: [],
                        nags: [],
                        visualAnnotations: [],
                        images: [],
                        videos: [],
                        links: []
                    },
                    metadata: newMetadata
                };

                await supabase.from('chess_positions').insert(newNode);
                setPositionData(newNode as ChessPositionNode);

                // Trigger background analysis (1-minute Stockfish)
                if (session) {
                    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/explore-moves`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ fen: currentFen })
                    }).catch(err => console.error('Failed to trigger analysis:', err));
                }
            }
        } catch (err) {
            console.error('Failed to load/touch position:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosition(fen);
    }, [fen, fetchPosition]);

    const handleMove = (uci: string) => {
        const game = new Chess(fen);
        try {
            game.move(uci);
            const nextFen = game.fen();
            setHistory(prev => [...prev.slice(0, history.indexOf(fen) + 1), nextFen]);
            setFen(nextFen);
        } catch (e) {
            console.error('Invalid move:', uci);
        }
    };

    const handleSave = async () => {
        if (!positionData) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('chess_positions')
                .upsert({
                    fen: positionData.fen,
                    moves: positionData.moves,
                    annotations: positionData.annotations,
                    metadata: positionData.metadata
                });

            if (error) alert('Error saving: ' + error.message);
            else console.log('Saved successfully');
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateAnnotations = (updates: Partial<Annotation>) => {
        if (!positionData) return;
        setPositionData({
            ...positionData,
            annotations: {
                ...positionData.annotations,
                ...updates
            }
        });
    };

    const addLogicalMove = () => {
        const san = prompt('Entra el moviment (ex: e4):');
        if (san) {
            const game = new Chess(fen);
            try {
                const m = game.move(san);
                const moves = [...(positionData?.moves || [])];
                if (!moves.find(xm => xm.uci === m.lan)) {
                    moves.push({
                        uci: m.lan,
                        san: m.san,
                        weight: 0.5,
                        nextFen: game.fen()
                    });
                    setPositionData({ ...positionData!, moves });
                }
            } catch (e) {
                alert('Moviment invàlid');
            }
        }
    }

    const addArrow = () => {
        const from = prompt('Des de (ex: e2):');
        const to = prompt('Fins a (ex: e4):');
        const color = prompt('Color (hex):', '#4f46e5');
        if (from && to && color) {
            const vas = [...(positionData?.annotations.visualAnnotations || [])];
            vas.push({ type: 'arrow', from, to, color });
            updateAnnotations({ visualAnnotations: vas });
        }
    }

    const addMark = () => {
        const square = prompt('Casella (ex: e4):');
        const color = prompt('Color (hex):', '#22c55e');
        if (square && color) {
            const vas = [...(positionData?.annotations.visualAnnotations || [])];
            vas.push({ type: 'highlight', square, color });
            updateAnnotations({ visualAnnotations: vas });
        }
    }

    const addVideo = () => {
        const url = prompt('URL del vídeo (YouTube):');
        const title = prompt('Títol:');
        if (url) {
            const videos = [...(positionData?.annotations.videos || [])];
            videos.push({ url, title: title || '' });
            updateAnnotations({ videos });
        }
    }

    const addLink = () => {
        const url = prompt('URL del web:');
        const title = prompt('Títol del link:');
        if (url && title) {
            const links = [...(positionData?.annotations.links || [])];
            links.push({ url, title });
            updateAnnotations({ links });
        }
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans">
            {/* Left: Board Section */}
            <div className="w-full lg:w-2/3 h-[50vh] lg:h-full relative border-r border-[var(--border)] bg-[var(--background)]">
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="aspect-square w-full max-w-[800px] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden border-[length:var(--card-border-width)] border-[var(--board-border)] bg-[var(--board-bg)] backdrop-blur-xl transition-all">
                        <Chessboard2D
                            fen={fen}
                            onSquareClick={(sq) => console.log('Square:', sq)}
                            arrows={positionData?.annotations.visualAnnotations
                                .filter(va => va.type === 'arrow')
                                .map(va => ({ from: va.from!, to: va.to!, color: va.color })) as ArrowProps[]}
                            marks={positionData?.annotations.visualAnnotations
                                .filter(va => va.type === 'highlight')
                                .map(va => ({ square: va.square!, type: 'circle', color: va.color })) as MarkProps[]}
                        />
                    </div>
                </div>

                {/* Navigation Bar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 bg-[var(--panel-bg)] backdrop-blur-md px-6 py-3 rounded-2xl border border-[var(--border)] z-20 shadow-2xl">
                    <button
                        onClick={() => {
                            const idx = history.indexOf(fen);
                            if (idx > 0) setFen(history[idx - 1]);
                        }}
                        className="p-2 hover:bg-[var(--color-muted)] rounded-xl transition-all disabled:opacity-20 disabled:hover:bg-transparent text-[var(--foreground)]"
                        disabled={history.indexOf(fen) === 0}
                    >
                        <Loader2 className="animate-spin hidden" />
                        <span className="text-xl">←</span>
                    </button>
                    <div className="w-px h-6 bg-[var(--border)] self-center mx-1" />
                    <button
                        onClick={() => {
                            const idx = history.indexOf(fen);
                            if (idx < history.length - 1) setFen(history[idx + 1]);
                        }}
                        className="p-2 hover:bg-[var(--color-muted)] rounded-xl transition-all disabled:opacity-20 disabled:hover:bg-transparent text-[var(--foreground)]"
                        disabled={history.indexOf(fen) === history.length - 1}
                    >
                        <span className="text-xl">→</span>
                    </button>
                </div>
            </div>

            {/* Right: Sidebar Section */}
            <div className="w-full lg:w-1/3 h-[50vh] lg:h-full flex flex-col bg-[var(--panel-bg)] backdrop-blur-2xl border-l border-[var(--border)]">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-[var(--border)] bg-[var(--header-bg)]">
                    <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                            <h1 className="text-xl font-black tracking-tighter bg-gradient-to-br from-[var(--foreground)] to-[var(--color-secondary)] bg-clip-text text-transparent italic leading-tight">
                                INFINITE TREE
                            </h1>
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] text-[var(--color-secondary)] font-mono bg-[var(--color-muted)] px-2 py-0.5 rounded border border-[var(--border)] max-w-[120px] truncate">
                                    {fen}
                                </p>
                                {positionData?.metadata?.view_count && (
                                    <span className="text-[9px] text-[var(--color-secondary)] font-bold bg-[var(--color-muted)] px-2 py-0.5 rounded border border-[var(--border)] flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                                        {positionData.metadata.view_count} VISTES
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--color-muted)] text-white px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                SAVE
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-3 py-2 flex-1 min-w-[140px]">
                            <p className="text-[8px] text-[var(--color-secondary)] uppercase font-black tracking-tighter mb-1">Descobert per</p>
                            <p className="text-[10px] font-bold text-[var(--foreground)] truncate">
                                {positionData?.metadata?.discovered_by || 'Explorador Anònim'}
                            </p>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-3 py-2 flex-1 min-w-[140px]">
                            <p className="text-[8px] text-[var(--color-secondary)] uppercase font-black tracking-tighter mb-1">Estat d'Anàlisi</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${positionData?.metadata?.analysis_status === 'completed' ? 'bg-emerald-500' :
                                        positionData?.metadata?.analysis_status === 'analyzing' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'
                                    }`} />
                                <p className="text-[10px] font-bold text-[var(--foreground)] uppercase">
                                    {positionData?.metadata?.analysis_status || 'Cua d\'espera'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Tabs */}
                <div className="flex p-1 bg-[var(--color-muted)] mx-6 mt-4 rounded-xl border border-[var(--border)]">
                    {[
                        { id: 'moves', label: 'JUGADES', color: 'indigo' },
                        { id: 'annotate', label: 'ANOTACIÓ', color: 'purple' },
                        { id: 'media', label: 'RECURSOS', color: 'pink' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-2 text-[9px] font-black tracking-widest rounded-lg transition-all ${activeTab === tab.id ? `bg-[var(--background)] text-${tab.color}-400 shadow-sm border border-[var(--border)]` : 'text-[var(--color-secondary)] hover:text-[var(--foreground)]'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 space-y-4">
                            <Loader2 size={32} className="animate-spin text-indigo-500/50" />
                            <p className="text-[10px] text-[var(--color-secondary)] font-bold uppercase tracking-widest">Carregant Posició...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'moves' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black text-[var(--color-secondary)] uppercase tracking-widest">Sugeriments Lichess</h3>
                                        </div>
                                        <div className="rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl bg-[var(--card-bg)]">
                                            <OpeningExplorer fen={fen} onSelectMove={handleMove} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center px-1">
                                            <h3 className="text-[10px] font-black text-[var(--color-secondary)] uppercase tracking-widest">Jugades Lògiques</h3>
                                            <button
                                                onClick={addLogicalMove}
                                                className="text-[9px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/20 flex items-center gap-1 transition-all"
                                            >
                                                <Plus size={10} /> NOVA
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {positionData?.moves?.map((m) => (
                                                <div key={m.uci} className="relative group">
                                                    <button
                                                        onClick={() => handleMove(m.uci)}
                                                        className="w-full bg-[var(--color-muted)] hover:bg-indigo-500/10 hover:border-indigo-500/30 p-3 rounded-xl border border-[var(--border)] text-sm font-black transition-all text-[var(--foreground)]"
                                                    >
                                                        {m.san}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const moves = positionData.moves.filter(mu => mu.uci !== m.uci);
                                                            setPositionData({ ...positionData, moves });
                                                        }}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-[var(--background)]"
                                                    >
                                                        <Plus size={10} className="rotate-45" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(!positionData?.moves || positionData.moves.length === 0) && (
                                                <div className="col-span-4 py-8 text-center border-2 border-dashed border-[var(--border)] rounded-2xl text-[10px] text-[var(--color-secondary)] font-bold uppercase tracking-widest">
                                                    Cap jugada personalitzada
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'annotate' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-1">
                                        <AnnotationPanel
                                            node={{
                                                id: 'current',
                                                fen: fen,
                                                move: '',
                                                color: 'w',
                                                moveNumber: 1,
                                                annotation: positionData?.annotations || {
                                                    comments: [],
                                                    nags: [],
                                                    visualAnnotations: [],
                                                    images: []
                                                },
                                                variations: [],
                                                parent: null,
                                                mainLine: true
                                            }}
                                            onAddComment={(text) => {
                                                const comments = [...(positionData?.annotations.comments || [])];
                                                comments.push({ text, position: 'after' });
                                                updateAnnotations({ comments });
                                            }}
                                            onUpdateComment={(idx, text) => {
                                                const comments = [...(positionData?.annotations.comments || [])];
                                                comments[idx].text = text;
                                                updateAnnotations({ comments });
                                            }}
                                            onRemoveComment={(idx) => {
                                                const comments = [...(positionData?.annotations.comments || [])];
                                                comments.splice(idx, 1);
                                                updateAnnotations({ comments });
                                            }}
                                            onToggleNAG={(nag) => {
                                                const nags = [...(positionData?.annotations.nags || [])];
                                                const idx = nags.indexOf(nag);
                                                if (idx > -1) nags.splice(idx, 1);
                                                else nags.push(nag);
                                                updateAnnotations({ nags });
                                            }}
                                            onSetEvaluation={(evalData) => updateAnnotations({ evaluation: evalData })}
                                            isWorkMode={true}
                                            onAddImage={(url) => {
                                                const images = [...(positionData?.annotations.images || [])];
                                                images.push(url);
                                                updateAnnotations({ images });
                                            }}
                                            onRemoveImage={(idx) => {
                                                const images = [...(positionData?.annotations.images || [])];
                                                images.splice(idx, 1);
                                                updateAnnotations({ images });
                                            }}
                                        />
                                    </div>

                                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
                                        <div className="flex items-center gap-2 px-1">
                                            <MousePointer2 size={14} className="text-[var(--color-secondary)]" />
                                            <h3 className="text-[10px] font-black text-[var(--color-secondary)] uppercase tracking-widest">Eines Visuals</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={addArrow}
                                                className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 p-3 rounded-xl text-[10px] font-black border border-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <Share2 size={12} className="rotate-45" /> FLETXA
                                            </button>
                                            <button
                                                onClick={addMark}
                                                className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 p-3 rounded-xl text-[10px] font-black border border-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                            >
                                                <Plus size={12} /> CERCLE
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {positionData?.annotations.visualAnnotations.map((va, i) => (
                                                <div key={i} className="bg-[var(--background)] border border-[var(--border)] rounded-lg pl-3 pr-1 py-1 flex items-center gap-2 group transition-all hover:border-[var(--foreground)]">
                                                    <span className="text-[10px] font-mono text-[var(--color-secondary)]">
                                                        {va.type === 'arrow' ? `${va.from}→${va.to}` : va.square}
                                                    </span>
                                                    <div style={{ backgroundColor: va.color }} className="w-2.5 h-2.5 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.5)]" />
                                                    <button
                                                        onClick={() => {
                                                            const vas = [...(positionData!.annotations.visualAnnotations)];
                                                            vas.splice(i, 1);
                                                            updateAnnotations({ visualAnnotations: vas });
                                                        }}
                                                        className="p-1 text-[var(--color-secondary)] hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'media' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                                                <Video size={12} /> Vídeos
                                            </h3>
                                            <button
                                                onClick={addVideo}
                                                className="text-[9px] bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 px-2 py-1 rounded-md border border-pink-500/20 flex items-center gap-1 transition-all"
                                            >
                                                <Plus size={10} /> AFEGIR
                                            </button>
                                        </div>
                                        <div className="grid gap-2">
                                            {positionData?.annotations.videos?.map((v, i) => (
                                                <div key={i} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between group hover:bg-[var(--color-muted)] transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-pink-600/10 rounded-xl flex items-center justify-center text-pink-500 border border-pink-500/20 shadow-inner">
                                                            <Play size={16} fill="currentColor" />
                                                        </div>
                                                        <div className="max-w-[150px]">
                                                            <p className="text-xs font-black text-[var(--foreground)] truncate">{v.title || 'Sense títol'}</p>
                                                            <p className="text-[9px] text-[var(--color-secondary)] truncate font-mono">{v.url}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a href={v.url} target="_blank" rel="noreferrer" className="p-2 text-[var(--color-secondary)] hover:text-[var(--foreground)] transition-colors bg-[var(--background)] rounded-lg border border-[var(--border)]"><ExternalLink size={12} /></a>
                                                        <button
                                                            onClick={() => {
                                                                const videos = [...(positionData!.annotations.videos!)];
                                                                videos.splice(i, 1);
                                                                updateAnnotations({ videos });
                                                            }}
                                                            className="p-2 text-[var(--color-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-[var(--background)] rounded-lg border border-[var(--border)]"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!positionData?.annotations.videos || positionData.annotations.videos.length === 0) && (
                                                <div className="text-center py-10 border-2 border-dashed border-[var(--border)] rounded-2xl text-[10px] text-[var(--color-secondary)] font-bold uppercase tracking-widest bg-[var(--background)]">
                                                    Cap vídeo vinculat
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                <ExternalLink size={12} /> Enllaços
                                            </h3>
                                            <button
                                                onClick={addLink}
                                                className="text-[9px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded-md border border-indigo-500/20 flex items-center gap-1 transition-all"
                                            >
                                                <Plus size={10} /> AFEGIR
                                            </button>
                                        </div>
                                        <div className="grid gap-2">
                                            {positionData?.annotations.links?.map((l, i) => (
                                                <div key={i} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between group hover:bg-[var(--color-muted)] transition-all">
                                                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 flex-1">
                                                        <div className="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner font-black">
                                                            L
                                                        </div>
                                                        <div className="max-w-[150px]">
                                                            <p className="text-xs font-black text-[var(--foreground)] truncate">{l.title}</p>
                                                            <p className="text-[9px] text-[var(--color-secondary)] truncate font-mono">{l.url}</p>
                                                        </div>
                                                    </a>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 text-[var(--color-secondary)] transition-colors bg-[var(--background)] rounded-lg border border-[var(--border)]"><ExternalLink size={12} /></div>
                                                        <button
                                                            onClick={() => {
                                                                const links = [...(positionData!.annotations.links!)];
                                                                links.splice(i, 1);
                                                                updateAnnotations({ links });
                                                            }}
                                                            className="p-2 text-[var(--color-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-[var(--background)] rounded-lg border border-[var(--border)]"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!positionData?.annotations.links || positionData.annotations.links.length === 0) && (
                                                <div className="text-center py-10 border-2 border-dashed border-[var(--border)] rounded-2xl text-[10px] text-[var(--color-secondary)] font-bold uppercase tracking-widest bg-[var(--background)]">
                                                    Cap enllaç extern
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Status Bar */}
                <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--panel-bg)] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] text-[var(--color-secondary)] uppercase font-black tracking-widest">Connectat: Supabase DB CLANS</span>
                    </div>
                    <span className="text-[9px] text-[var(--color-secondary)] font-mono">v3.4.19-alpha</span>
                </div>
            </div>
        </div>
    );
}
