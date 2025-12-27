'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
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

export default function FeaturesPage() {
    const { user, loading: authLoading } = useAuth();
    const { chests, profile, loadProfile, openChest, startUnlockChest } = usePlayerStore();
    const { progress, fetchArenaProgress, claimChest } = useArenaStore();

    const [openingRewards, setOpeningRewards] = useState<any>(null);
    const [selectedArena, setSelectedArena] = useState<ArenaVariant>('blitz');

    useEffect(() => {
        if (user) {
            loadProfile(user.id);
            fetchArenaProgress(user.id);
        }
    }, [user, loadProfile, fetchArenaProgress]);

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

    if (authLoading || !user) {
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
