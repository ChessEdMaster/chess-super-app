'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { usePlayerStore } from '@/lib/store/player-store';
import { useArenaStore } from '@/lib/store/arena-store';
import { ChestGrid } from '@/components/lobby/chest-grid';
import { ArenaPath } from '@/components/arena/arena-path';
import { ArenaVariant } from '@/types/arena';
import { ChestOpeningModal } from '@/components/cards/chest-opening-modal';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Trophy, Archive, ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function FeaturesPage() {
    const { user, loading: authLoading } = useAuth();
    const { chests, profile, loadProfile, openChest, startUnlockChest } = usePlayerStore();
    const { progress, fetchArenaProgress, claimChest } = useArenaStore();
    const router = useRouter();

    const [openingRewards, setOpeningRewards] = useState<any>(null);
    const [selectedArena, setSelectedArena] = useState<ArenaVariant>('blitz');

    useEffect(() => {
        if (user) {
            loadProfile(user.id);
            fetchArenaProgress(user.id);
        }
    }, [user, loadProfile, fetchArenaProgress]);

    useEffect(() => {
        if (!authLoading && user && profile.id && profile.role !== 'SuperAdmin') {
            router.push('/');
        }
    }, [authLoading, user, profile.role, profile.id, router]);

    const handleOpenChest = (index: number) => {
        const chest = chests[index];
        if (!chest) return;

        if (chest.status === 'READY') {
            const rewards = openChest(index);
            if (rewards) setOpeningRewards(rewards);
        } else if (chest.status === 'LOCKED') {
            if (startUnlockChest(index)) {
                toast.success("Desbloqueig iniciat!");
            } else {
                toast.error("Ja hi ha un cofre en procés.");
            }
        }
    };

    if (authLoading || !user || (profile.id && profile.role !== 'SuperAdmin')) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <ChevronLeft size={24} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Laboratori i Features</h1>
                            <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Gestiona el teu progrés i col·lecció</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={async () => {
                                if (confirm("Segur que vols esborrar TOTS els reptes oberts?")) {
                                    const { error } = await supabase.from('challenges').delete().eq('status', 'open');
                                    if (error) toast.error("Error esborrant reptes");
                                    else toast.success("Reptes esborrats correctament");
                                }
                            }}
                            className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            Reset Reptes
                        </button>
                    </div>
                </div>

                {/* Development / Beta Features Links */}
                <div className="flex flex-wrap gap-4">
                    {[
                        { label: 'Arcade', href: '/play/arcade', color: 'text-pink-400', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                        { label: 'Kingdom', href: '/kingdom', color: 'text-emerald-400', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                        { label: 'Cards', href: '/cards', color: 'text-amber-400', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                        { label: 'Vision', href: '/improve/vision', color: 'text-cyan-400', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
                        { label: 'Puzzles', href: '/puzzles', color: 'text-violet-400', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    ].map(feat => (
                        <Link
                            key={feat.label}
                            href={feat.href}
                            className={`flex items-center gap-2 px-4 py-3 bg-[var(--card-bg)] border border-white/5 rounded-xl hover:border-white/20 hover:scale-105 transition-all group`}
                        >
                            <svg className={`w-4 h-4 ${feat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
                            </svg>
                            <span className={`text-xs font-black uppercase tracking-widest ${feat.color}`}>{feat.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Chests */}
                    <div className="lg:col-span-4 space-y-6">
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Archive size={20} className="text-amber-500" />
                                <h2 className="text-lg font-black uppercase italic tracking-tight">Els teus Cofres</h2>
                            </div>
                            <GameCard variant="gold" className="p-6 bg-slate-900/50 border-white/5">
                                <ChestGrid
                                    chests={chests}
                                    slots={4}
                                    onOpenChest={handleOpenChest}
                                />
                                <p className="text-[10px] text-zinc-500 mt-6 text-center font-bold uppercase tracking-widest px-4">
                                    Guanys més cofres guanyant partides a l'Arena
                                </p>
                            </GameCard>
                        </section>

                        <section className="bg-slate-900/30 border border-white/5 p-6 rounded-2xl">
                            <h3 className="text-sm font-black uppercase text-zinc-400 mb-2">Estadístiques de Carrera</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-500 uppercase">Nivell</span>
                                    <span className="font-black text-amber-500">LVL {profile.level}</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                    <span className="text-xs font-bold text-zinc-500 uppercase">Partides Jugades</span>
                                    <span className="font-black text-white">42</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right: Arena Path */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Trophy size={20} className="text-blue-400" />
                                <h2 className="text-lg font-black uppercase italic tracking-tight">Camí de l'Arena</h2>
                            </div>

                            <div className="flex gap-2">
                                {(['bullet', 'blitz', 'rapid'] as const).map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setSelectedArena(v)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedArena === v ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <GameCard variant="blue" className="p-0 bg-slate-900/50 border-white/5 overflow-hidden h-[600px]">
                            <div className="h-full overflow-y-auto p-8 scrollbar-hide">
                                {progress[selectedArena] ? (
                                    <ArenaPath
                                        progress={progress[selectedArena]!}
                                        onClaimChest={(id) => claimChest(user.id, selectedArena, id)}
                                        onPlayGatekeeper={() => toast.info("Ves a la Home per jugar contra un Gatekeeper")}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-zinc-500 italic">
                                        Carregant Arena...
                                    </div>
                                )}
                            </div>
                        </GameCard>
                    </div>
                </div>
            </div>

            <ChestOpeningModal
                rewards={openingRewards}
                onClose={() => setOpeningRewards(null)}
            />
        </div>
    );
}
