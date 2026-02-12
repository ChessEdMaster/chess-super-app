'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useArenaStore } from '@/lib/store/arena-store';
import { usePlayerStore } from '@/lib/store/player-store';
import { ArenaPath } from '@/components/arena/arena-path';
import { ChestGrid } from '@/components/lobby/chest-grid';
import { ChestOpeningModal } from '@/components/cards/chest-opening-modal';
import { ArenaVariant } from '@/types/arena';
import { Leaderboard } from '@/components/arena/Leaderboard';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Trophy, Swords, Loader2, Zap, Brain, Rocket, Archive } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ArenaDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { progress, fetchArenaProgress, claimChest } = useArenaStore();
  const { chests, profile, loadProfile, openChest, startUnlockChest } = usePlayerStore();
  const router = useRouter();

  const [selectedArena, setSelectedArena] = useState<ArenaVariant>('blitz');
  const [openingRewards, setOpeningRewards] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchArenaProgress(user.id);
      loadProfile(user.id);
    }
  }, [user, fetchArenaProgress, loadProfile]);

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  const currentProgress = progress[selectedArena];

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 pb-24">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Swords size={32} className="text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">
                L'Arena
              </h1>
              <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">
                Competeix, puja de lliga i guanya recompenses
              </p>
            </div>
          </div>

          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            {[
              { id: 'bullet', icon: Rocket, label: 'Bullet', elo: Math.round(progress.bullet?.rating || 1500) },
              { id: 'blitz', icon: Zap, label: 'Blitz', elo: Math.round(progress.blitz?.rating || 1500) },
              { id: 'rapid', icon: Brain, label: 'Rapid', elo: Math.round(progress.rapid?.rating || 1500) }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedArena(mode.id as ArenaVariant)}
                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all
                                    ${selectedArena === mode.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'}
                                `}
              >
                <mode.icon size={14} />
                <div className="flex flex-col items-start leading-none">
                  <span>{mode.label}</span>
                  {progress[mode.id as ArenaVariant]?.elo_unlocked && (
                    <span className="text-[8px] opacity-70">{mode.elo}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Arena Path (Center/Left) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats Banner */}
            <Panel className="bg-zinc-900/50 border-blue-500/20 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentProgress?.elo_unlocked ? (
                  <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                    <Trophy size={32} className="text-yellow-500" />
                  </div>
                ) : (
                  <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
                    <Trophy size={32} className="text-blue-500" />
                  </div>
                )}

                <div>
                  <div className="text-3xl font-black text-white font-display flex items-baseline gap-2">
                    {currentProgress?.elo_unlocked ? (
                      <>
                        {Math.round(currentProgress.rating || 1500)}
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">ELO OFFICIALL</span>
                      </>
                    ) : (
                      <>
                        {currentProgress?.current_cups || 0}
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Copes</span>
                      </>
                    )}
                  </div>
                  {!currentProgress?.elo_unlocked && (
                    <div className="w-48 h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-blue-500 transition-all duration-1000"
                        style={{ width: `${Math.min(100, ((currentProgress?.current_cups || 0) / 1000) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href={`/play/online?mode=${selectedArena}`}>
                  <ShinyButton variant="primary" className="px-8 py-4 text-sm">
                    <Swords className="mr-2 h-4 w-4" />
                    JUGAR {selectedArena.toUpperCase()}
                  </ShinyButton>
                </Link>

                <ShinyButton
                  onClick={async () => {
                    toast.loading("Cercant rival (Bot)...", { id: 'bot-start' });
                    try {
                      const { data: game, error } = await supabase
                        .from('games')
                        .insert({
                          white_player_id: user.id,
                          status: 'active',
                          is_bot: true,
                          bot_difficulty: 2,
                          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                          variant: selectedArena,
                          pgn: '',
                          white_time: selectedArena === 'bullet' ? 60 : selectedArena === 'blitz' ? 180 : 600,
                          black_time: selectedArena === 'bullet' ? 60 : selectedArena === 'blitz' ? 180 : 600,
                          increment: selectedArena === 'blitz' ? 2 : 0, // 3+2 for Blitz
                        })
                        .select()
                        .single();

                      if (error) throw error;
                      window.location.href = `/play/online/${game.id}?ranked=true`;
                    } catch (err: any) {
                      toast.error("Error: " + err.message, { id: 'bot-start' });
                    }
                  }}
                  variant="secondary"
                  className="px-4 py-4 text-xs bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  ENTRENAR (RANKED)
                </ShinyButton>
              </div>
            </Panel>

            {/* Path Container */}
            <GameCard variant="blue" className="p-0 bg-zinc-900/30 border-white/5 overflow-hidden h-[600px] relative">
              <div className="absolute inset-0 bg-[url('/assets/pattern-grid.svg')] opacity-5 pointer-events-none" />

              <div className="h-full overflow-y-auto p-8 scrollbar-hide">
                {currentProgress ? (
                  <ArenaPath
                    progress={currentProgress}
                    onClaimChest={(id) => claimChest(user.id, selectedArena, id)}
                    onPlayGatekeeper={async (tier) => {
                      toast.loading("Invocant el Gatekeeper...", { id: 'gatekeeper-start' });
                      try {
                        const { data: game, error } = await supabase
                          .from('games')
                          .insert({
                            white_player_id: user.id,
                            status: 'active',
                            is_bot: true,
                            bot_difficulty: 4, // 4 = Gatekeeper
                            gatekeeper_tier: tier,
                            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                            variant: selectedArena
                          })
                          .select()
                          .single();

                        if (error) throw error;

                        window.location.href = `/play/online/${game.id}`;
                      } catch (err: any) {
                        toast.error("Error iniciant partida: " + err.message, { id: 'gatekeeper-start' });
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-600" />
                  </div>
                )}
              </div>
            </GameCard>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Leaderboard (Right) */}
            <div className="lg:sticky lg:top-6">
              <Leaderboard variant={selectedArena} />
            </div>

            {/* Statistics Panel */}

            {/* Statistics Panel */}
            <Panel className="bg-zinc-900/50 p-6 space-y-4">
              <h3 className="text-sm font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                Estadístiques de Carrera
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Nivell</span>
                  <span className="font-black text-amber-500 text-sm">LVL {profile.level || 1}</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Gold</span>
                  <span className="font-black text-yellow-500 text-sm">{profile.currencies?.gold || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Màxim de Copes</span>
                  <span className="font-black text-white text-sm">{currentProgress?.highest_cups || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Gatekeepers</span>
                  <span className="font-black text-blue-400 text-sm">{currentProgress?.gatekeepers_defeated?.length || 0} / 4</span>
                </div>
              </div>
            </Panel>

            {/* Functional Chests Panel */}
            <Panel className="bg-zinc-900/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Archive size={18} className="text-amber-500" />
                <h3 className="text-sm font-black uppercase text-zinc-400 tracking-wider">
                  Els teus Cofres
                </h3>
              </div>

              <ChestGrid
                chests={chests}
                slots={4}
                onOpenChest={handleOpenChest}
                compact
              />

              <p className="text-[9px] text-zinc-500 mt-4 text-center font-bold uppercase tracking-widest leading-tight">
                Guanys més cofres guanyant partides a l'Arena
              </p>
            </Panel>
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
