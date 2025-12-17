'use client';

import React, { useState, useEffect } from 'react';
import { ArenaVariant } from '@/types/arena';
import { usePlayerStore } from '@/lib/store/player-store';
import { useArenaStore } from '@/lib/store/arena-store';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Zap, Timer, Turtle, Archive,
  Plus, ChevronLeft, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateChallengeModal } from '@/components/lobby/create-challenge-modal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArenaCard } from '@/components/arena/arena-card';
import { ArenaPath } from '@/components/arena/arena-path';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ChestGrid } from '@/components/lobby/chest-grid';
import { LobbyMap } from '@/components/lobby/lobby-map';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

import { Challenge } from '@/types/lobby';

export default function LobbyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Stores
  const { profile, chests, loadProfile } = usePlayerStore();
  const { progress, fetchArenaProgress, claimChest } = useArenaStore();

  // State
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedArena, setSelectedArena] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    if (user) {
      loadProfile(user.id);
      fetchArenaProgress(user.id);
    }
  }, [user, loadProfile, fetchArenaProgress]);

  // Realtime Challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(`*, host:profiles(username, avatar_url)`)
        .eq('status', 'open');

      if (error) console.error("Error fetching challenges:", error);
      if (data) setChallenges(data as unknown as Challenge[]);
    };

    fetchChallenges();

    const channel = supabase
      .channel('lobby_challenges_main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, fetchChallenges)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Listen for MY challenge being accepted (so host gets redirected)
  useEffect(() => {
    if (!user) return;

    const hostChannel = supabase
      .channel(`host_challenge_${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'challenges',
        filter: `host_id=eq.${user.id}`
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.status === 'accepted') {
          toast.success("Oponent trobat! Començant partida...");
          router.push(`/play/online/${updated.id}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(hostChannel); };
  }, [user, router]);

  const handleJoin = async (challenge: Challenge) => {
    if (!user) return;
    if (challenge.host_id === user.id) return;

    // Get existing game to see which color is available
    const { data: existingGame } = await supabase
      .from('games')
      .select('*')
      .eq('id', challenge.id)
      .single();

    if (!existingGame) {
      toast.error("Error: El joc no existeix");
      return;
    }

    // Determine which color the joiner gets
    const joinAsWhite = existingGame.white_player_id === null;

    // Update the game to add the opponent and set status to active
    const { error } = await supabase
      .from('games')
      .update({
        white_player_id: joinAsWhite ? user.id : existingGame.white_player_id,
        black_player_id: joinAsWhite ? existingGame.black_player_id : user.id,
        status: 'active'
      })
      .eq('id', challenge.id);

    if (!error) {
      await supabase.from('challenges').update({ status: 'accepted' }).eq('id', challenge.id);
      router.push(`/play/online/${challenge.id}`);
    } else {
      console.error("Join error:", error);
      toast.error("Error unint-se a la partida");
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [user, loading, router]);

  if (loading || !user) return <div className="h-screen flex items-center justify-center bg-zinc-950"><div className="animate-pulse text-zinc-500 font-bold uppercase tracking-widest">Loading...</div></div>;

  return (
    <div className="h-full w-full p-6 max-w-7xl mx-auto flex flex-col gap-6">

      {/* HEADER */}
      <Panel className="flex items-center justify-between shrink-0 py-4 px-6 bg-zinc-900/80 border-black/20">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 italic font-display drop-shadow-lg mb-1 text-stroke tracking-wide">
            Battle Arena
          </h1>
          <p className="text-zinc-400 text-xs font-bold flex items-center gap-2 tracking-wide">
            <Swords size={12} className="text-amber-500" />
            Live Global Challenges
          </p>
        </div>
        <div className="flex gap-4">
          {/* ELO Display */}
          <div className="hidden md:flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Blitz</span>
              <span className="text-base font-black text-white font-mono">{profile?.elo_blitz || 800}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Rapid</span>
              <span className="text-base font-black text-white font-mono">{profile?.elo_rapid || 800}</span>
            </div>
          </div>

          <ShinyButton
            variant="primary"
            onClick={() => setIsChallengeModalOpen(true)}
            className="h-auto text-sm px-6"
          >
            <Plus size={18} className="mr-2" />
            Create Match
          </ShinyButton>
        </div>
      </Panel>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

        {/* LEFT: CHALLENGE LIST */}
        <GameCard variant="default" className="lg:col-span-8 p-0 flex flex-col overflow-hidden bg-zinc-900/90 border-zinc-700">
          <div className="p-4 border-b border-black/20 bg-zinc-900/50 flex justify-between items-center shadow-md z-10">
            <h2 className="text-sm font-black text-white font-display tracking-wide flex items-center gap-2">
              <Zap size={16} className="text-amber-400 fill-amber-400" /> Active Games
            </h2>
            <span className="text-[10px] font-bold bg-zinc-950 text-zinc-400 px-3 py-1 rounded-full border border-white/10 shadow-inner">
              {challenges.length} Online
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-subtle p-4 space-y-3 bg-zinc-950/30">
            <AnimatePresence>
              {challenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                  <div className="w-24 h-24 rounded-full bg-zinc-900/50 flex items-center justify-center animate-pulse border-4 border-zinc-800">
                    <Swords size={40} className="text-zinc-700" />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-zinc-400 font-display tracking-wide text-lg">The Arena is Quiet</p>
                    <p className="text-xs text-zinc-600 tracking-wider mt-1 font-bold">Be the first to start a battle</p>
                  </div>
                </div>
              ) : (
                challenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-1 rounded-2xl bg-gradient-to-b from-white/5 to-transparent hover:from-amber-500/10 transition-all duration-300"
                  >
                    <div className="bg-zinc-900/80 p-4 rounded-xl flex items-center justify-between border border-white/5 hover:border-amber-500/50 transition-colors shadow-lg">
                      <div className="flex items-center gap-4">
                        {/* Host Avatar */}
                        <div className="w-14 h-14 rounded-xl bg-zinc-950 border-2 border-zinc-700 overflow-hidden relative shadow-inner">
                          {challenge.host?.avatar_url ? (
                            <img src={challenge.host.avatar_url} alt={challenge.host.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                              <div className="text-xl font-black text-zinc-700 select-none">
                                {challenge.host?.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Challenge Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-white font-display tracking-wide text-base group-hover:text-amber-400 transition-colors">
                              {challenge.host?.username || 'Unknown Warrior'}
                            </h3>
                            <span className="text-[9px] bg-black text-amber-500 px-1.5 py-0.5 rounded border border-amber-900/50 font-mono font-bold">
                              {profile?.elo_blitz || 1200}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/5 uppercase tracking-wider">
                              <Timer size={10} className="text-emerald-400" />
                              {challenge.time_control}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-300 flex items-center gap-1 bg-black/40 px-2 py-1 rounded border border-white/5 uppercase tracking-wider">
                              <Trophy size={10} className="text-amber-400" />
                              {challenge.rated ? 'Rated' : 'Casual'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ShinyButton
                        onClick={() => handleJoin(challenge)}
                        disabled={challenge.host_id === user?.id}
                        variant={challenge.host_id === user?.id ? 'neutral' : 'success'}
                        className="text-xs h-10 px-6 min-w-[120px]"
                      >
                        {challenge.host_id === user?.id ? 'Waiting...' : 'Fight'}
                      </ShinyButton>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </GameCard>

        {/* RIGHT: ARENA & CHESTS */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Arena Map Preview */}
          <GameCard variant="blue" className="flex-1 flex flex-col bg-zinc-900/80 p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-blue-950/20 flex justify-between items-center">
              <h2 className="text-xs font-black text-blue-200 font-display tracking-wide flex items-center gap-2">
                <Trophy size={14} className="text-blue-400" /> Arena Journey
              </h2>
              <span className="text-[9px] text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/20 tracking-wider">Season 1</span>
            </div>

            <div className="flex-1 relative bg-zinc-950/50 shadow-inner p-4">
              {progress.blitz ? (
                <ArenaPath
                  progress={progress.blitz}
                  onClaimChest={(id) => user && claimChest(user.id, 'blitz', id)}
                  onPlayGatekeeper={() => { }}
                  compact
                />
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  Loading Arena...
                </div>
              )}
            </div>
          </GameCard>

          {/* Chests */}
          <GameCard variant="gold" className="shrink-0 bg-zinc-900/80 p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-amber-950/20">
              <h2 className="text-xs font-black text-amber-200 font-display tracking-wide flex items-center gap-2">
                <Archive size={14} className="text-amber-400" /> Chest Slots
              </h2>
            </div>
            <div className="p-4 bg-zinc-950/30">
              <ChestGrid
                chests={chests || []}
                slots={4}
                onOpenChest={() => { }}
                compact
              />
            </div>
          </GameCard>
        </div>

      </div>

      {/* CREATE MODAL */}
      <CreateChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
      />

      {/* Arena Details Dialog */}
      <Dialog open={!!selectedArena} onOpenChange={(open) => !open && setSelectedArena(null)}>
        <DialogContent className="glass-panel bg-zinc-950/95 border-zinc-800 text-white max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden backdrop-blur-xl">
          {selectedArena && progress[selectedArena as ArenaVariant] && (
            <div className="h-full overflow-y-auto scrollbar-subtle p-6">
              <ArenaPath
                progress={progress[selectedArena as ArenaVariant]!}
                onClaimChest={(id) => claimChest(user.id, selectedArena as ArenaVariant, id)}
                onPlayGatekeeper={(tier) => {
                  router.push(`/play/online/bot-gatekeeper-${tier}?difficulty=hard`);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
