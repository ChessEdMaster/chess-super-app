'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Game {
    id: string;
    white_player_id: string;
    black_player_id: string;
    result: string;
    created_at: string;
    white?: { username: string };
    black?: { username: string };
}

export default function GamesHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadGames();
        }
    }, [user]);

    const loadGames = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('games')
                .select(`
                    id,
                    white_player_id,
                    black_player_id,
                    result,
                    created_at,
                    white:white_player_id(username),
                    black:black_player_id(username)
                `)
                .or(`white_player_id.eq.${user?.id},black_player_id.eq.${user?.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGames(data as any || []);
        } catch (error) {
            console.error('Error loading games:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6">
            <div className="max-w-4xl mx-auto">
                <Link href="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6">
                    <ArrowLeft size={20} /> Back to Profile
                </Link>

                <h1 className="text-3xl font-bold text-white mb-8">Game History</h1>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    {games.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No games played yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {games.map((game) => {
                                const isWhite = game.white_player_id === user?.id;
                                let opponentName = 'Stockfish (CPU)';
                                if (isWhite) {
                                    if (game.black_player_id) opponentName = game.black?.username || 'Player 2';
                                } else {
                                    if (game.white_player_id) opponentName = game.white?.username || 'Player 1';
                                }

                                let outcomeColor = 'text-slate-400';
                                let outcomeLabel = 'Draw';

                                if (game.result === '1/2-1/2') {
                                    outcomeLabel = '🤝 Draw';
                                } else if ((isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1')) {
                                    outcomeLabel = '🏆 Won';
                                    outcomeColor = 'text-emerald-400';
                                } else {
                                    outcomeLabel = '❌ Lost';
                                    outcomeColor = 'text-red-400';
                                }

                                return (
                                    <div
                                        key={game.id}
                                        onClick={() => router.push(`/analysis?gameId=${game.id}`)}
                                        className="p-4 hover:bg-slate-800/50 transition flex flex-col sm:flex-row justify-between items-center gap-4 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg ${isWhite ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>
                                                {isWhite ? 'W' : 'B'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">vs {opponentName}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(game.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-right">
                                                <p className={`font-bold ${outcomeColor}`}>{outcomeLabel}</p>
                                                <p className="text-xs text-slate-600 font-mono">{game.result}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
