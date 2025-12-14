'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ConceptCard } from '@/components/cards/concept-card';
import { ConceptCard as IConceptCard } from '@/types/rpg';
import { X, Crown, Shield, Zap, Target, Crosshair, Hexagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function CardsPage() {
    const { cards, profile, addCardCopy, upgradeCard } = usePlayerStore();
    const [selectedCard, setSelectedCard] = useState<IConceptCard | null>(null);
    const [isMining, setIsMining] = useState(false);

    const handleMineSuccess = () => {
        if (selectedCard) {
            addCardCopy(selectedCard.id, 1);
            toast.success("Mining Successful! +1 Card Copy");
        }
    };

    const handleUpgrade = () => {
        if (!selectedCard) return;
        const cost = selectedCard.level * 100;
        if (profile.currencies.gold < cost) {
            toast.error("Not enough Gold!");
            return;
        }
        upgradeCard(selectedCard.id);
        toast.success("Card Upgraded!");
        setSelectedCard(null);
    };

    const avatars = [
        { name: 'King', icon: Crown, color: 'text-amber-500' },
        { name: 'Queen', icon: Target, color: 'text-fuchsia-500' },
        { name: 'Rook', icon: Shield, color: 'text-slate-400' },
        { name: 'Bishop', icon: Crosshair, color: 'text-indigo-400' },
        { name: 'Knight', icon: Zap, color: 'text-emerald-500' },
        { name: 'Pawn', icon: Hexagon, color: 'text-rose-400' },
    ];

    return (
        <div className="h-full w-full p-6 overflow-y-auto scrollbar-subtle pb-24 max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-gold-gradient mb-8 uppercase tracking-widest italic font-display drop-shadow-lg">
                Collection
            </h1>

            {/* Avatars Section */}
            <div className="mb-8 glass-panel p-4 rounded-xl bg-zinc-900/40">
                <h2 className="text-xs font-bold text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-widest font-display">
                    Avatars
                </h2>
                <div className="grid grid-cols-6 gap-4">
                    {avatars.map((avatar, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform group-hover:border-amber-500/50">
                                <avatar.icon className={`h-6 w-6 ${avatar.color}`} />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase group-hover:text-white transition-colors">{avatar.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-display">
                    Cards ({cards.length})
                </h2>
                <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                    {cards.reduce((acc, card) => acc + card.level, 0)} Total Levels
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                                        <button
                                            onClick={handleUpgrade}
                                            className="flex-1 bg-green-500 hover:bg-green-400 text-black font-black py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wide shadow-[0_3px_0_rgb(21,128,61)] active:translate-y-0.5 active:shadow-none transition-all text-xs"
                                        >
                                            <ArrowUpCircle size={16} />
                                            Upgrade
                                            <span className="text-[10px] bg-black/20 px-1 py-0.5 rounded ml-0.5">{selectedCard.level * 100}g</span>
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
                    onSuccess={handleMineSuccess}
                    onClose={() => setIsMining(false)}
                />
            )}
        </div>
    );
}

