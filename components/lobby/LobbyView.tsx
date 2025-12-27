'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Challenge } from '@/types/lobby';
import { Zap, Timer, Turtle, Swords, Plus, Loader2, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { CreateChallengeModal } from '@/components/lobby/create-challenge-modal';

interface LobbyViewProps {
    user: any;
    onJoinGame: (gameId: string) => void;
}

export function LobbyView({ user, onJoinGame }: LobbyViewProps) {
    const [selectedLeague, setSelectedLeague] = useState<'bullet' | 'blitz' | 'rapid'>('blitz');
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const leagues = [
        { id: 'bullet', icon: Zap, color: 'text-yellow-400', label: 'Bullet (1+0)' },
        { id: 'blitz', icon: Timer, color: 'text-blue-400', label: 'Blitz (3+2)' },
        { id: 'rapid', icon: Turtle, color: 'text-green-400', label: 'Rapid (10+0)' },
    ] as const;

    useEffect(() => {
        const fetchChallenges = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('challenges')
                .select(`*, host:profiles(username, avatar_url)`)
                .eq('status', 'open')
                .eq('time_control_type', selectedLeague);

            if (error) console.error("Error fetching challenges:", error);
            if (data) setChallenges(data as unknown as Challenge[]);
            setLoading(false);
        };

        fetchChallenges();

        const channel = supabase
            .channel(`lobby_challenges_${selectedLeague}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'challenges',
                filter: `status=eq.open` // Simplified filter, real filtering in effect or refined here
            }, fetchChallenges)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedLeague]);

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
        <div className="w-full flex flex-col gap-8 max-w-4xl mx-auto py-8 px-4">
            {/* Rhythm Selector */}
            <div className="flex flex-col items-center gap-6">
                <h2 className="text-3xl font-black text-white italic tracking-tighter text-glow">ESCULLEIX EL TEU RITME</h2>

                <div className="glass-panel bg-white/5 border-white/10 rounded-2xl p-2 flex gap-2 backdrop-blur-2xl shadow-2xl">
                    {leagues.map((league) => (
                        <button
                            key={league.id}
                            onClick={() => setSelectedLeague(league.id)}
                            className={cn(
                                "px-6 py-4 rounded-xl flex flex-col items-center gap-2 transition-all min-w-[120px]",
                                selectedLeague === league.id
                                    ? "bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105"
                                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <league.icon size={24} className={cn(selectedLeague === league.id ? "text-black" : league.color)} />
                            <span className="text-xs font-black uppercase tracking-widest">{league.label.split(' ')[0]}</span>
                            <span className="text-[10px] opacity-70 font-mono">{league.label.split(' ')[1]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Challenge List */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-zinc-400 flex items-center gap-2 italic uppercase">
                        <Swords className="text-amber-500" size={20} /> Reptes Oberts
                    </h3>
                    <ShinyButton onClick={() => setIsChallengeModalOpen(true)} className="h-10 px-6 font-bold text-xs uppercase tracking-widest">
                        <Plus size={16} className="mr-2" /> Crear Repte
                    </ShinyButton>
                </div>

                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 text-zinc-500">
                                <Loader2 className="animate-spin mr-2" /> Carregant reptes...
                            </div>
                        ) : challenges.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white/2 border-2 border-dashed border-white/5 rounded-2xl p-12 text-center"
                            >
                                <Trophy className="mx-auto mb-4 text-zinc-700" size={48} />
                                <p className="text-zinc-500 font-bold">No hi ha reptes actius en aquest moment.</p>
                                <p className="text-zinc-600 text-xs mt-1">Sigues tu el primer en crear-ne un!</p>
                            </motion.div>
                        ) : (
                            challenges.map((challenge) => (
                                <motion.div
                                    key={challenge.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
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
                    </AnimatePresence>
                </div>
            </div>

            <CreateChallengeModal
                isOpen={isChallengeModalOpen}
                onClose={() => setIsChallengeModalOpen(false)}
                defaultTimeControl={selectedLeague}
            />
        </div>
    );
}
