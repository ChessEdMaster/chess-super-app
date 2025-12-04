"use client";

import React from 'react';
import { ResourceType } from '@/types/kingdom';
import { KINGDOM_ASSETS } from '@/lib/kingdom-assets';
import { cn } from '@/lib/utils';

interface KingdomHUDProps {
    resources: Record<ResourceType, number>;
    className?: string;
}

export function KingdomHUD({ resources, className }: KingdomHUDProps) {
    return (
        <div className={cn("flex items-center gap-4 p-4 bg-black/40 backdrop-blur-md rounded-xl border border-white/10", className)}>
            <ResourceDisplay
                type="gold"
                amount={resources.gold}
                icon={KINGDOM_ASSETS.ui.gold}
            />
            <div className="w-px h-8 bg-white/10" />
            <ResourceDisplay
                type="mana"
                amount={resources.mana}
                icon={KINGDOM_ASSETS.ui.mana}
            />
            {/* Gems are premium, maybe different style */}
            <div className="w-px h-8 bg-white/10" />
            <ResourceDisplay
                type="gems"
                amount={resources.gems || 0}
                icon="/assets/icons/gem.png" // Placeholder
            />
        </div>
    );
}

function ResourceDisplay({ type, amount, icon }: { type: string, amount: number, icon: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
                {/* In a real app, use Next.js Image */}
                <img src={icon} alt={type} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-white/50 uppercase font-bold tracking-wider">{type}</span>
                <span className="text-lg font-mono font-bold text-white leading-none">
                    {new Intl.NumberFormat('en-US', { notation: "compact" }).format(amount)}
                </span>
            </div>
        </div>
    );
}
