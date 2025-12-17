'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ConceptCard } from '@/components/cards/concept-card';
import { PuzzleMiner } from '@/components/cards/puzzle-miner';
import { ConceptCard as IConceptCard } from '@/types/rpg';
import { X, Crown, Shield, Zap, Target, Crosshair, Hexagon, ArrowUpCircle, Pickaxe, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

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
        { name: 'Rook', icon: Shield, color: 'text-zinc-400' },
        { name: 'Bishop', icon: Crosshair, color: 'text-indigo-400' },
        { name: 'Knight', icon: Zap, color: 'text-emerald-500' },
        { name: 'Pawn', icon: Hexagon, color: 'text-rose-400' },
    ];

    return (
        <div className="h-full w-full p-4 md:p-6 overflow-y-auto custom-scrollbar pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <Panel className="mb-8 p-6 flex items-center justify-between border-b-4 border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg border-2 border-amber-300 transform -rotate-3">
                        <BookOpen size={32} className="text-white drop-shadow-md" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-wider font-display text-stroke shadow-black drop-shadow-md">
                            Collection
                        </h1>
                        <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">
                            Manage your chess concepts / Level {profile.level}
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800">
                    <span className="text-amber-500 font-black text-lg">{profile.currencies.gold}</span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gold</span>
                </div>
            </Panel>

            {/* Avatars Section */}
            <div className="mb-8 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <h2 className="text-xs font-black text-zinc-400 mb-4 flex items-center gap-2 uppercase tracking-widest font-display">
                    Avatars
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {avatars.map((avatar, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 group cursor-pointer p-2 rounded-xl hover:bg-zinc-800/50 transition-colors">
                            <div className="w-14 h-14 rounded-xl bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform group-hover:border-amber-500/50">
                                <avatar.icon className={`h-7 w-7 ${avatar.color} filter drop-shadow-md`} />
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase group-hover:text-white transition-colors tracking-wider">{avatar.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-sm font-black text-zinc-300 uppercase tracking-widest font-display text-stroke">
                    Cards ({cards.length})
                </h2>
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-black uppercase tracking-wider shadow-sm">
                    {cards.reduce((acc, card) => acc + card.level, 0)} Total Levels
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cards.map((card) => (
                    <div key={card.id} className="transform hover:-translate-y-2 transition-transform duration-300">
                        <ConceptCard
                            card={card}
                            onClick={setSelectedCard}
                        />
                    </div>
                ))}
            </div>

            {/* Card Detail Modal */}
            <AnimatePresence>
                {selectedCard && !isMining && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                        >
                            <GameCard variant="default" className="w-full max-w-sm p-0 overflow-hidden shadow-2xl border-zinc-700">
                                {/* Close Button */}
                                <button
                                    onClick={() => setSelectedCard(null)}
                                    className="absolute top-4 right-4 text-zinc-400 hover:text-white z-20 bg-black/50 rounded-full p-2 backdrop-blur-md border border-white/10 transition-transform hover:rotate-90"
                                >
                                    <X size={18} />
                                </button>

                                {/* Card Preview Header */}
                                <div className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 to-zinc-950 p-8 flex justify-center border-b border-zinc-800 relative">
                                    <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20"></div>
                                    <div className="transform scale-125 hover:scale-[1.3] transition-transform duration-500 z-10 filter drop-shadow-2xl">
                                        <ConceptCard card={selectedCard} />
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-6 bg-zinc-900">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-2xl font-black text-white mb-1 font-display uppercase italic text-stroke">{selectedCard.title}</h2>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${selectedCard.rarity === 'LEGENDARY' ? 'bg-amber-500/20 text-amber-500' :
                                                        selectedCard.rarity === 'EPIC' ? 'bg-purple-500/20 text-purple-500' :
                                                            selectedCard.rarity === 'RARE' ? 'bg-blue-500/20 text-blue-500' :
                                                                'bg-zinc-700/50 text-zinc-400'
                                                    }`}>
                                                    {selectedCard.rarity}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                    {selectedCard.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed font-medium bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50">
                                        {selectedCard.description}
                                    </p>

                                    {/* Stats / Info */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center">
                                            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block mb-1">Items Found</span>
                                            <div className="text-lg font-black text-white">{selectedCard.cardsOwned} <span className="text-zinc-600 text-sm">/ {selectedCard.cardsRequired}</span></div>
                                        </div>
                                        <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-center">
                                            <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block mb-1">Upgrade Cost</span>
                                            <div className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                                                {selectedCard.level * 100} <span className="text-[10px] text-zinc-500 uppercase">Gold</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        {selectedCard.cardsOwned >= selectedCard.cardsRequired ? (
                                            <ShinyButton
                                                variant="success"
                                                className="flex-1 w-full"
                                                onClick={handleUpgrade}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <ArrowUpCircle size={18} />
                                                    <span>Level Up!</span>
                                                </div>
                                            </ShinyButton>
                                        ) : (
                                            <ShinyButton
                                                variant="primary"
                                                className="flex-1 w-full"
                                                onClick={() => setIsMining(true)}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <Pickaxe size={18} />
                                                    <span>Mine Cards</span>
                                                </div>
                                            </ShinyButton>
                                        )}
                                    </div>
                                </div>
                            </GameCard>
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
