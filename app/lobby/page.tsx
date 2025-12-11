'use client';

import React, { useState, useEffect } from 'react';
import { ArenaVariant } from '@/types/arena';
import { usePlayerStore } from '@/lib/store/player-store';
import { useArenaStore } from '@/lib/store/arena-store';
import { useAuth } from '@/components/auth-provider';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Swords, Trophy, User, Zap, Timer, Turtle,
  Plus
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

import { Challenge, HostProfile } from '@/types/lobby';

export default function LobbyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Stores
  const {
    profile, loadProfile
  } = usePlayerStore();
  const { progress, fetchArenaProgress, claimChest } = useArenaStore();

  // State
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedArena, setSelectedArena] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    if (user) {
      loadProfile(user.id);
      fetchArenaProgress(user.id);
    }
  }, [user, loadProfile, fetchArenaProgress]);

  // Realtime Challenges
  useEffect(() => {
    // Note: We need to listen to challenges globally, not necessarily blocked by 'user' being present, 
    // but we can't display much without user.
    // The previous issue was that `host:profiles(...)` relationship was returning empty or undefined if RLS blocked it.
    // However, profiles table usually has public read access.
    // Let's verify RLS later. For now, let's fix the query to ensure we get data even if host is null for some reason.

    const fetchChallenges = async () => {
      // Intentionally simplified query to debug if relation was the issue
      const { data, error } = await supabase
        .from('challenges')
        .select(`
            *,
            host:profiles(username, avatar_url)
        `)
        .eq('status', 'open');

      if (error) {
        console.error("Error fetching challenges:", error);
      }

      if (data) {
        // If host is null (e.g. host deleted or RLS issue), we should handle it gracefully
        setChallenges(data as any);
      }
    };

    fetchChallenges();

    const channel = supabase
      .channel('lobby_challenges_main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, (payload) => {
        // We could optimistically update, but re-fetching ensures we get the joined profile data
        fetchChallenges();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]); // Re-run if user changes or on mount

  const handleJoin = async (challenge: Challenge) => {
    if (!user) return;
    if (challenge.host_id === user.id) return;

    const whiteId = challenge.player_color === 'white' ? challenge.host_id : (challenge.player_color === 'black' ? user.id : (Math.random() > 0.5 ? challenge.host_id : user.id));
    const blackId = whiteId === challenge.host_id ? user.id : challenge.host_id;
    const timeLimit = challenge.time_control_type === 'bullet' ? 60 : challenge.time_control_type === 'blitz' ? 3 * 60 : 10 * 60; // Fixed times for now: 1min, 3min, 10min

    const { error } = await supabase.from('games').insert({
      id: challenge.id,
      white_player_id: whiteId,
      black_player_id: blackId,
      status: 'active',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      white_time: timeLimit,
      black_time: timeLimit,
      pgn: ''
    }).select().single();

    if (!error) {
      await supabase.from('challenges').update({ status: 'accepted' }).eq('id', challenge.id);
      router.push(`/play/online/${challenge.id}`);
    } else {
      console.error("Join error:", error);
      toast.error("Error unint-se a la partida");
    }
  };

  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-pulse text-zinc-500">Loading ChessHub...</div></div>;
  if (!user) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return null;
  }

  return (
    <div className="h-screen w-full bg-zinc-950 flex overflow-hidden font-sans text-slate-200">

      {/* LEFT SIDEBAR: ARENA & PROGRESS */}
      <div className="w-80 flex-none bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Header / Profile Summary */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-lg font-black text-white italic flex items-center gap-2 mb-2">
            <Trophy className="text-yellow-500" size={20} /> ARENA
          </h2>
          <div className="flex gap-2 text-xs">
            <div className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
              <span className="text-zinc-400">Bullet:</span> <span className="text-white font-bold">{profile?.elo_bullet || 1200}</span>
            </div>
            <div className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
              <span className="text-zinc-400">Blitz:</span> <span className="text-white font-bold">{profile?.elo_blitz || 1200}</span>
            </div>
            <div className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
              <span className="text-zinc-400">Rapid:</span> <span className="text-white font-bold">{profile?.elo_rapid || 1200}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <ArenaCard variant="bullet" progress={progress.bullet} onClick={() => setSelectedArena('bullet')} />
          <ArenaCard variant="blitz" progress={progress.blitz} onClick={() => setSelectedArena('blitz')} />
          <ArenaCard variant="rapid" progress={progress.rapid} onClick={() => setSelectedArena('rapid')} />

          {/* Chests Component */}
          <ChestGrid />
        </div>

        <div className="p-4 border-t border-zinc-800 text-xs text-center text-zinc-500">
          <Link href="/" className="hover:text-white transition-colors">← Tornar a la Sala d'Espera</Link>
        </div>
      </div>

      {/* CENTER: LOBBY / CHALLENGES */}
      <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

        <header className="p-6 flex justify-between items-center z-10">
          <div>
            <h1 className="text-3xl font-black text-white leading-none">LOBBY DE JOC</h1>
            <p className="text-zinc-500 text-sm mt-1">Troba un oponent o crea un repte</p>
          </div>
          <Button
            onClick={() => setIsChallengeModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-6 rounded-xl shadow-lg shadow-emerald-900/20 flex gap-2"
          >
            <Plus size={20} /> Crear Partida
          </Button>
        </header>

        {/* Map Visualization */}
        <div className="flex-1 flex items-center justify-center p-8 z-10">
          <div className="w-full max-w-[80vh] aspect-square relative z-10">
            <LobbyMap challenges={challenges} onJoin={handleJoin} />
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
            <div className="h-full mt-4 overflow-y-auto p-4">
              <ArenaPath
                progress={progress[selectedArena as ArenaVariant]!}
                onClaimChest={(id) => claimChest(user.id, selectedArena as ArenaVariant, id)}
                onPlayGatekeeper={() => { }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
}
