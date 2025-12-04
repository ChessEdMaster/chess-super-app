'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Swords, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Challenge {
  id: string;
  host_id: string | null;
  is_bot: boolean;
  bot_difficulty: string | null;
  player_color: string;
  rated: boolean;
  time_control_type: string;
  status: string;
  map_x: number;
  map_y: number;
}

export default function LobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Ref for user to avoid subscription churn
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // Fetch & Realtime
  useEffect(() => {
    const fetchChallenges = async () => {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'open');
      if (data) setChallenges(data);
    };

    fetchChallenges();

    const channel = supabase
      .channel('lobby_challenges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setChallenges(prev => [...prev, payload.new as Challenge]);
        } else if (payload.eventType === 'DELETE') {
          setChallenges(prev => prev.filter(c => c.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Challenge;

          // Redirect Host if their challenge was accepted
          if (updated.status === 'accepted' && updated.host_id === userRef.current?.id) {
            router.push(`/play/online/${updated.id}`);
          }

          // Update list: If not open, remove from map. If open, update data.
          if (updated.status !== 'open') {
            setChallenges(prev => prev.filter(c => c.id !== updated.id));
          } else {
            setChallenges(prev => prev.map(c => c.id === updated.id ? updated : c));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Bot Ecosystem Logic
  useEffect(() => {
    if (!user) return; // Only run if user is present (client-side manager)

    const manageBots = async () => {
      const botChallenges = challenges.filter(c => c.is_bot && c.status === 'open');
      if (botChallenges.length < 3) {
        // Create a bot challenge
        const difficulties = ['easy', 'medium', 'hard'];
        const times = ['bullet', 'blitz', 'rapid'];

        await supabase.from('challenges').insert({
          is_bot: true,
          bot_difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
          player_color: 'random',
          time_control_type: times[Math.floor(Math.random() * times.length)],
          rated: false,
          status: 'open',
          map_x: Math.floor(Math.random() * 80) + 10,
          map_y: Math.floor(Math.random() * 80) + 10
        });
      }
    };

    // Run periodically or when challenges change
    const interval = setInterval(manageBots, 5000);
    return () => clearInterval(interval);
  }, [challenges, user]);

  // Cleanup my challenge on unmount
  useEffect(() => {
    const cleanup = async () => {
      if (user) {
        await supabase
          .from('challenges')
          .delete()
          .eq('host_id', user.id)
          .eq('status', 'open');
      }
    };

    // Handle browser close/tab close
    window.addEventListener('beforeunload', cleanup);

    return () => {
      cleanup();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [user]);

  const handleAccept = async (challenge: Challenge) => {
    if (!user) return;

    // Optimistic update
    setChallenges(prev => prev.filter(c => c.id !== challenge.id));
    setSelectedChallenge(null);

    // If bot, delete and create game
    if (challenge.is_bot) {
      await supabase.from('challenges').delete().eq('id', challenge.id);
      // In a real app, we'd create a game record here. 
      // For now, redirect to play page with bot config
      router.push(`/play/online/bot-${challenge.id}?difficulty=${challenge.bot_difficulty}&time=${challenge.time_control_type}`);
    } else {
      // If human, create the game record first
      const isRandom = challenge.player_color === 'random';
      const hostIsWhite = isRandom ? Math.random() > 0.5 : challenge.player_color === 'white';

      const whiteId = hostIsWhite ? challenge.host_id : user.id;
      const blackId = hostIsWhite ? user.id : challenge.host_id;

      const timeLimit = challenge.time_control_type === 'bullet' ? 60 : challenge.time_control_type === 'blitz' ? 180 : 600;

      // Create Game
      const { error: gameError } = await supabase.from('games').insert({
        id: challenge.id, // Reuse challenge ID for the game
        white_player_id: whiteId,
        black_player_id: blackId,
        status: 'active',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        white_time: timeLimit,
        black_time: timeLimit,
        pgn: ''
      });

      if (gameError) {
        console.error('Error creating game:', gameError);
        return;
      }

      // Update challenge status to accepted (signals the host)
      await supabase.from('challenges').update({ status: 'accepted' }).eq('id', challenge.id);

      router.push(`/play/online/${challenge.id}`);
    }
  };

  return (
    <div className="h-full w-full bg-zinc-950 relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-zinc-900 to-black" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Swords className="text-yellow-500" />
          Battle Map
        </h1>
        <p className="text-zinc-400 text-xs">Select an opponent or wait for a challenger.</p>
      </div>

      {/* Map Area */}
      <div className="relative w-full h-full">
        <AnimatePresence>
          {challenges.map((challenge) => (
            <motion.button
              key={challenge.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.2 }}
              style={{
                left: `${challenge.map_x}%`,
                top: `${challenge.map_y}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg border-2 ${challenge.host_id === user?.id
                ? 'bg-yellow-500/20 border-yellow-500 animate-pulse'
                : challenge.is_bot
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-red-500/20 border-red-500'
                }`}
              onClick={() => setSelectedChallenge(challenge)}
            >
              {challenge.is_bot ? (
                <Bot className={challenge.is_bot ? "text-blue-400" : "text-red-400"} size={24} />
              ) : (
                <User className={challenge.host_id === user?.id ? "text-yellow-400" : "text-red-400"} size={24} />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Challenge Preview Modal */}
      <AnimatePresence>
        {selectedChallenge && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-xl p-6 shadow-2xl z-20"
          >
            <button
              onClick={() => setSelectedChallenge(null)}
              className="absolute top-2 right-2 text-zinc-500 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-full ${selectedChallenge.is_bot ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                {selectedChallenge.is_bot ? <Bot size={32} className="text-blue-400" /> : <User size={32} className="text-red-400" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedChallenge.is_bot ? `Bot (${selectedChallenge.bot_difficulty})` : 'Human Player'}
                </h3>
                <p className="text-zinc-400 text-sm capitalize">
                  {selectedChallenge.time_control_type} • {selectedChallenge.rated ? 'Rated' : 'Casual'}
                </p>
              </div>
            </div>

            {selectedChallenge.host_id !== user?.id && (
              <Button
                onClick={() => handleAccept(selectedChallenge)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                Accept Challenge
              </Button>
            )}

            {selectedChallenge.host_id === user?.id && (
              <div className="text-center text-yellow-500 font-bold animate-pulse">
                Waiting for opponent...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
