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

  if (loading || !user) return <div className="h-screen flex items-center justify-center"><div className="animate-pulse text-zinc-500">Loading...</div></div>;

  return (
    <div className="h-full w-full p-6 overflow-hidden max-w-7xl mx-auto flex flex-col gap-6">

      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400 uppercase tracking-widest italic font-display drop-shadow-lg mb-1">
            Battle Arena
          </h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Swords size={12} className="text-amber-500" />
            Live Global Challenges
          </p>
        </div>
        <div className="flex gap-4">
          {/* ELO Display */}
          <div className="hidden md:flex items-center gap-2 glass-panel px-4 py-2 rounded-lg bg-zinc-900/60">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Blitz</span>
              <span className="text-base font-black text-white font-display">{profile?.elo_blitz || 800}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Rapid</span>
              <span className="text-base font-black text-white font-display">{profile?.elo_rapid || 800}</span>
            </div>
          </div>

          <Button
            onClick={() => setIsChallengeModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-900/40 border border-orange-400/50 font-display uppercase tracking-wide px-6 py-6 h-auto text-sm"
          >
            <Plus size={18} className="mr-2" />
            Create Match
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

        {/* LEFT: CHALLENGE LIST */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-0 flex flex-col overflow-hidden bg-zinc-900/40 border-zinc-800">
          <div className="p-4 border-b border-white/5 bg-zinc-900/50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> Active Games
            </h2>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full border border-white/5">
              {challenges.length} Online
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-subtle p-4 space-y-3">
            <AnimatePresence>
              {challenges.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center animate-pulse">
                    <Swords size={32} className="text-zinc-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-zinc-300 font-display tracking-wide">The Arena is Quiet</p>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Be the first to start a battle</p>
                  </div>
                </div>
              ) : (
                challenges.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-amber-900/10 bg-zinc-900/40"
                  >
                    <div className="flex items-center gap-4">
                      {/* Host Avatar */}
                      <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 overflow-hidden relative shadow-inner group-hover:border-amber-500/50 transition-colors">
                        {challenge.host?.avatar_url ? (
                          <img src={challenge.host.avatar_url} alt={challenge.host.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                            <span className="text-lg font-black text-zinc-600 select-none">
                              {challenge.host?.username?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Challenge Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white font-display tracking-wide text-sm group-hover:text-amber-400 transition-colors">
                            {challenge.host?.username || 'Unknown Warrior'}
                          </h3>
                          <span className="text-[10px] bg-zinc-950 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 font-mono">
                            {profile?.elo_blitz || 1200}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 bg-zinc-950/50 px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-wider">
                            <Timer size={10} className="text-emerald-400" />
                            {challenge.time_control}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 bg-zinc-950/50 px-2 py-0.5 rounded border border-zinc-800 uppercase tracking-wider">
                            <Trophy size={10} className="text-amber-400" />
                            {challenge.rated ? 'Rated' : 'Casual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleJoin(challenge)}
                      disabled={challenge.host_id === user?.id}
                      className={`font-display tracking-wider uppercase text-xs h-9 ${challenge.host_id === user?.id ? 'opacity-50 cursor-default bg-zinc-800 text-zinc-500 border-zinc-700' : 'bg-white/5 hover:bg-emerald-500/20 text-white border-white/10 hover:border-emerald-500/50 hover:text-emerald-400 shadow-lg'}`}
                      variant="outline"
                    >
                      {challenge.host_id === user?.id ? 'Waiting...' : 'Accept Duel'}
                    </Button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: ARENA & CHESTS */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Arena Map Preview */}
          <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col bg-zinc-900/40 border-zinc-800 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className="text-xs font-bold text-zinc-400 font-display uppercase tracking-widest flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" /> Arena Journey
              </h2>
              <span className="text-[10px] text-amber-500 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Season 1</span>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden bg-zinc-950/50 border border-white/5 shadow-inner">
              {progress.blitz ? (
                <ArenaPath
                  progress={progress.blitz}
                  onClaimChest={(id) => user && claimChest(user.id, 'blitz', id)}
                  onPlayGatekeeper={() => { }}
                  compact
                />
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
                  Loading Arena...
                </div>
              )}
            </div>
          </div>

          {/* Chests */}
          <div className="glass-panel p-5 rounded-2xl shrink-0 bg-zinc-900/40 border-zinc-800">
            <h2 className="text-xs font-bold text-zinc-400 mb-4 font-display uppercase tracking-widest flex items-center gap-2">
              <Archive size={14} className="text-indigo-400" /> Chest Slots
            </h2>
            <ChestGrid
              chests={chests || []}
              slots={4}
              onOpenChest={() => { }}
              compact
            />
          </div>
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

// Helper types if needed, otherwise rely on existing imports.
// SidebarContent removed as it's now integrated into the main layout or not needed in this simplified premium view.
