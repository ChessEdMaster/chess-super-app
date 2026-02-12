'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useArenaStore } from '@/lib/store/arena-store';
import { ArenaPath } from '@/components/arena/arena-path';
import { ArenaVariant } from '@/types/arena';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Trophy, Swords, Loader2, Zap, Brain, Rocket } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ArenaDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { progress, fetchArenaProgress, claimChest } = useArenaStore();
  const [selectedArena, setSelectedArena] = useState<ArenaVariant>('blitz');

  useEffect(() => {
    if (user) {
      fetchArenaProgress(user.id);
    }
  }, [user, fetchArenaProgress]);

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  const currentProgress = progress[selectedArena];

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
              { id: 'bullet', icon: Rocket, label: 'Bullet' },
              { id: 'blitz', icon: Zap, label: 'Blitz' },
              { id: 'rapid', icon: Brain, label: 'Rapid' }
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
                {mode.label}
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
                <Trophy className="text-yellow-500" size={32} />
                <div>
                  <div className="text-3xl font-black text-white font-display">
                    {currentProgress?.current_cups || 0}
                  </div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Copes Actuals
                  </div>
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
            {/* Weekly Leaderboard Preview */}
            <Panel className="bg-zinc-900/50 p-6 space-y-4">
              <h3 className="text-sm font-black uppercase text-zinc-400 tracking-wider">
                Classificació Setmanal
              </h3>
              <div className="space-y-2">
                {[1, 2, 3].map((pos) => (
                  <div key={pos} className="flex items-center gap-3 p-2 rounded-lg bg-black/20 border border-white/5">
                    <span className={`
                                            font-black w-6 text-center
                                            ${pos === 1 ? 'text-yellow-500' : pos === 2 ? 'text-zinc-300' : 'text-amber-700'}
                                        `}>{pos}</span>
                    <div className="w-8 h-8 rounded-full bg-zinc-800" />
                    <span className="text-xs font-bold text-zinc-300">Player_{pos}</span>
                    <span className="ml-auto text-xs font-mono text-blue-400">2,450</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-center">
                <Link href="/play/leaderboard" className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest">
                  Veure Tot
                </Link>
              </div>
            </Panel>

            {/* Recent Activity / Chests */}
            <Panel className="bg-zinc-900/50 p-6">
              <h3 className="text-sm font-black uppercase text-zinc-400 tracking-wider mb-4">
                Recompenses
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square rounded-xl bg-black/20 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Trophy size={18} className="text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Daily</span>
                </div>
                <div className="aspect-square rounded-xl bg-black/20 border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap size={18} className="text-purple-500" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Quests</span>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div >
    </div >
  );
}
