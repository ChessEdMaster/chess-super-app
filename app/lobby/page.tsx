'use client';

import React, { useState, useEffect } from 'react';
import { ArenaVariant } from '@/types/arena';
import { usePlayerStore } from '@/lib/store/player-store';
import { useArenaStore } from '@/lib/store/arena-store';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Trophy, Zap, Timer, Turtle,
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
  const { profile, loadProfile } = usePlayerStore();
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
    <div className="h-full w-full flex flex-col lg:flex-row overflow-hidden font-sans text-slate-200">

      {/* MOBILE: Top bar with menu toggle */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-zinc-900/70 backdrop-blur-md border-b border-zinc-800/50">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-zinc-800 rounded-lg"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400">ELO:</span>
          <span className="bg-zinc-800 px-2 py-1 rounded font-bold">{profile?.elo_blitz || 0}</span>
        </div>
        <Button
          onClick={() => setIsChallengeModalOpen(true)}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* MOBILE: Sidebar as overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-zinc-900 z-50 lg:hidden flex flex-col"
            >
              <SidebarContent
                profile={profile}
                progress={progress}
                onSelectArena={setSelectedArena}
                onClose={() => setIsSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP: Sidebar */}
      <div className="hidden lg:flex w-64 flex-none bg-zinc-900/80 backdrop-blur-md border-r border-zinc-800/50 flex-col">
        <SidebarContent
          profile={profile}
          progress={progress}
          onSelectArena={setSelectedArena}
        />
      </div>

      {/* CENTER: LOBBY MAP */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        {/* Desktop: Create button floating */}
        <div className="hidden lg:block absolute top-4 right-4 z-20">
          <Button
            onClick={() => setIsChallengeModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-5 rounded-xl shadow-lg shadow-emerald-900/30 flex gap-2"
          >
            <Plus size={18} /> Crear Partida
          </Button>
        </div>

        {/* Map Visualization - Takes full space */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 z-10">
          <div className="w-full h-full max-w-[min(90vw,70vh)] max-h-[min(90vw,70vh)] aspect-square relative">
            <LobbyMap
              challenges={challenges}
              onJoin={handleJoin}
              onEnterOwnChallenge={(challenge) => {
                // Host clicks their own challenge - go to waiting game page
                router.push(`/play/online/${challenge.id}`);
              }}
            />
          </div>
        </div>
      </div>

      <CreateChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
      />

      {/* Arena Details Dialog */}
      <Dialog open={!!selectedArena} onOpenChange={(open) => !open && setSelectedArena(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
          {selectedArena && progress[selectedArena as ArenaVariant] && (
            <div className="h-full mt-4 overflow-y-auto scrollbar-hide p-4">
              <ArenaPath
                progress={progress[selectedArena as ArenaVariant]!}
                onClaimChest={(id) => claimChest(user.id, selectedArena as ArenaVariant, id)}
                onPlayGatekeeper={() => { }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted Sidebar Component
function SidebarContent({
  profile,
  progress,
  onSelectArena,
  onClose
}: {
  profile: any;
  progress: any;
  onSelectArena: (arena: string) => void;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
        <h2 className="text-sm font-black text-white italic flex items-center gap-2 font-display">
          <Trophy className="text-yellow-500" size={16} /> ARENA
        </h2>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* ELO Summary - Compact */}
      <div className="px-3 py-2 border-b border-zinc-800 flex gap-1.5 text-[10px]">
        <div className="flex-1 bg-zinc-800/50 px-2 py-1 rounded text-center">
          <Zap size={10} className="inline text-yellow-500 mr-0.5" />
          <span className="text-white font-bold">{profile?.elo_bullet || 0}</span>
        </div>
        <div className="flex-1 bg-zinc-800/50 px-2 py-1 rounded text-center">
          <Timer size={10} className="inline text-blue-500 mr-0.5" />
          <span className="text-white font-bold">{profile?.elo_blitz || 0}</span>
        </div>
        <div className="flex-1 bg-zinc-800/50 px-2 py-1 rounded text-center">
          <Turtle size={10} className="inline text-green-500 mr-0.5" />
          <span className="text-white font-bold">{profile?.elo_rapid || 0}</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
        <ArenaCard variant="bullet" progress={progress.bullet} onClick={() => onSelectArena('bullet')} />
        <ArenaCard variant="blitz" progress={progress.blitz} onClick={() => onSelectArena('blitz')} />
        <ArenaCard variant="rapid" progress={progress.rapid} onClick={() => onSelectArena('rapid')} />

        {/* Chests */}
        <div className="pt-2">
          <ChestGrid />
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors py-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800"
        >
          <ChevronLeft size={14} /> Tornar a Battle
        </Link>
      </div>
    </>
  );
}
