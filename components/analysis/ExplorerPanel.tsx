'use client';

import React, { useState } from 'react';
import { useChess } from '@/components/chess/chess-context';
import { useExplorer, ExplorerSource } from '@/hooks/use-explorer';
import { Trophy, Users, Globe, BookOpen } from 'lucide-react';

export function ExplorerPanel() {
    const { fen, makeMove } = useChess();
    const [source, setSource] = useState<ExplorerSource>('masters');
    const { moves, loading, stats } = useExplorer({ fen, source });

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
            </div>

            {/* Stats Header */}
            {!loading && stats.total > 0 && (
                <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--background)] flex justify-between items-center text-[10px] font-mono text-[var(--color-secondary)]">
                    <span>TOTAL: {stats.total.toLocaleString()}</span>
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
                            {moves.map(move => {
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
                                                <div style={{ width: `${getBarWidth(move.white, total)}%` }} className="bg-zinc-200" />
                                                <div style={{ width: `${getBarWidth(move.draws, total)}%` }} className="bg-zinc-500" />
                                                <div style={{ width: `${getBarWidth(move.black, total)}%` }} className="bg-zinc-800" />
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

