'use client';

import React, { useState } from 'react';
import { LobbyScene } from '@/components/3d/LobbyScene';
import { usePlayerStore } from '@/lib/store/player-store';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import WelcomePage from './welcome/page';
import { Zap, Timer, Turtle, Map, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CreateChallengeModal } from '@/components/lobby/create-challenge-modal';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { chests } = usePlayerStore();
  const [selectedLeague, setSelectedLeague] = useState<'bullet' | 'blitz' | 'rapid'>('blitz');
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-zinc-950 text-zinc-500">Loading...</div>;
  }

  if (!user) {
    return <WelcomePage />;
  }

  const leagues = [
    { id: 'bullet', icon: Zap, color: 'text-yellow-400', label: 'Bullet' },
    { id: 'blitz', icon: Timer, color: 'text-blue-400', label: 'Blitz' },
    { id: 'rapid', icon: Turtle, color: 'text-green-400', label: 'Rapid' },
  ] as const;

  return (
    <div className="h-full w-full relative">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <LobbyScene />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">

        {/* Top Area: Story Mode & League Selector */}
        <div className="pt-4 px-4 flex flex-col gap-4 pointer-events-auto">
          {/* Story Mode Button */}
          <Link href="/adventure" className="self-end">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-zinc-900/80 backdrop-blur-md border border-purple-500/50 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg"
            >
              <Map size={16} className="text-purple-400" />
              <span className="text-xs font-bold text-purple-100 uppercase tracking-wider">Story Mode</span>
            </motion.div>
          </Link>

          {/* League Selector */}
          <div className="self-center bg-black/40 backdrop-blur-md rounded-full p-1 flex gap-1 border border-white/10">
            {leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all",
                  selectedLeague === league.id
                    ? "bg-zinc-800 text-white shadow-md"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <league.icon size={14} className={selectedLeague === league.id ? league.color : "currentColor"} />
                <span className={cn("text-[10px] font-bold uppercase", selectedLeague !== league.id && "hidden sm:inline")}>
                  {league.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Middle Spacer */}
        <div className="flex-1" />

        {/* Battle Button Area */}
        <div className="flex flex-col items-center gap-2 py-4 pointer-events-auto">
          <div className="text-white/80 text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
            {selectedLeague} Arena
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChallengeModalOpen(true)}
            animate={{
              boxShadow: ["0px 0px 0px 0px rgba(234, 179, 8, 0.7)", "0px 0px 20px 10px rgba(234, 179, 8, 0)"]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-white font-black text-xl px-10 py-4 rounded-full border-4 border-yellow-200 shadow-xl uppercase tracking-wider transform transition-transform flex items-center gap-2"
          >
            <Swords size={24} />
            Battle
          </motion.button>
        </div>

        {/* Chest Slots */}
        <div className="h-24 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 flex items-end justify-center gap-2 pointer-events-auto">
          {chests.map((chest, index) => (
            <div
              key={index}
              className="w-1/4 h-16 bg-zinc-800/80 backdrop-blur-sm rounded-lg border border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden"
            >
              {chest ? (
                <>
                  <div className="text-lg">📦</div>
                  <span className="text-[8px] font-bold text-yellow-500 uppercase mt-0.5">{chest.type}</span>
                  <span className="text-[8px] text-zinc-400">{Math.floor(chest.unlockTime / 60)}m</span>
                </>
              ) : (
                <div className="text-zinc-600 flex flex-col items-center">
                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-50">Empty</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <CreateChallengeModal
        isOpen={isChallengeModalOpen}
        onClose={() => setIsChallengeModalOpen(false)}
        defaultTimeControl={selectedLeague}
      />
    </div>
  );
}