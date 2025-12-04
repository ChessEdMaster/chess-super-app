'use client';

import React, { useState } from 'react';
import { useKingdom } from '@/hooks/useKingdom';
import { IsometricMap } from './isometric-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BUILDING_TYPES } from '@/types/kingdom';
import { Coins, Zap, Hammer, ArrowUp } from 'lucide-react';

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
        return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Loading Kingdom...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            {/* Header / Resources */}
            <header className="p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                        Chess Kingdom
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-amber-500/30">
                            <Coins className="w-4 h-4 text-amber-400" />
                            <span className="font-mono font-bold text-amber-100">{resources?.gold || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-blue-500/30">
                            <Zap className="w-4 h-4 text-blue-400" />
                            <span className="font-mono font-bold text-blue-100">{resources?.mana || 0}</span>
                        </div>

                        <Button size="sm" variant="outline" onClick={collectResources} className="ml-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-950">
                            <ArrowUp className="w-4 h-4 mr-1" />
                            Collect
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black -z-10" />

                <div className="w-full max-w-4xl aspect-square max-h-[80vh] flex items-center justify-center">
                    <IsometricMap
                        buildings={buildings}
                        onTileClick={handleTileClick}
                    />
                </div>

                {/* Instructions or Context */}
                <div className="absolute bottom-8 text-center text-slate-500 text-sm pointer-events-none">
                    Click on a tile to build or inspect
                </div>
            </main>

            {/* Build Dialog */}
            <Dialog open={isBuildOpen} onOpenChange={setIsBuildOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Construct Building</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {Object.values(BUILDING_TYPES).map((building) => (
                            <Card
                                key={building.type}
                                className="p-4 bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer group"
                                onClick={() => handleConstruct(building.type)}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
                                        style={{ backgroundColor: building.color }}
                                    >
                                        <Hammer className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-bold text-slate-100">{building.name}</h3>
                                            <div className="flex gap-2 text-xs">
                                                <span className="text-amber-400 flex items-center gap-1">
                                                    <Coins className="w-3 h-3" /> {building.cost.gold}
                                                </span>
                                                {building.cost.mana > 0 && (
                                                    <span className="text-blue-400 flex items-center gap-1">
                                                        <Zap className="w-3 h-3" /> {building.cost.mana}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400">{building.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
