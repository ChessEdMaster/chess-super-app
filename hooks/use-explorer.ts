import { useState, useEffect, useCallback } from 'react';

export interface ExplorerMove {
    uci: string;
    san: string;
    white: number;
    draws: number;
    black: number;
    averageRating: number;
}

export type ExplorerSource = 'masters' | 'lichess' | 'community';

interface UseExplorerOptions {
    fen: string;
    source?: ExplorerSource;
}

export function useExplorer({ fen, source = 'masters' }: UseExplorerOptions) {
    const [moves, setMoves] = useState<ExplorerMove[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ white: 0, draws: 0, black: 0, total: 0 });

    useEffect(() => {
        const fetchOpeningData = async () => {
            if (!fen) return;
            setLoading(true);
            try {
                // Formatting FEN for Lichess API
                // Lichess URL format: https://explorer.lichess.ovh/masters?fen=...
                const cleanFen = fen.replace(/\s+/g, '_'); // Basic URL friendly

                // Determine API
                const endpoint = source === 'masters' ? 'masters' : 'lichess';
                const url = `https://explorer.lichess.ovh/${endpoint}?fen=${encodeURIComponent(fen)}&moves=15`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.moves) {
                    setMoves(data.moves);
                    setStats({
                        white: data.white,
                        draws: data.draws,
                        black: data.black,
                        total: data.white + data.draws + data.black
                    });
                } else {
                    setMoves([]);
                    setStats({ white: 0, draws: 0, black: 0, total: 0 });
                }
            } catch (error) {
                console.error("Explorer fetch error", error);
                setMoves([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce slightly to avoid spamming API on rapid moves
        const t = setTimeout(fetchOpeningData, 300);
        return () => clearTimeout(t);
    }, [fen, source]);

    return {
        moves,
        loading,
        stats
    };
}
