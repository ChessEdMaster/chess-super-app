'use client';

import React, { useState } from 'react';
import { LobbyScene } from '@/components/3d/LobbyScene';
import { usePlayerStore } from '@/lib/store/player-store';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import WelcomePage from './welcome/page';
import { Zap, Timer, Turtle, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { chests } = usePlayerStore();
  const [selectedLeague, setSelectedLeague] = useState<'bullet' | 'blitz' | 'rapid'>('blitz');
  const router = useRouter();

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

        {/* Top Area: Story Mode & Minigames & League Selector */}
        <div className="pt-4 px-4 flex flex-col gap-4 pointer-events-auto h-full">
          {/* Top Area: League Selector */}
          {/* League Selector (Visual) */}
          <div className="self-center glass-panel rounded-full p-1.5 flex gap-1 transform hover:scale-105 transition-transform duration-300">
            {leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={cn(
                  "px-4 py-2 rounded-full flex items-center gap-2 transition-all font-display uppercase tracking-wider text-[10px]",
                  selectedLeague === league.id
                    ? "bg-zinc-800 text-white shadow-lg border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <league.icon size={14} className={selectedLeague === league.id ? league.color : "currentColor"} />
                <span className={cn(selectedLeague !== league.id && "hidden sm:inline")}>
                  {league.label}
                </span>
              </button>
            ))}
          </div>

          {/* Middle Spacer */}
          <div className="flex-1" />

          {/* Battle Button Area */}
          <div className="flex flex-col items-center gap-4 py-6 pointer-events-auto">
            <div className="text-amber-400/80 text-[10px] font-bold uppercase tracking-[0.3em] font-display drop-shadow-md">
              Enter the Arena
            </div>
            <Link href="/lobby">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: ["0px 0px 0px 0px rgba(234, 179, 8, 0.4)", "0px 0px 30px 10px rgba(234, 179, 8, 0)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className="bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 text-black font-black text-2xl px-12 py-5 rounded-2xl border-2 border-amber-300 shadow-2xl relative overflow-hidden group font-display tracking-widest"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
                <div className="flex items-center gap-3 relative z-10">
                  <Swords size={28} className="text-amber-950" />
                  <span>BATTLE</span>
                </div>
              </motion.button>
            </Link>
          </div>

          {/* Chest Slots */}
          <div className="h-28 bg-gradient-to-t from-black/90 to-transparent px-4 pb-6 flex items-end justify-center gap-3 pointer-events-auto">
            {chests.map((chest, index) => (
              <div
                key={index}
                className="w-1/4 h-20 glass-panel rounded-xl flex flex-col items-center justify-center relative overflow-hidden group hover:bg-zinc-800/40 transition-colors"
              >
                {chest ? (
                  <>
                    <div className="text-2xl mb-1 drop-shadow-md transition-transform group-hover:scale-110">📦</div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase font-display tracking-wider">{chest.type}</span>
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">{Math.floor(chest.unlockTime / 60)}m</span>
                  </>
                ) : (
                  <div className="text-zinc-700 flex flex-col items-center opacity-50">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center mb-1">
                      <span className="text-xs">+</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}