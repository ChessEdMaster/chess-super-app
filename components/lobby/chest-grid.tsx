'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, Gift } from 'lucide-react';
import { usePlayerStore, CHEST_ECONOMY } from '@/lib/store/player-store';
import { Chest } from '@/types/rpg';

interface ChestGridProps {
    chests?: (Chest | null)[];
    slots?: number;
    onOpenChest?: (index: number) => void;
    compact?: boolean;
}
import { toast } from 'sonner';

export function ChestGrid({ chests: propChests, slots, onOpenChest, compact }: ChestGridProps = {}) {
    const { chests: storeChests, startUnlockChest, openChest, updateChestTimers, instantUnlock, profile } = usePlayerStore();
    const chests = propChests || storeChests;
    // Local state to force re-render for timer visuals without hitting the store every second for everything
    const [, setTick] = useState(0);

    // Timer effect - runs every second to update visuals and check for unlock completion
    useEffect(() => {
        const timer = setInterval(() => {
            // Update the store state if needed (e.g. transition from UNLOCKING to READY)
            updateChestTimers();
            // Force local re-render to update countdowns
            setTick(t => t + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [updateChestTimers]);

    const handleChestClick = (index: number) => {
        const chest = chests[index];
        if (!chest) return;

        if (chest.status === 'LOCKED') {
            const economy = CHEST_ECONOMY[chest.type];
            const canAfford = profile.currencies.gold >= economy.instantCost;

            // Simple choice: Start or Instant?
            // For now, let's keep it simple: if clicking a LOCKED chest, we show a toast or just start it.
            // Actually, a better UX is to allow BOTH. 
            // Let's modify the UI to have a sub-button for Instant Unlock.

            const isAnyUnlocking = chests.some(c => c && c.status === 'UNLOCKING');
            if (isAnyUnlocking) {
                toast.error("Ja estàs desbloquejant un cofre. Espera que acabi.");
                return;
            }
            startUnlockChest(index);
            toast.success("Desbloqueig iniciat!");
        } else if (chest.status === 'READY') {
            if (onOpenChest) {
                onOpenChest(index);
            } else {
                const rewards = openChest(index);
                if (rewards) {
                    toast.success(`Cofre obert! Guanyat: ${rewards.gold} Or, ${rewards.gems} Gemmes`);
                }
            }
        }
    };

    const handleInstantUnlock = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        const chest = chests[index];
        if (!chest || chest.status !== 'LOCKED') return;

        const economy = CHEST_ECONOMY[chest.type];
        if (profile.currencies.gold < economy.instantCost) {
            toast.error("No tens prou or!");
            return;
        }

        if (instantUnlock(index)) {
            toast.success("Cofre desbloquejat a l'instant!");
        }
    };

    return (
        <div className="mt-8">
            {!compact && (
                <h3 className="text-xs font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Archive size={14} /> Cofres
                </h3>
            )}
            <div className="grid grid-cols-4 gap-2">
                {chests.map((chest, i) => (
                    <motion.div
                        key={i}
                        onClick={() => handleChestClick(i)}
                        whileHover={chest ? { scale: 1.05 } : {}}
                        whileTap={chest ? { scale: 0.95 } : {}}
                        className={`aspect-square rounded border flex flex-col items-center justify-center relative cursor-pointer ${chest ? 'border-amber-500/30 bg-amber-900/10' : 'border-[var(--border)] bg-[var(--card-bg)]'}`}
                    >
                        {chest ? (
                            <>
                                <Gift className={`mb-1 ${chest.status === 'LOCKED' ? 'text-[var(--color-secondary)]' : 'text-amber-500'}`} size={16} />

                                {chest.status === 'READY' && <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}

                                <span className="text-[8px] font-bold uppercase text-[var(--color-secondary)]">
                                    {chest.status === 'LOCKED' && 'LOCKED'}
                                    {chest.status === 'UNLOCKING' && 'OPENING'}
                                    {chest.status === 'READY' && 'READY'}
                                </span>

                                <span className="text-[10px] text-amber-200">
                                    {(() => {
                                        const totalSeconds = Math.max(0, Math.ceil(chest.unlockTime - ((Date.now() - (chest.unlockStartedAt || 0)) / 1000)));
                                        const mins = Math.floor(totalSeconds / 60);
                                        const secs = totalSeconds % 60;
                                        return mins > 0 ? `${mins}m` : `${secs}s`;
                                    })()}
                                </span>

                                {chest.status === 'LOCKED' && (
                                    <button
                                        onClick={(e) => handleInstantUnlock(e, i)}
                                        className="mt-1 px-1.5 py-0.5 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500/30 rounded text-[7px] text-yellow-500 font-black transition-colors"
                                    >
                                        {CHEST_ECONOMY[chest.type].instantCost} 🪙
                                    </button>
                                )}
                            </>
                        ) : <span className="text-[var(--color-muted)] text-[8px]">EMPTY</span>}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
