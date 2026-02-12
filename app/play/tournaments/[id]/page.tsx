'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useTournamentStore } from '@/lib/store/tournament-store';
import { usePlayerStore } from '@/lib/store/player-store';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Trophy, Clock, Users, Swords, Loader2, ArrowLeft, Zap, Rocket, Brain } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function TournamentArenaPage() {
    const { id } = useParams() as { id: string };
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { profile } = usePlayerStore();
    const {
        players,
        isJoined,
        isQueued,
        fetchPlayers,
        joinTournament,
        joinQueue,
        leaveQueue,
        checkIfJoined
    } = useTournamentStore();

    const [tournament, setTournament] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');

    // Load Tournament Details
    useEffect(() => {
        const fetchTournament = async () => {
            const { data, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('id', id)
                .single();
            if (data) setTournament(data);
        };
        fetchTournament();
    }, [id]);

    // Initialize State and Subscriptions
    useEffect(() => {
        if (!user) return;
        checkIfJoined(id, user.id);
        fetchPlayers(id);

        // Real-time subscription for leaderboard updates
        const channel = supabase
            .channel(`tournament-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tournament_players',
                filter: `tournament_id=eq.${id}`
            }, () => {
                fetchPlayers(id);
            })
            // Real-time subscription for pairing (Waiting for a game to be assigned)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'games',
                filter: `status=eq.active`
            }, (payload) => {
                const game = payload.new;
                if (game.tournament_id === id && (game.white_player_id === user.id || game.black_player_id === user.id)) {
                    toast.success("Rival trobat! Iniciant partida...");
                    router.push(`/play/online/${game.id}`);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, user, checkIfJoined, fetchPlayers, router]);

    // Timer Logic
    useEffect(() => {
        if (!tournament) return;
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(tournament.end_time).getTime();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft('FINALITZAT');
                clearInterval(interval);
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [tournament]);

    // Pairing Logic (Simple Client-Side Matchmaker)
    useEffect(() => {
        if (!isQueued || !user) return;

        const pairingInterval = setInterval(async () => {
            // Check if there's someone else in the queue
            const { data: queue } = await supabase
                .from('tournament_queue')
                .select('*')
                .eq('tournament_id', id)
                .neq('user_id', user.id)
                .order('joined_at', { ascending: true })
                .limit(1);

            if (queue && queue.length > 0) {
                const rival = queue[0];

                // Deterministic creation: only the player with the "smaller" UUID creates the game
                // This avoids race conditions where both try to create a game
                if (user.id < rival.user_id) {
                    console.log("Creating game against", rival.user_id);

                    try {
                        // Create the game
                        const { data: game, error } = await supabase
                            .from('games')
                            .insert({
                                tournament_id: id,
                                white_player_id: Math.random() > 0.5 ? user.id : rival.user_id,
                                black_player_id: user.id === (Math.random() > 0.5 ? user.id : rival.user_id) ? rival.user_id : user.id,
                                status: 'active',
                                variant: tournament.variant,
                                fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                                white_time: tournament.settings?.time_control || 180,
                                black_time: tournament.settings?.time_control || 180,
                                increment: tournament.settings?.increment || 2
                            })
                            .select()
                            .single();

                        if (game) {
                            // Remove both from queue
                            await supabase.from('tournament_queue').delete().match({ tournament_id: id }).in('user_id', [user.id, rival.user_id]);
                        }
                    } catch (err) {
                        console.error("Pairing failed", err);
                    }
                }
            }
        }, 3000);

        return () => clearInterval(pairingInterval);
    }, [isQueued, user, id, tournament]);

    if (authLoading || !tournament) {
        return (
            <div className="h-screen flex items-center justify-center bg-zinc-950">
                <Loader2 className="animate-spin text-blue-500" />
            </div>
        );
    }

    const handleJoin = () => {
        if (!user) return;
        joinTournament(id, user.id);
    };

    const handlePlay = () => {
        if (!user || !isJoined) return;
        if (isQueued) {
            leaveQueue(id, user.id);
        } else {
            joinQueue(id, user.id, profile.elo_blitz || 1500);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/play/tournaments">
                            <button className="p-3 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{tournament.variant} Arena</span>
                                <div className="w-1 h-1 bg-zinc-700 rounded-full" />
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{players.length} participants</span>
                            </div>
                            <h1 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">
                                {tournament.title}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="bg-zinc-900 border border-white/5 px-6 py-3 rounded-2xl text-center flex-1 md:flex-none">
                            <div className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-1">Temps Restant</div>
                            <div className="text-2xl font-mono font-black text-amber-500">{timeLeft}</div>
                        </div>

                        {!isJoined ? (
                            <ShinyButton onClick={handleJoin} variant="primary" className="px-10 py-4 h-full">
                                UNIR-SE AL TORNEIG
                            </ShinyButton>
                        ) : (
                            <ShinyButton
                                onClick={handlePlay}
                                variant={isQueued ? "secondary" : "primary"}
                                className={`px-10 py-4 h-full ${isQueued ? 'bg-zinc-800 border-zinc-700' : ''}`}
                            >
                                {isQueued ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="animate-spin" size={18} />
                                        CANCEL·LAR CERCА
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Swords size={18} />
                                        SEGÜENT PARTIDA
                                    </div>
                                )}
                            </ShinyButton>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Leaderboard Section */}
                    <div className="lg:col-span-8">
                        <Panel className="bg-zinc-900/40 border-white/5 p-0 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                    <Trophy size={14} className="text-amber-500" />
                                    CLASSIFICACIÓ EN DIRECTE
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Rang</th>
                                            <th className="px-6 py-4">Jugador</th>
                                            <th className="px-6 py-4 text-center">Punts</th>
                                            <th className="px-6 py-4 text-center">Perf</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {players.map((p, idx) => (
                                            <tr key={p.user_id} className={`hover:bg-white/5 transition-colors ${p.user_id === user?.id ? 'bg-blue-600/5' : ''}`}>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        {idx < 3 ? (
                                                            <div className={`
                                                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-black
                                                                ${idx === 0 ? 'bg-amber-500 text-black' :
                                                                    idx === 1 ? 'bg-zinc-300 text-black' :
                                                                        'bg-amber-700 text-white'}
                                                            `}>
                                                                {idx + 1}
                                                            </div>
                                                        ) : (
                                                            <span className="w-8 text-center text-sm font-black text-zinc-600">
                                                                {idx + 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-zinc-800 rounded-lg border border-white/10 overflow-hidden">
                                                            {p.profiles?.avatar_url && <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                                                        </div>
                                                        <span className="font-black italic uppercase tracking-tight text-white">
                                                            {p.profiles?.username || 'Anònim'}
                                                        </span>
                                                        {p.user_id === user?.id && (
                                                            <span className="bg-blue-600/20 text-blue-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border border-blue-500/20">Tu</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-xl font-black text-white">{p.score}</span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="text-xs font-mono text-zinc-500 font-bold">{p.performance}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Panel>
                    </div>

                    {/* Info Section */}
                    <div className="lg:col-span-4 space-y-6">
                        <Panel className="bg-zinc-900 border-white/5 p-6">
                            <h3 className="text-sm font-black uppercase text-zinc-400 tracking-wider mb-6 flex items-center gap-2">
                                <Swords size={16} className="text-blue-500" />
                                REGLAMENT ARENA
                            </h3>
                            <div className="space-y-4">
                                <RuleItem title="Puntuació" info="2 punts Victòria, 1 Empat, 0 Derrota." />
                                <RuleItem title="Continuitat" info="En acabar una partida, torna a la cua immediatament." />
                                <RuleItem title="Berserk" info="Es redueix el temps a la meitat per +1 punt extra (Pròximament)." />
                                <RuleItem title="Arena Streak" info="Després de 2 victòries seguides, els punts es dupliquen." />
                            </div>
                        </Panel>

                        <Panel className="bg-gradient-to-br from-blue-900/20 to-zinc-900 border-blue-500/10 p-6">
                            <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-2">Recompenses de Podi</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Rocket size={16} /></div>
                                    <div className="text-xs font-bold text-zinc-300">Cofre Llegendari + 500 Or</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-300/20 rounded-lg text-zinc-300"><Zap size={16} /></div>
                                    <div className="text-xs font-bold text-zinc-300">Cofre d'Or + 250 Or</div>
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RuleItem({ title, info }: { title: string, info: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider font-mono">{title}</span>
            <span className="text-xs text-zinc-300 font-medium leading-relaxed">{info}</span>
        </div>
    );
}
