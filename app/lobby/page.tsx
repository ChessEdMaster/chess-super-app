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
  Archive, Gift, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateChallengeModal } from '@/components/lobby/create-challenge-modal';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArenaCard } from '@/components/arena/arena-card';
import { ArenaPath } from '@/components/arena/arena-path';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  host_id: string;
  is_bot: boolean;
  bot_difficulty: string | null;
  player_color: string;
  rated: boolean;
  time_control_type: string;
  status: string;
  map_x: number;
  map_y: number;
  host?: { username: string; avatar_url: string };
}

export default function LobbyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Stores
  const {
    chests, profile, loadProfile,
    startUnlockChest, openChest, updateChestTimers
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

  // Timer for chests
  useEffect(() => {
    const timer = setInterval(() => {
      updateChestTimers();
    }, 1000);
    return () => clearInterval(timer);
  }, [updateChestTimers]);

  // Realtime Challenges
  useEffect(() => {
    if (!user) return;

    const fetchChallenges = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*, host:profiles(username, avatar_url)')
        .eq('status', 'open');
      if (data) setChallenges(data as any);
    };

    fetchChallenges();

    const channel = supabase
      .channel('lobby_challenges_grid')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => {
        fetchChallenges();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleJoin = async (challenge: Challenge) => {
    if (!user) return;
    if (challenge.host_id === user.id) return;

    const whiteId = challenge.player_color === 'white' ? challenge.host_id : (challenge.player_color === 'black' ? user.id : (Math.random() > 0.5 ? challenge.host_id : user.id));
    const blackId = whiteId === challenge.host_id ? user.id : challenge.host_id;
    const timeLimit = challenge.time_control_type === 'bullet' ? 60 : challenge.time_control_type === 'blitz' ? 180 : 600;

    const { data: game, error } = await supabase.from('games').insert({
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
      toast.error("Error unint-se a la partida");
    }
  };

  const handleChestClick = (index: number) => {
    const chest = chests[index];
    if (!chest) return;

    if (chest.status === 'LOCKED') {
      const isAnyUnlocking = chests.some(c => c && c.status === 'UNLOCKING');
      if (isAnyUnlocking) {
        toast.error("Ja estàs desbloquejant un cofre. Espera que acabi.");
        return;
      }
      startUnlockChest(index);
      toast.success("Desbloqueig iniciat!");
    } else if (chest.status === 'READY') {
      const rewards = openChest(index);
      if (rewards) {
        toast.success(`Cofre obert! Guanyat: ${rewards.gold} Or, ${rewards.gems} Gemmes`);
      }
    } else if (chest.status === 'UNLOCKING') {
      toast.info("Aquest cofre s'està desbloquejant...");
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

          {/* Chests */}
          <div className="mt-8">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Archive size={14} /> Cofres
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {chests.map((chest, i) => (
                <motion.div
                  key={i}
                  onClick={() => handleChestClick(i)}
                  whileHover={chest ? { scale: 1.05 } : {}}
                  whileTap={chest ? { scale: 0.95 } : {}}
                  className={`aspect-square rounded border flex flex-col items-center justify-center relative cursor-pointer ${chest ? 'border-amber-500/30 bg-amber-900/10' : 'border-zinc-800 bg-zinc-900'}`}
                >
                  {chest ? (
                    <>
                      <Gift className={`mb-1 ${chest.status === 'LOCKED' ? 'text-zinc-500' : 'text-amber-500'}`} size={16} />

                      {chest.status === 'READY' && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}

                      <span className="text-[8px] font-bold uppercase text-zinc-400">
                        {chest.status === 'LOCKED' && 'LOCKED'}
                        {chest.status === 'UNLOCKING' && 'OPENING'}
                        {chest.status === 'READY' && 'READY'}
                      </span>

                      {chest.status === 'UNLOCKING' && chest.unlockStartedAt && (
                        <span className="text-[8px] text-amber-200">
                          {Math.max(0, Math.ceil(chest.unlockTime - ((Date.now() - chest.unlockStartedAt) / 1000)))}s
                        </span>
                      )}
                    </>
                  ) : <span className="text-zinc-700 text-[8px]">EMPTY</span>}
                </motion.div>
              ))}
            </div>
          </div>
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

        {/* Matrix of Challenges */}
        <div className="flex-1 flex items-center justify-center p-8 z-10">
          <div className="w-full max-w-[80vh] aspect-square bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl shadow-2xl p-6 relative overflow-hidden">
            {challenges.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                <Swords size={48} className="opacity-20" />
                <p>No hi ha reptes actius.</p>
                <Button variant="outline" onClick={() => setIsChallengeModalOpen(true)}>Crear el primer repte</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full overflow-y-auto content-start pr-2">
                {challenges.map(c => (
                  <motion.button
                    key={c.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleJoin(c)}
                    disabled={c.host_id === user.id}
                    className={`
                      flex flex-col items-start p-4 rounded-xl border transition-all text-left relative overflow-hidden
                      ${c.host_id === user.id ? 'bg-zinc-800/50 border-zinc-700 opacity-50 cursor-default' : 'bg-zinc-800 border-zinc-700 hover:border-indigo-500 hover:bg-zinc-750'}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                        {c.host?.avatar_url ? <img src={c.host.avatar_url} className="w-full h-full object-cover" /> : <User size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{c.host?.username || 'Anònim'}</div>
                        <div className="text-[10px] text-zinc-400">{c.rated ? 'Competitiu' : 'Amistós'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-300 bg-indigo-900/20 px-2 py-1 rounded mb-2">
                      {c.time_control_type === 'bullet' && <Zap size={12} />}
                      {c.time_control_type === 'blitz' && <Timer size={12} />}
                      {c.time_control_type === 'rapid' && <Turtle size={12} />}
                      <span className="uppercase">{c.time_control_type}</span>
                    </div>

                    {c.host_id !== user.id && (
                      <div className="mt-auto w-full pt-2 flex justify-end text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        Acceptar <Swords size={12} className="ml-1" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
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
    </div>
  );
}
