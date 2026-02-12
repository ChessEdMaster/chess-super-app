'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Trophy, Clock, Users, Swords, Rocket, Zap, Brain, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Tournament {
    id: string;
    title: string;
    description: string;
    variant: 'bullet' | 'blitz' | 'rapid';
    start_time: string;
    end_time: string;
    status: 'upcoming' | 'active' | 'finished';
    player_count?: number;
}

export default function TournamentLobbyPage() {
    const { user, loading: authLoading } = useAuth();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            const { data, error } = await supabase
                .from('tournaments')
                .select(`
                    *,
                    tournament_players(count)
                `)
                .order('start_time', { ascending: true });

            if (data) {
                const formatted = data.map((t: any) => ({
                    ...t,
                    player_count: t.tournament_players?.[0]?.count || 0
                }));
                setTournaments(formatted);
            }
            setLoading(false);
        };

        fetchTournaments();
    }, []);

    const getVariantIcon = (variant: string) => {
        switch (variant) {
            case 'bullet': return <Rocket size={16} className="text-orange-400" />;
            case 'blitz': return <Zap size={16} className="text-yellow-400" />;
            case 'rapid': return <Brain size={16} className="text-blue-400" />;
            default: return <Swords size={16} />;
        }
    };

    if (authLoading || loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Carregant Tornejos...</p>
                </div>
            </div>
        );
    }

    const active = tournaments.filter(t => t.status === 'active');
    const upcoming = tournaments.filter(t => t.status === 'upcoming');

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8 pb-24">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/10">
                            <Trophy size={40} className="text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none mb-2">
                                Arena Tournaments
                            </h1>
                            <p className="text-zinc-500 text-sm font-bold tracking-widest uppercase">
                                Competeix per la glòria i recompenses exclusives
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Active Tournaments */}
                    <section className="space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            EN DIRECTE
                        </h2>

                        <div className="space-y-4">
                            {active.length > 0 ? active.map((t) => (
                                <TournamentCard key={t.id} tournament={t} />
                            )) : (
                                <Panel className="p-8 text-center bg-zinc-900/30 border-white/5">
                                    <p className="text-zinc-500 text-xs italic">No hi ha tornejos actius en aquest moment.</p>
                                </Panel>
                            )}
                        </div>
                    </section>

                    {/* Upcoming Tournaments */}
                    <section className="space-y-6">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-3">
                            <Clock size={14} />
                            PROXIMAMENT
                        </h2>

                        <div className="space-y-4">
                            {upcoming.length > 0 ? upcoming.map((t) => (
                                <TournamentCard key={t.id} tournament={t} />
                            )) : (
                                <Panel className="p-8 text-center bg-zinc-900/30 border-white/5">
                                    <p className="text-zinc-500 text-xs italic">No hi ha tornejos programats.</p>
                                </Panel>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function TournamentCard({ tournament }: { tournament: Tournament }) {
    const isLive = tournament.status === 'active';

    return (
        <Link href={`/play/tournaments/${tournament.id}`}>
            <motion.div
                whileHover={{ scale: 1.02, translateY: -2 }}
                className="group"
            >
                <GameCard variant={isLive ? 'blue' : 'default'} className="p-0 overflow-hidden bg-zinc-900/50 border-white/5 transition-all group-hover:border-white/20">
                    <div className="p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                {tournament.variant === 'bullet' && <Rocket size={12} />}
                                {tournament.variant === 'blitz' && <Zap size={12} />}
                                {tournament.variant === 'rapid' && <Brain size={12} />}
                                {tournament.variant}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                                <Users size={12} />
                                {tournament.player_count} Jugadors
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-black italic uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                {tournament.title}
                            </h3>
                            <p className="text-zinc-500 text-xs line-clamp-1 mt-1 font-medium">
                                {tournament.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Inici</span>
                                    <span className="text-xs font-bold text-zinc-300">
                                        {new Date(tournament.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Durada</span>
                                    <span className="text-xs font-bold text-zinc-300">
                                        {Math.round((new Date(tournament.end_time).getTime() - new Date(tournament.start_time).getTime()) / 60000)} min
                                    </span>
                                </div>
                            </div>

                            <div className="p-2 rounded-full bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </div>
                </GameCard>
            </motion.div>
        </Link>
    );
}
