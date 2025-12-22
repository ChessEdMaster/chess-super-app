'use client';

import React, { useState } from 'react';
import { useChess } from '@/components/chess/chess-context';
import { useExplorer, ExplorerSource, ExplorerMove } from '@/hooks/use-explorer';
import { Trophy, Users, Globe, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function ExplorerPanel() {
    const { fen, makeMove } = useChess();
    const [source, setSource] = useState<ExplorerSource>('masters');
    const { moves, loading, stats, discovery, refresh } = useExplorer({ fen, source });

    const handleAddMove = async () => {
        const san = prompt('Entra el moviment (ex: e4):');
        if (!san) return;

        try {
            // First, get the move to get UCI and nextFen
            const { Chess } = await import('chess.js');
            const game = new Chess(fen);
            const move = game.move(san);
            const nextFen = game.fen();

            // Fetch current position to update
            const { data, error } = await supabase
                .from('chess_positions')
                .select('*')
                .eq('fen', fen)
                .single();

            const { data: { user } } = await supabase.auth.getUser();

            if (data) {
                const existingMoves = data.moves || [];
                if (existingMoves.find((m: any) => m.uci === move.lan)) {
                    toast.error('Aquest moviment ja existeix!');
                    return;
                }

                existingMoves.push({
                    uci: move.lan,
                    san: move.san,
                    weight: 0.5,
                    nextFen: nextFen
                });

                await supabase
                    .from('chess_positions')
                    .update({ moves: existingMoves })
                    .eq('fen', fen);
            } else {
                // Initialize NEW position
                const newNode = {
                    fen: fen,
                    moves: [{
                        uci: move.lan,
                        san: move.san,
                        weight: 0.5,
                        nextFen: nextFen
                    }],
                    annotations: {
                        comments: [],
                        nags: [],
                        visualAnnotations: [],
                        images: [],
                        videos: [],
                        links: []
                    },
                    metadata: {
                        discovered_by: user?.email || 'Anonymous Discovery',
                        discovered_at: new Date().toISOString(),
                        view_count: 1,
                        analysis_status: 'queued'
                    }
                };
                await supabase.from('chess_positions').insert(newNode);
            }

            toast.success('Moviment afegit a la Community DB!');
            refresh();
        } catch (e) {
            toast.error('Moviment invàlid o error de base de dades');
        }
    };

    const getBarWidth = (val: number, total: number) => {
        if (total === 0) return 0;
        return (val / total) * 100;
    };

    return (
        <div className="flex flex-col h-full bg-[var(--panel-bg)]/50 rounded-xl overflow-hidden border border-[var(--border)]">
            {/* Header / Source Selector */}
            <div className="flex border-b border-[var(--border)] bg-[var(--header-bg)]">
                <button
                    onClick={() => setSource('masters')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${source === 'masters' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:bg-[var(--color-muted)]'}`}
                >
                    <Trophy size={14} />
                    Masters
                </button>
                <button
                    onClick={() => setSource('lichess')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${source === 'lichess' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-secondary)] hover:bg-[var(--color-muted)]'}`}
                >
                    <Globe size={14} />
                    Lichess
                </button>
                <button
                    onClick={() => setSource('community')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-colors ${source === 'community' ? 'text-pink-500 bg-pink-500/10 border-b-2 border-pink-500' : 'text-[var(--color-secondary)] hover:bg-[var(--color-muted)]'}`}
                >
                    <Users size={14} />
                    Community
                </button>
            </div>

            {/* Discovery Banner */}
            {source === 'community' && !loading && (
                <div className="px-4 py-2 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between">
                    {discovery ? (
                        <div className="flex flex-col">
                            <span className="text-[9px] text-[var(--color-secondary)] uppercase font-bold">Discovered By</span>
                            <span className="text-xs font-bold text-pink-500">{discovery.by}</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] text-[var(--color-secondary)] italic">New territory! Claim discovery.</span>
                            <button
                                onClick={handleAddMove}
                                className="text-[9px] bg-pink-500 text-white hover:bg-pink-600 px-2 py-1 rounded font-bold flex items-center gap-1 transition-all"
                            >
                                <Plus size={10} /> ADD MOVE
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Stats Header */}
            {!loading && stats.total > 0 && (
                <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--background)] flex justify-between items-center text-[10px] font-mono text-[var(--color-secondary)]">
                    <div className="flex items-center gap-4">
                        <span>TOTAL: {stats.total.toLocaleString()}</span>
                        {source === 'community' && (
                            <button
                                onClick={handleAddMove}
                                className="text-[8px] bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 px-1.5 py-0.5 rounded border border-pink-500/20 font-bold flex items-center gap-0.5 transition-all"
                            >
                                <Plus size={8} /> ADD
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <span className="text-white font-bold">{Math.round((stats.white / stats.total) * 100)}% W</span>
                        <span className="text-zinc-500 font-bold">{Math.round((stats.draws / stats.total) * 100)}% D</span>
                        <span className="text-black dark:text-zinc-400 font-bold">{Math.round((stats.black / stats.total) * 100)}% B</span>
                    </div>
                </div>
            )}

            {/* Moves List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {loading ? (
                    <div className="p-8 text-center text-[var(--color-secondary)] text-xs animate-pulse">
                        Fetching database...
                    </div>
                ) : (
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--color-muted)] text-[var(--color-secondary)] font-bold uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2">Start</th>
                                <th className="px-2 py-2 text-center">Games</th>
                                <th className="px-2 py-2 w-[40%] text-right">Results</th>
                            </tr>
                        </thead>
                        <tbody>
                            {moves.map((move: ExplorerMove) => {
                                const total = move.white + move.draws + move.black;
                                return (
                                    <tr
                                        key={move.uci}
                                        onClick={() => makeMove(move.uci.substring(0, 2), move.uci.substring(2, 4))}
                                        className="border-b border-[var(--border)] hover:bg-[var(--color-muted)] cursor-pointer transition-colors group"
                                    >
                                        <td className="px-3 py-2 font-bold text-[var(--foreground)] font-mono group-hover:text-[var(--color-primary)]">
                                            {move.san}
                                        </td>
                                        <td className="px-2 py-2 text-center text-[var(--color-secondary)]">
                                            {total.toLocaleString()}
                                        </td>
                                        <td className="px-2 py-2">
                                            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-zinc-800">
                                                {total > 0 ? (
                                                    <>
                                                        <div style={{ width: `${getBarWidth(move.white, total)}%` }} className="bg-zinc-200" />
                                                        <div style={{ width: `${getBarWidth(move.draws, total)}%` }} className="bg-zinc-500" />
                                                        <div style={{ width: `${getBarWidth(move.black, total)}%` }} className="bg-zinc-800" />
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full bg-pink-500/20" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {moves.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-[var(--color-secondary)] italic">
                                        No games found in this position.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

