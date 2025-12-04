'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ConceptCard } from '@/components/cards/concept-card';
import { ConceptCard as IConceptCard, Chest } from '@/types/rpg';
import { X, ArrowUpCircle, Pickaxe, Archive, Clock, Lock, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleMiner } from '@/components/cards/puzzle-miner';
import { toast } from 'sonner';

export default function CardsPage() {
    const { cards, chests, profile, addCardCopy, startUnlockChest, openChest } = usePlayerStore();
    const [selectedCard, setSelectedCard] = useState<IConceptCard | null>(null);
    const [isMining, setIsMining] = useState(false);

    const handleMineComplete = (success: boolean) => {
        if (success && selectedCard) {
            addCardCopy(selectedCard.id, 1);
            toast.success("Mining Successful! +1 Card Copy");
        }
        setIsMining(false);
        setSelectedCard(null);
    };

    const handleChestClick = (index: number, chest: Chest | null) => {
        if (!chest) {
            if (profile.role === 'SuperAdmin') {
                // Debug: Add a chest
                usePlayerStore.getState().addChest({
                    id: Math.random().toString(36).substring(7),
                    type: 'WOODEN',
                    unlockTime: 10,
                    status: 'LOCKED'
                });
                toast.success("Debug: Chest Added!");
            }
            return;
        }

        if (chest.status === 'LOCKED') {
            startUnlockChest(index);
            toast.info("Chest unlocking started!");
        } else if (chest.status === 'UNLOCKING') {
            // For SuperAdmin or testing, allow instant finish?
            // Or just wait.
            if (profile.role === 'SuperAdmin') {
                openChest(index);
                toast.success("Chest Opened (SuperAdmin Speedup)!");
            } else {
                toast.info("Chest is unlocking... wait for timer (Not implemented yet)");
                // In a real app, we'd check if time is up.
                // For now, let's just allow opening if it's unlocking for demo purposes
                openChest(index);
                toast.success("Chest Opened!");
            }
        } else if (chest.status === 'READY') {
            openChest(index);
            toast.success("Chest Opened!");
        }
    };

    return (
        <div className="h-full w-full bg-zinc-950 p-3 overflow-y-auto pb-24">
            <h1 className="text-xl font-black text-white mb-4 uppercase tracking-wider italic">
                Battle Deck
            </h1>

            {/* Chests Section */}
            <div className="mb-8">
                <h2 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Archive className="text-amber-500 h-4 w-4" />
                    Chest Slots
                </h2>
                <div className="grid grid-cols-4 gap-3">
                    {chests.map((chest, index) => (
                        <div
                            key={index}
                            onClick={() => handleChestClick(index, chest)}
                            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 ${chest
                                ? 'border-amber-500/50 bg-amber-900/20 cursor-pointer hover:bg-amber-900/30'
                                : 'border-zinc-800 bg-zinc-900/50'
                                }`}
                        >
                            {chest ? (
                                <>
                                    <Gift className={`h-8 w-8 mb-1 ${chest.type === 'LEGENDARY' ? 'text-purple-400 animate-pulse' :
                                        chest.type === 'GOLDEN' ? 'text-yellow-400' :
                                            chest.type === 'SILVER' ? 'text-slate-300' :
                                                'text-amber-700'
                                        }`} />
                                    <span className="text-[10px] font-bold text-white uppercase">{chest.type}</span>

                                    {/* Status Overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        {chest.status === 'LOCKED' && <Lock className="h-4 w-4 text-white/50" />}
                                        {chest.status === 'UNLOCKING' && <Clock className="h-4 w-4 text-blue-400 animate-pulse" />}
                                        {chest.status === 'READY' && <span className="text-[10px] font-bold text-green-400 bg-black/80 px-1 rounded animate-bounce">OPEN!</span>}
                                    </div>
                                </>
                            ) : (
                                <span className="text-zinc-700 text-xs font-bold">EMPTY</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            <h2 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                Collection
            </h2>
            <div className="grid grid-cols-4 gap-2">
                {cards.map((card) => (
                    <ConceptCard
                        key={card.id}
                        card={card}
                        onClick={setSelectedCard}
                    />
                ))}
            </div>

            {/* Card Detail Modal */}
            <AnimatePresence>
                {selectedCard && !isMining && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 w-full max-w-xs rounded-2xl border border-zinc-700 overflow-hidden shadow-2xl relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedCard(null)}
                                className="absolute top-3 right-3 text-zinc-400 hover:text-white z-10 bg-black/50 rounded-full p-1"
                            >
                                <X size={16} />
                            </button>

                            {/* Card Preview Header */}
                            <div className="bg-zinc-950 p-6 flex justify-center border-b border-zinc-800">
                                <div className="transform scale-110">
                                    <ConceptCard card={selectedCard} />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-4">
                                <h2 className="text-lg font-black text-white mb-1">{selectedCard.title}</h2>
                                <p className="text-zinc-400 text-xs mb-4 leading-relaxed">{selectedCard.description}</p>

                                {/* Stats / Info */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    <div className="bg-zinc-800 p-1.5 rounded-lg text-center">
                                        <span className="text-[8px] text-zinc-500 uppercase font-bold">Category</span>
                                        <div className="text-xs font-bold text-white">{selectedCard.category}</div>
                                    </div>
                                    <div className="bg-zinc-800 p-1.5 rounded-lg text-center">
                                        <span className="text-[8px] text-zinc-500 uppercase font-bold">Rarity</span>
                                        <div className="text-xs font-bold text-white">{selectedCard.rarity}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {selectedCard.cardsOwned >= selectedCard.cardsRequired ? (
                                        <button className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wide shadow-[0_3px_0_rgb(21,128,61)] active:translate-y-0.5 active:shadow-none transition-all text-xs">
                                            <ArrowUpCircle size={16} />
                                            Upgrade
                                            <span className="text-[10px] bg-black/20 px-1 py-0.5 rounded ml-0.5">500g</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsMining(true)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wide shadow-[0_3px_0_rgb(29,78,216)] active:translate-y-0.5 active:shadow-none transition-all text-xs"
                                        >
                                            <Pickaxe size={16} />
                                            Mine Cards
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Puzzle Miner Overlay */}
            {isMining && selectedCard && (
                <PuzzleMiner
                    puzzleId={selectedCard.minigameId}
                    onComplete={handleMineComplete}
                    onClose={() => setIsMining(false)}
                />
            )}
        </div>
    );
}
