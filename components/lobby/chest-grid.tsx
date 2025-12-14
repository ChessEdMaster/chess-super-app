'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, Gift } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/player-store';
import { Chest } from '@/types/rpg';

interface ChestGridProps {
    chests?: (Chest | null)[];
    slots?: number;
    onOpenChest?: (index: number) => void;
    compact?: boolean;
}
import { toast } from 'sonner';

export function ChestGrid({ chests: propChests, slots, onOpenChest, compact }: ChestGridProps = {}) {
    const { chests: storeChests, startUnlockChest, openChest, updateChestTimers } = usePlayerStore();
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

    return (
        <div className="mt-8">
            {!compact && (
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
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
    );
}
