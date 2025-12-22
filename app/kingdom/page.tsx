'use client';

import React, { useState } from 'react';
import { useKingdom } from '@/hooks/useKingdom';
import { IsometricMap } from './isometric-map';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BUILDING_TYPES } from '@/types/kingdom';
import { Coins, Zap, Hammer, ArrowUp, X } from 'lucide-react';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Panel } from '@/components/ui/design-system/Panel';

export default function KingdomPage() {
    const { resources, buildings, loading, constructBuilding, collectResources } = useKingdom();
    const [selectedTile, setSelectedTile] = useState<{ x: number, y: number } | null>(null);
    const [isBuildOpen, setIsBuildOpen] = useState(false);

    const handleTileClick = (x: number, y: number) => {
        setSelectedTile({ x, y });
        // If empty, open build menu
        const hasBuilding = buildings.some(b => b.x === x && b.y === y);
        if (!hasBuilding) {
            setIsBuildOpen(true);
        }
    };

    const handleConstruct = async (type: string) => {
        if (selectedTile) {
            await constructBuilding(type, selectedTile.x, selectedTile.y);
            setIsBuildOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[var(--background)] text-[var(--foreground)] gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-amber-500"></div>
                <p className="text-amber-500 font-bold uppercase tracking-widest text-xs animate-pulse">Entering Kingdom...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-[var(--foreground)] flex flex-col bg-[var(--background)] overflow-hidden">
            {/* Header / Resources */}
            <div className="p-4 bg-[var(--header-bg)] backdrop-blur-md sticky top-0 z-20 border-b border-[var(--border)] shadow-lg">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <h1 className="text-2xl font-black tracking-widest uppercase font-display text-stroke drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold)] to-yellow-600">
                        My Kingdom
                    </h1>

                    <div className="flex items-center gap-4">
                        <GameCard variant="default" className="flex items-center gap-2 p-2 px-4 shadow-lg border-amber-500/20 bg-[var(--panel-bg)]">
                            <Coins className="w-5 h-5 text-amber-500 drop-shadow-sm" />
                            <span className="font-mono font-black text-amber-100 text-lg">{resources?.gold || 0}</span>
                        </GameCard>

                        <GameCard variant="default" className="flex items-center gap-2 p-2 px-4 shadow-lg border-blue-500/20 bg-[var(--panel-bg)]">
                            <Zap className="w-5 h-5 text-blue-400 drop-shadow-sm" />
                            <span className="font-mono font-black text-blue-100 text-lg">{resources?.mana || 0}</span>
                        </GameCard>

                        <ShinyButton
                            variant="success"
                            onClick={collectResources}
                            className="ml-2"
                        >
                            <ArrowUp className="w-4 h-4 mr-1" />
                            Collect
                        </ShinyButton>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-[var(--background)] to-black -z-10" />

                <div className="w-full max-w-5xl aspect-square max-h-[75vh] flex items-center justify-center transform scale-100 hover:scale-[1.01] transition-transform duration-500">
                    <IsometricMap
                        buildings={buildings}
                        onTileClick={handleTileClick}
                    />
                </div>

                {/* Instructions or Context */}
                <div className="absolute bottom-8 text-center bg-[var(--panel-bg)] backdrop-blur px-6 py-2 rounded-full border border-[var(--border)] shadow-xl pointer-events-none animate-in slide-in-from-bottom-5">
                    <p className="text-[var(--color-secondary)] text-xs font-bold uppercase tracking-widest">
                        Click on a tile to build or inspect
                    </p>
                </div>
            </main>

            {/* Build Dialog */}
            <Dialog open={isBuildOpen} onOpenChange={setIsBuildOpen}>
                <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none">
                    <GameCard variant="default" className="p-0 overflow-hidden w-full bg-[var(--card-bg)]">
                        <div className="p-6 bg-[var(--header-bg)] border-b border-[var(--border)] flex justify-between items-center">
                            <h2 className="text-xl font-black text-[var(--foreground)] uppercase tracking-wide flex items-center gap-2">
                                <Hammer className="text-amber-500" /> Construct
                            </h2>
                            <button onClick={() => setIsBuildOpen(false)} className="text-[var(--color-secondary)] hover:text-[var(--foreground)] transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 grid gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar bg-[var(--panel-bg)]">
                            {Object.values(BUILDING_TYPES).map((building) => (
                                <div
                                    key={building.type}
                                    className="p-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl hover:border-amber-500/50 hover:bg-[var(--color-muted)] transition-all cursor-pointer group shadow-sm hover:shadow-md active:scale-[0.98]"
                                    onClick={() => handleConstruct(building.type)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div
                                            className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-b-4 border-black/20"
                                            style={{ backgroundColor: building.color }}
                                        >
                                            <Hammer className="w-6 h-6 text-white drop-shadow-md" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-black text-[var(--foreground)] uppercase text-sm tracking-wide group-hover:text-amber-500 transition-colors">{building.name}</h3>
                                                <div className="flex gap-3 text-xs font-bold">
                                                    <span className="text-amber-400 flex items-center gap-1 drop-shadow-sm">
                                                        <Coins className="w-3 h-3" /> {building.cost.gold}
                                                    </span>
                                                    {building.cost.mana > 0 && (
                                                        <span className="text-blue-400 flex items-center gap-1 drop-shadow-sm">
                                                            <Zap className="w-3 h-3" /> {building.cost.mana}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-[var(--color-secondary)] font-medium leading-relaxed">{building.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GameCard>
                </DialogContent>
            </Dialog>
        </div>
    );
}
