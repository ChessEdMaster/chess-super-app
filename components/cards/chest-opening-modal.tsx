'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coins, Gem, X } from 'lucide-react';
import { ConceptCard } from '@/types/rpg';
import { ConceptCard as ConceptCardComponent } from '@/components/cards/concept-card';
import { usePlayerStore } from '@/lib/store/player-store';

interface ChestOpeningModalProps {
    rewards: { gold: number; gems: number; cardId: string; cardAmount: number } | null;
    onClose: () => void;
}

export function ChestOpeningModal({ rewards, onClose }: ChestOpeningModalProps) {
    const [stage, setStage] = useState<'countdown' | 'opening' | 'rewards'>('countdown');
    const [count, setCount] = useState(3);
    const { cards } = usePlayerStore();

    useEffect(() => {
        if (stage === 'countdown') {
            if (count > 0) {
                const timer = setTimeout(() => setCount(count - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                setStage('opening');
                setTimeout(() => setStage('rewards'), 1000); // 1s opening animation
            }
        }
    }, [count, stage]);

    if (!rewards) return null;

    const rewardCard = cards.find(c => c.id === rewards.cardId);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <AnimatePresence mode="wait">
                {stage === 'countdown' && (
                    <motion.div
                        key="countdown"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="text-9xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                    >
                        {count > 0 ? count : "OPEN!"}
                    </motion.div>
                )}

                {stage === 'opening' && (
                    <motion.div
                        key="opening"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, -5, 5, 0]
                        }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                    >
                        <Gift size={200} className="text-amber-400 drop-shadow-[0_0_50px_rgba(251,191,36,0.5)]" />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-white blur-3xl opacity-50"
                        />
                    </motion.div>
                )}

                {stage === 'rewards' && (
                    <motion.div
                        key="rewards"
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl"
                    >
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

                        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-wider drop-shadow-lg">
                            Rewards!
                        </h2>

                        <div className="space-y-4 mb-8">
                            {/* Gold */}
                            <motion.div
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-zinc-800/50 p-3 rounded-xl flex items-center justify-between border border-zinc-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-500/20 p-2 rounded-lg">
                                        <Coins className="text-amber-400" size={24} />
                                    </div>
                                    <span className="font-bold text-zinc-300">Gold</span>
                                </div>
                                <span className="text-xl font-black text-white">+{rewards.gold}</span>
                            </motion.div>

                            {/* Gems */}
                            <motion.div
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="bg-zinc-800/50 p-3 rounded-xl flex items-center justify-between border border-zinc-700"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-500/20 p-2 rounded-lg">
                                        <Gem className="text-purple-400" size={24} />
                                    </div>
                                    <span className="font-bold text-zinc-300">Gems</span>
                                </div>
                                <span className="text-xl font-black text-white">+{rewards.gems}</span>
                            </motion.div>

                            {/* Card */}
                            {rewardCard && (
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="pt-4"
                                >
                                    <div className="text-sm text-zinc-400 mb-2 font-bold uppercase tracking-wider">New Card Found!</div>
                                    <div className="transform scale-90 hover:scale-100 transition-transform duration-300">
                                        <ConceptCardComponent card={rewardCard} />
                                    </div>
                                    <div className="mt-2 text-green-400 font-bold text-lg">x{rewards.cardAmount}</div>
                                </motion.div>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/50 transition-all active:scale-95"
                        >
                            Collect Rewards
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
