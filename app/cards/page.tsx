'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ConceptCard } from '@/components/cards/concept-card';
import { ConceptCard as IConceptCard } from '@/types/rpg';
import { X, ArrowUpCircle, Pickaxe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzleMiner } from '@/components/cards/puzzle-miner';

export default function CardsPage() {
    const { cards, profile, addCardCopy } = usePlayerStore();
    const [selectedCard, setSelectedCard] = useState<IConceptCard | null>(null);
    const [isMining, setIsMining] = useState(false);

    const handleMineComplete = (success: boolean) => {
        if (success && selectedCard) {
            addCardCopy(selectedCard.id, 1);
            alert("Mining Successful! +1 Card Copy");
        }
        setIsMining(false);
        setSelectedCard(null);
    };

    return (
        <div className="h-full w-full bg-zinc-950 p-4 overflow-y-auto pb-32">
            <h1 className="text-2xl font-black text-white mb-6 uppercase tracking-wider italic">
                Battle Deck
            </h1>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-zinc-900 w-full max-w-sm rounded-3xl border border-zinc-700 overflow-hidden shadow-2xl relative"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedCard(null)}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-white z-10"
                            >
                                <X size={24} />
                            </button>

                            {/* Card Preview Header */}
                            <div className="bg-zinc-950 p-8 flex justify-center border-b border-zinc-800">
                                <div className="transform scale-125">
                                    <ConceptCard card={selectedCard} />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-6">
                                <h2 className="text-2xl font-black text-white mb-1">{selectedCard.title}</h2>
                                <p className="text-zinc-400 text-sm mb-4">{selectedCard.description}</p>

                                {/* Stats / Info */}
                                <div className="grid grid-cols-2 gap-2 mb-6">
                                    <div className="bg-zinc-800 p-2 rounded-lg text-center">
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Category</span>
                                        <div className="text-sm font-bold text-white">{selectedCard.category}</div>
                                    </div>
                                    <div className="bg-zinc-800 p-2 rounded-lg text-center">
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Rarity</span>
                                        <div className="text-sm font-bold text-white">{selectedCard.rarity}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    {selectedCard.cardsOwned >= selectedCard.cardsRequired ? (
                                        <button className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wide shadow-[0_4px_0_rgb(21,128,61)] active:translate-y-1 active:shadow-none transition-all">
                                            <ArrowUpCircle size={20} />
                                            Upgrade
                                            <span className="text-xs bg-black/20 px-1.5 py-0.5 rounded ml-1">500g</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setIsMining(true)}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wide shadow-[0_4px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none transition-all"
                                        >
                                            <Pickaxe size={20} />
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
