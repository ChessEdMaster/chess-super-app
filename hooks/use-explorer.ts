import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Ensure this exists

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
    const [discovery, setDiscovery] = useState<{ by: string, at: string } | null>(null);

    useEffect(() => {
        const fetchOpeningData = async () => {
            if (!fen) return;
            setLoading(true);
            setDiscovery(null);

            try {
                // Formatting FEN for Lichess API
                const cleanFen = fen.replace(/\s+/g, '_');

                if (source === 'community') {
                    // --- SUPABASE COMMUNITY DB ---
                    const { data, error } = await supabase
                        .from('chess_positions')
                        .select('*')
                        .eq('fen', fen)
                        .single();

                    if (data) {
                        setDiscovery({
                            by: data.metadata?.discovered_by || 'Unknown',
                            at: data.metadata?.discovered_at
                        });

                        // Transform stored moves to ExplorerMove format
                        // Assuming data.moves is stored as JSON array of custom objects
                        // We map them to the ExplorerMove interface
                        const dbMoves = data.moves || [];
                        const mappedMoves: ExplorerMove[] = dbMoves.map((m: any) => ({
                            uci: m.uci,
                            san: m.san,
                            white: 0, // Community typically doesn't track w/d/l per move unless specified
                            draws: 0,
                            black: 0,
                            averageRating: 0
                        }));

                        setMoves(mappedMoves);
                        setStats({ white: 0, draws: 0, black: 0, total: mappedMoves.length });
                    } else {
                        // Position not found in community DB
                        setMoves([]);
                        setStats({ white: 0, draws: 0, black: 0, total: 0 });
                    }

                } else {
                    // --- LICHESS API ---
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
                }
            } catch (error) {
                console.error("Explorer fetch error", error);
                setMoves([]);
            } finally {
                setLoading(false);
            }
        };

        const t = setTimeout(fetchOpeningData, 300);
        return () => clearTimeout(t);
    }, [fen, source]);

    return {
        moves,
        loading,
        stats,
        discovery
    };
}
