'use client';

import React from 'react';
import { LobbyScene } from '@/components/3d/LobbyScene';
import { usePlayerStore } from '@/lib/store/player-store';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import WelcomePage from './welcome/page';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { chests } = usePlayerStore();

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-zinc-950 text-zinc-500">Loading...</div>;
  }

  if (!user) {
    return <WelcomePage />;
  }

  return (
    <div className="h-full w-full relative bg-zinc-950">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <LobbyScene />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">

        {/* Top Spacer */}
        <div className="flex-1" />

        {/* Battle Button Area */}
        <div className="flex justify-center items-center py-8 pointer-events-auto">
          <Link href="/play/online">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: ["0px 0px 0px 0px rgba(234, 179, 8, 0.7)", "0px 0px 20px 10px rgba(234, 179, 8, 0)"]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop"
              }}
              className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-white font-black text-3xl px-12 py-6 rounded-full border-4 border-yellow-200 shadow-xl uppercase tracking-wider transform transition-transform"
            >
              Battle
            </motion.button>
          </Link>
        </div>

        {/* Chest Slots */}
        <div className="h-32 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 flex items-end justify-center gap-3 pointer-events-auto">
          {chests.map((chest, index) => (
            <div
              key={index}
              className="w-1/4 h-24 bg-zinc-800/80 backdrop-blur-sm rounded-lg border-2 border-zinc-700 flex flex-col items-center justify-center relative overflow-hidden"
            >
              {chest ? (
                <>
                  <div className="text-2xl">📦</div>
                  <span className="text-[10px] font-bold text-yellow-500 uppercase mt-1">{chest.type}</span>
                  <span className="text-[10px] text-zinc-400">{Math.floor(chest.unlockTime / 60)}m</span>
                </>
              ) : (
                <div className="text-zinc-600 flex flex-col items-center">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Empty</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}