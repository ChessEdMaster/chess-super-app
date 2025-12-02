import React from 'react';
import { ConceptCard as IConceptCard } from '@/types/rpg';
import { Swords, Shield, BookOpen, Zap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConceptCardProps {
    card: IConceptCard;
    onClick?: (card: IConceptCard) => void;
}

const RARITY_COLORS = {
    COMMON: 'border-slate-400 bg-slate-900/50',
    RARE: 'border-amber-600 bg-amber-950/30',
    EPIC: 'border-purple-500 bg-purple-950/30',
    LEGENDARY: 'border-yellow-400 bg-yellow-950/30 shadow-[0_0_15px_rgba(250,204,21,0.3)]',
};

const CATEGORY_ICONS = {
    AGGRESSION: Swords,
    SOLIDITY: Shield,
    KNOWLEDGE: BookOpen,
    SPEED: Zap,
};

export function ConceptCard({ card, onClick }: ConceptCardProps) {
    const Icon = CATEGORY_ICONS[card.category];
    const isUpgradable = card.cardsOwned >= card.cardsRequired;
    const progress = Math.min(100, (card.cardsOwned / card.cardsRequired) * 100);

    return (
        <div
            onClick={() => onClick?.(card)}
            className={cn(
                "relative aspect-[3/4] rounded-xl border-2 p-3 flex flex-col items-center gap-2 cursor-pointer transition-transform active:scale-95 hover:-translate-y-1",
                RARITY_COLORS[card.rarity]
            )}
        >
            {/* Level Badge */}
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm border border-blue-400">
                Lv.{card.level}
            </div>

            {/* Rarity Label */}
            <div className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-wider opacity-70">
                {card.rarity}
            </div>

            {/* Icon / Image Placeholder */}
            <div className="flex-1 w-full flex items-center justify-center mt-4">
                <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center border-2 border-white/10",
                    card.rarity === 'LEGENDARY' ? "bg-yellow-500/20" : "bg-white/5"
                )}>
                    <Icon size={32} className="text-white/80" />
                </div>
            </div>

            {/* Title */}
            <div className="text-center">
                <h3 className="text-sm font-bold leading-tight text-white">{card.title}</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-bold mt-0.5">{card.category}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full mt-auto">
                <div className="flex justify-between text-[10px] font-bold mb-1 px-1">
                    <span className={isUpgradable ? "text-green-400" : "text-zinc-500"}>
                        {card.cardsOwned}/{card.cardsRequired}
                    </span>
                    {isUpgradable && <span className="text-green-400 animate-pulse">UPGRADE!</span>}
                </div>
                <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div
                        className={cn(
                            "h-full transition-all duration-500",
                            isUpgradable ? "bg-green-500" : "bg-blue-500"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
