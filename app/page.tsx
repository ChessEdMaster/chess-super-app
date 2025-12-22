'use client';

import React, { useState } from 'react';
import { IsoHero } from '@/components/isometric/IsoHero';
import { IsoChest } from '@/components/isometric/IsoChest';
import { usePlayerStore } from '@/lib/store/player-store';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';
import WelcomePage from './welcome/page';
import { Zap, Timer, Turtle, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function HomePage() {
  const { user, loading } = useAuth();
  const { chests, startUnlockChest, openChest, updateChestTimers } = usePlayerStore();
  const [selectedLeague, setSelectedLeague] = useState<'bullet' | 'blitz' | 'rapid'>('blitz');
  const router = useRouter();

  // Timer for chests
  React.useEffect(() => {
    const timer = setInterval(() => {
      updateChestTimers();
    }, 1000);
    return () => clearInterval(timer);
  }, [updateChestTimers]);

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

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-[var(--background)] text-[var(--color-secondary)]">Loading...</div>;
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
    <div className="h-full w-full relative overflow-hidden bg-[var(--background)]">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        {/* Dynamic Background based on League */}
        <div className={cn(
          "absolute inset-0 transition-all duration-1000",
          selectedLeague === 'blitz' ? "bg-slate-900" :
            selectedLeague === 'bullet' ? "bg-amber-950" :
              "bg-sky-900"
        )}>
          <div className={`absolute inset-0 opacity-30 ${selectedLeague === 'blitz' ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black' :
              selectedLeague === 'bullet' ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700 via-orange-900 to-black' :
                'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-blue-900 to-black'
            }`} />
          {/* Stars/Particles (CSS only) */}
          <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-5 mix-blend-overlay"></div>
        </div>

        {/* Floor/Stage */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center">
          <div className="w-[800px] h-[400px] bg-white/5 blur-3xl rounded-full transform scale-y-25 translate-y-20"></div>
        </div>

        {/* Hero Stage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-32 pointer-events-none">
          <IsoHero />
        </div>

        {/* Chest Pedestals */}
        <div className="absolute bottom-32 w-full flex justify-center gap-8 perspective-1000 pointer-events-auto">
          {chests.map((chest, index) => (
            <IsoChest
              key={index}
              chest={chest}
              onClick={() => handleChestClick(index)}
            />
          ))}
        </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none">

        {/* Top Area: League Selector */}
        <div className="pt-6 px-4 flex flex-col gap-4 pointer-events-auto h-full">
          {/* League Selector (Visual) */}
          <div className="self-center glass-panel bg-[var(--glass-bg)] border-[var(--glass-border)] rounded-full p-1.5 flex gap-1 transform hover:scale-105 transition-transform duration-300 shadow-xl backdrop-blur-xl">
            {leagues.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={cn(
                  "px-4 py-2 rounded-full flex items-center gap-2 transition-all font-bold text-[10px]",
                  selectedLeague === league.id
                    ? "bg-[var(--color-primary)] text-[var(--background)] shadow-lg"
                    : "text-[var(--color-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <league.icon size={14} className={cn(selectedLeague === league.id ? "text-[var(--background)]" : league.color)} />
                <span className={cn(selectedLeague !== league.id && "hidden sm:inline")}>
                  {league.label}
                </span>
              </button>
            ))}
          </div>

          {/* Middle Spacer */}
          <div className="flex-1" />

          {/* Battle Button Area */}
          <div className="flex flex-col items-center gap-4 py-8 pointer-events-auto">
            <div className="text-[var(--color-gold)] text-[10px] font-bold tracking-widest font-display drop-shadow-md text-glow">
              ENTER THE ARENA
            </div>
            <Link href="/play">
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
                className="bg-gradient-to-b from-[var(--color-gold)] via-amber-500 to-amber-700 text-black font-black text-2xl px-12 py-5 rounded-2xl border-2 border-amber-300 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] relative overflow-hidden group font-display tracking-wide"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
                <div className="flex items-center gap-3 relative z-10">
                  <Swords size={28} className="text-amber-950" />
                  <span>BATTLE</span>
                </div>
              </motion.button>
            </Link>
          </div>

          {/* Bottom Spacer (Chests are now background) */}
          <div className="h-48" />
        </div>
      </div>
    </div>
  );
}