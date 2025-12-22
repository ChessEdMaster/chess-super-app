'use client';

import React from 'react';
import { useSavedGames } from '@/hooks/use-saved-games';
import { useChess } from '@/components/chess/chess-context';
import { Trash2, Calendar, PlayCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DatabasePanel() {
    const { games, loading, deleteGame } = useSavedGames();
    const { setGameFromFen } = useChess();

    // Note: Loading a game typically involves parsing PGN. 
    // Since we are inside the panel, we might need access to a "loadPGN" function from the parent or context.
    // However, for now, let's just assume we might redirect or reload via URL parameter, 
    // OR we expose `loadPgn` in the context.
    // Given the current context only exposes `setGameFromFen`, we might need to update the context later.
    // For this MVP, let's just make clicking it update the URL to ?gameId=... which triggers the load in Page.tsx

    const handleLoadGame = (id: string) => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('gameId', id);
        window.history.pushState({}, '', newUrl.toString());
        // Force reload or trigger event? 
        // Ideally we use Next.js router but that might be a hard navigation.
        // Let's use window.location.assign to force a re-render/refetch in page.tsx
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-full bg-[var(--panel-bg)]/50 rounded-xl overflow-hidden border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--header-bg)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">Saved Analysis</h3>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-2">
                {loading ? (
                    <div className="p-8 text-center text-[var(--color-secondary)] text-xs animate-pulse">
                        Loading games...
                    </div>
                ) : (
                    <>
                        {games.map(game => (
                            <div key={game.id} className="group bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--color-primary)] transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[var(--foreground)] truncate max-w-[150px]">
                                            {game.white} vs {game.black}
                                        </span>
                                        <span className="text-[10px] text-[var(--color-secondary)]">
                                            {game.event || 'Analysis Session'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteGame(game.id)}
                                        className="text-[var(--color-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[9px] text-[var(--color-secondary)] flex items-center gap-1">
                                        <Calendar size={10} />
                                        {formatDistanceToNow(new Date(game.updated_at), { addSuffix: true })}
                                    </span>
                                    <button
                                        onClick={() => handleLoadGame(game.id)}
                                        className="text-[var(--color-primary)] hover:underline text-[10px] font-bold flex items-center gap-1"
                                    >
                                        <PlayCircle size={12} /> LOAD
                                    </button>
                                </div>
                            </div>
                        ))}

                        {games.length === 0 && (
                            <div className="p-8 text-center text-[var(--color-secondary)] text-xs italic">
                                No saved analysis games found.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
