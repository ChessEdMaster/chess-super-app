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
        <div className="h-full w-full bg-zinc-950 p-3 overflow-y-auto pb-24">
            <h1 className="text-xl font-black text-white mb-4 uppercase tracking-wider italic">
                Battle Deck
            </h1>

            {/* Cards Grid */}
            <div className="grid grid-cols-3 gap-2">
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
