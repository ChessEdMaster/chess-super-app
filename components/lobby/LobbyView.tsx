'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Challenge } from '@/types/lobby';
import { Zap, Timer, Turtle, Swords, Plus, Loader2, Trophy, Map as MapIcon, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { CreateChallengeModal } from '@/components/lobby/create-challenge-modal';
import { LobbyMap } from '@/components/lobby/lobby-map';

interface LobbyViewProps {
    user: any;
    onJoinGame: (gameId: string) => void;
}

export function LobbyView({ user, onJoinGame }: LobbyViewProps) {
    const [selectedLeague, setSelectedLeague] = useState<'bullet' | 'blitz' | 'rapid'>('blitz');
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const leagues = [
        { id: 'bullet', icon: Zap, color: 'text-yellow-400', label: 'Bullet (1+0)' },
        { id: 'blitz', icon: Timer, color: 'text-blue-400', label: 'Blitz (3+2)' },
        { id: 'rapid', icon: Turtle, color: 'text-green-400', label: 'Rapid (10+0)' },
    ] as const;

    const fetchChallenges = async () => {
        setLoading(true);
        // Fetch ALL open challenges for the map
        const { data, error } = await supabase
            .from('challenges')
            .select(`*, host:profiles(username, avatar_url)`)
            .eq('status', 'open');

        if (error) console.error("Error fetching challenges:", error);
        if (data) {
            setAllChallenges(data as unknown as Challenge[]);
            setChallenges((data as unknown as Challenge[]).filter(c => c.time_control_type === selectedLeague));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchChallenges();

        const channel = supabase
            .channel(`lobby_challenges_realtime`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'challenges',
                filter: `status=eq.open`
            }, fetchChallenges)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        setChallenges(allChallenges.filter(c => c.time_control_type === selectedLeague));
    }, [selectedLeague, allChallenges]);

    // Listen for MY challenge being accepted
    useEffect(() => {
        if (!user) return;

        const hostChannel = supabase
            .channel(`host_challenge_lobby_${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'challenges',
                filter: `host_id=eq.${user.id}`
            }, (payload) => {
                const updated = payload.new as any;
                if (updated.status === 'accepted') {
                    toast.success("Oponent trobat!");
                    onJoinGame(updated.id);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(hostChannel); };
    }, [user, onJoinGame]);

    const handleJoin = async (challenge: Challenge) => {
        if (!user) return;
        if (challenge.host_id === user.id) {
            onJoinGame(challenge.id);
            return;
        }

        // Determine color and join
        const { data: game } = await supabase.from('games').select('*').eq('id', challenge.id).single();
        if (!game) return;

        const joinAsWhite = game.white_player_id === null;
        const { error } = await supabase
            .from('games')
            .update({
                white_player_id: joinAsWhite ? user.id : game.white_player_id,
                black_player_id: joinAsWhite ? game.black_player_id : user.id,
                status: 'active'
            })
            .eq('id', challenge.id);

        if (!error) {
            await supabase.from('challenges').update({ status: 'accepted' }).eq('id', challenge.id);
            onJoinGame(challenge.id);
        } else {
            toast.error("Error unint-se a la partida");
        }
    };

    return (
        <div className="w-full flex flex-col gap-6 max-w-5xl mx-auto py-6 px-4">
            {/* Rhythm Selector & View Toggle */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-black text-white italic tracking-tighter text-glow">L'ARENA DE REPTES</h2>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Elegeix el teu destí</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3">
                    <div className="glass-panel bg-white/5 border-white/10 rounded-xl p-1.5 flex gap-1.5 backdrop-blur-2xl shadow-2xl">
                        {leagues.map((league) => (
                            <button
                                key={league.id}
                                onClick={() => setSelectedLeague(league.id)}
                                className={cn(
                                    "px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all min-w-[100px] justify-center",
                                    selectedLeague === league.id
                                        ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105 font-bold"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <league.icon size={18} className={cn(selectedLeague === league.id ? "text-black" : league.color)} />
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-black uppercase tracking-wider">{league.label.split(' ')[0]}</span>
                                    <span className="text-[8px] opacity-70 font-mono">{league.label.split(' ')[1]}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="bg-zinc-900/50 p-1.5 rounded-xl border border-white/5 flex gap-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-2.5 rounded-lg transition-all", viewMode === 'list' ? "bg-zinc-800 text-amber-500 shadow-inner" : "text-zinc-500 hover:text-zinc-300")}
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={cn("p-2.5 rounded-lg transition-all", viewMode === 'map' ? "bg-zinc-800 text-amber-500 shadow-inner" : "text-zinc-500 hover:text-zinc-300")}
                        >
                            <MapIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    {viewMode === 'map' ? (
                        <motion.div
                            key="map-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="w-full"
                        >
                            <LobbyMap
                                challenges={allChallenges}
                                onJoin={handleJoin}
                                onEnterOwnChallenge={(c) => onJoinGame(c.id)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid gap-4 max-w-4xl mx-auto w-full"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-black text-zinc-400 flex items-center gap-2 italic uppercase">
                                    <Swords className="text-amber-500" size={20} /> Reptes {selectedLeague}
                                </h3>
                                <ShinyButton onClick={() => setIsChallengeModalOpen(true)} className="h-10 px-6 font-bold text-xs uppercase tracking-widest">
                                    <Plus size={16} className="mr-2" /> Crear Repte
                                </ShinyButton>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-20 text-zinc-500">
                                    <Loader2 className="animate-spin mr-2" /> Carregant reptes...
                                </div>
                            ) : challenges.length === 0 ? (
                                <div className="bg-white/2 border-2 border-dashed border-white/5 rounded-2xl p-12 text-center">
                                    <Trophy className="mx-auto mb-4 text-zinc-700" size={48} />
                                    <p className="text-zinc-500 font-bold">No hi ha reptes actius en aquest moment per a {selectedLeague}.</p>
                                    <p className="text-zinc-600 text-xs mt-1">Sigues tu el primer en crear-ne un!</p>
                                </div>
                            ) : (
                                challenges.map((challenge) => (
                                    <motion.div
                                        key={challenge.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group bg-slate-900/50 border border-white/10 p-5 rounded-2xl flex items-center justify-between hover:border-amber-500/50 transition-all hover:bg-slate-900"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-zinc-800 border-2 border-white/5 overflow-hidden flex items-center justify-center shadow-inner">
                                                {challenge.host?.avatar_url ? (
                                                    <img src={challenge.host.avatar_url} alt={challenge.host.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl font-black text-zinc-600 uppercase">{challenge.host?.username?.[0] || 'U'}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-white text-lg tracking-tight">{challenge.host?.username || 'Guerrier'}</span>
                                                    <span className="bg-black text-amber-500 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-900/50 font-bold">1200</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Timer size={12} className="text-emerald-500" /> {challenge.time_control_type}</span>
                                                    <span className="flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> {challenge.rated ? 'Competitiu' : 'Casual'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleJoin(challenge)}
                                            className={cn(
                                                "px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all",
                                                challenge.host_id === user.id
                                                    ? "bg-zinc-800 text-zinc-500 cursor-wait"
                                                    : "bg-amber-500 text-black hover:bg-amber-400 hover:scale-105 shadow-lg shadow-amber-500/20"
                                            )}
                                        >
                                            {challenge.host_id === user.id ? 'Esperant...' : 'LLUITAR'}
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Quick Create Floating Button for Map View */}
            <AnimatePresence>
                {viewMode === 'map' && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50"
                    >
                        <ShinyButton onClick={() => setIsChallengeModalOpen(true)} className="h-14 px-10 font-black text-sm uppercase tracking-widest shadow-2xl">
                            <Plus size={20} className="mr-3" /> Crear Nou Repte
                        </ShinyButton>
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateChallengeModal
                isOpen={isChallengeModalOpen}
                onClose={() => setIsChallengeModalOpen(false)}
                defaultTimeControl={selectedLeague}
            />
        </div>
    );
}
