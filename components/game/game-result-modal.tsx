'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Frown, Handshake, Swords, RotateCcw, Search, ArrowLeft, Gift, Flame, Star, Coins, Gem, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/lib/store/player-store';
import { ConceptCard as ConceptCardComponent } from '@/components/cards/concept-card';
import confetti from 'canvas-confetti';

interface GameResultModalProps {
    result: 'win' | 'loss' | 'draw' | null;
    eloChange: number;
    streak: number;
    onNewGame: () => void;
    onRematch: () => void;
    onAnalyze: () => void;
    onExit: () => void;
    onClose: () => void;
}

interface ChestReward {
    gold: number;
    gems: number;
    xp: number;
    cardId: string;
    cardAmount: number;
}

// Chest reward tiers based on streak
const STREAK_CHEST_UNLOCKS = [
    { streak: 1, unlockTime: 300, type: 'WOODEN' as const }, // 5 min
    { streak: 2, unlockTime: 600, type: 'SILVER' as const }, // 10 min
    { streak: 3, unlockTime: 900, type: 'GOLDEN' as const }, // 15 min
    { streak: 4, unlockTime: 1800, type: 'LEGENDARY' as const }, // 30 min
];

export function GameResultModal({
    result,
    eloChange,
    streak,
    onNewGame,
    onRematch,
    onAnalyze,
    onExit,
    onClose
}: GameResultModalProps) {
    const [stage, setStage] = useState<'result' | 'chest' | 'rewards'>('result');
    const [rewards, setRewards] = useState<ChestReward | null>(null);
    const { cards, addGold, addGems, addXp, addCardCopy, addChest, chests } = usePlayerStore();

    // Trigger confetti on win
    useEffect(() => {
        if (result === 'win') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [result]);

    // Generate instant victory rewards
    useEffect(() => {
        if (result === 'win' && stage === 'result') {
            // Generate rewards
            const goldReward = 20 + Math.floor(Math.random() * 30);
            const gemsReward = Math.floor(Math.random() * 3);
            const xpReward = 25 + Math.floor(Math.random() * 25);
            const randomCardIndex = Math.floor(Math.random() * cards.length);
            const cardId = cards[randomCardIndex]?.id || '';
            const cardAmount = 1 + Math.floor(Math.random() * 2);

            setRewards({
                gold: goldReward,
                gems: gemsReward,
                xp: xpReward,
                cardId,
                cardAmount
            });

            // Apply rewards immediately
            addGold(goldReward);
            addGems(gemsReward);
            addXp(xpReward);
            if (cardId) addCardCopy(cardId, cardAmount);

            // Add streak chest if applicable
            if (streak >= 1 && streak <= 4) {
                const chestConfig = STREAK_CHEST_UNLOCKS[streak - 1];
                const hasEmptySlot = chests.some(c => c === null);

                if (hasEmptySlot) {
                    addChest({
                        id: Math.random().toString(36).substring(7),
                        type: chestConfig.type,
                        unlockTime: chestConfig.unlockTime,
                        status: 'LOCKED'
                    });
                }
            }
        }
    }, [result, stage]);

    if (!result) return null;

    const resultConfig = {
        win: {
            icon: Trophy,
            title: '🏆 VICTÒRIA!',
            color: 'text-yellow-400',
            bgGradient: 'from-yellow-500/20 to-transparent',
            borderColor: 'border-yellow-500/30'
        },
        loss: {
            icon: Frown,
            title: 'Derrota',
            color: 'text-red-400',
            bgGradient: 'from-red-500/10 to-transparent',
            borderColor: 'border-red-500/20'
        },
        draw: {
            icon: Handshake,
            title: 'Taules',
            color: 'text-zinc-400',
            bgGradient: 'from-zinc-500/10 to-transparent',
            borderColor: 'border-zinc-500/20'
        }
    };

    const config = resultConfig[result];
    const rewardCard = rewards && cards.find(c => c.id === rewards.cardId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className={`bg-zinc-900 border ${config.borderColor} rounded-2xl max-w-sm w-full text-center relative overflow-hidden shadow-2xl`}
            >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${config.bgGradient} pointer-events-none`} />

                {/* Header */}
                <div className="relative p-6 pb-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                    >
                        <config.icon className={`w-16 h-16 mx-auto ${config.color} drop-shadow-lg`} />
                    </motion.div>

                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className={`text-2xl font-black mt-3 ${config.color} font-display`}
                    >
                        {config.title}
                    </motion.h2>

                    {/* ELO Change */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`mt-2 text-lg font-bold ${eloChange > 0 ? 'text-green-400' : eloChange < 0 ? 'text-red-400' : 'text-zinc-400'}`}
                    >
                        {eloChange > 0 ? `+${eloChange}` : eloChange} ELO
                    </motion.div>

                    {/* Streak Badge */}
                    {result === 'win' && streak > 0 && (
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', delay: 0.5 }}
                            className="mt-3 inline-flex items-center gap-1.5 bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full border border-orange-500/30"
                        >
                            <Flame size={16} className="fill-current" />
                            <span className="font-bold text-sm">Ratxa x{streak}!</span>
                            {streak <= 4 && <span className="text-[10px] opacity-75">+Cofre</span>}
                        </motion.div>
                    )}
                </div>

                {/* Victory Rewards */}
                {result === 'win' && rewards && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="px-6 pb-4"
                    >
                        <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/50">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">
                                <Sparkles size={10} /> Recompenses <Sparkles size={10} />
                            </div>
                            <div className="flex justify-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="text-blue-400" />
                                    <span className="font-bold text-white">+{rewards.xp}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Coins size={14} className="text-yellow-400" />
                                    <span className="font-bold text-white">+{rewards.gold}</span>
                                </div>
                                {rewards.gems > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Gem size={14} className="text-purple-400" />
                                        <span className="font-bold text-white">+{rewards.gems}</span>
                                    </div>
                                )}
                            </div>

                            {rewardCard && (
                                <div className="mt-2 pt-2 border-t border-zinc-700/50">
                                    <div className="text-[10px] text-green-400 font-bold">
                                        +{rewards.cardAmount}x {rewardCard.title}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Actions */}
                <div className="px-6 pb-6 space-y-2 relative">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={onRematch}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={16} />
                            Revenja
                        </Button>
                        <Button
                            onClick={onNewGame}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Swords size={16} />
                            Nova
                        </Button>
                    </div>

                    <Button
                        onClick={onAnalyze}
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white py-4 rounded-xl flex items-center justify-center gap-2"
                    >
                        <Search size={16} />
                        Analitzar Partida
                    </Button>

                    <Button
                        onClick={onExit}
                        variant="ghost"
                        className="w-full text-zinc-500 hover:text-white py-3"
                    >
                        <ArrowLeft size={14} className="mr-2" />
                        Tornar a Battle
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
