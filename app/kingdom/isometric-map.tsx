'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { KingdomBuilding, BUILDING_TYPES, TerrainType } from '@/types/kingdom';
import { TerrainTile } from '@/components/kingdom/terrain-tile';

interface IsometricMapProps {
    buildings: KingdomBuilding[];
    onTileClick: (x: number, y: number) => void;
}

export function IsometricMap({ buildings, onTileClick }: IsometricMapProps) {
    const gridSize = 8;
    // Create an array of tiles with terrain types
    const tiles = Array.from({ length: gridSize * gridSize }, (_, i) => ({
        x: i % gridSize,
        y: Math.floor(i / gridSize),
        terrain: 'grass' as TerrainType // Default terrain, pot ser dinàmic en el futur
    }));

    const getBuildingAt = (x: number, y: number) => {
        return buildings.find(b => b.x === x && b.y === y);
    };

    return (
        <div className="w-full h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 perspective-[1000px]">
            <div
                className="relative transition-transform duration-500 ease-out"
                style={{
                    transform: 'rotateX(60deg) rotateZ(45deg)',
                    transformStyle: 'preserve-3d',
                    width: '400px',
                    height: '400px'
                }}
            >
                {/* Grid Container */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-1 bg-black/5 rounded-xl border border-white/5 backdrop-blur-sm">
                    {tiles.map((tile) => {
                        const building = getBuildingAt(tile.x, tile.y);
                        const buildingConfig = building ? BUILDING_TYPES[building.type] : null;

                        return (
                            <TerrainTile
                                key={`${tile.x}-${tile.y}`}
                                x={tile.x}
                                y={tile.y}
                                terrain={tile.terrain}
                                hasBuilding={!!building}
                                onClick={() => onTileClick(tile.x, tile.y)}
                            >
                                {/* Tile Highlight Layer */}
                                <div className="absolute inset-0 bg-white/5 hover:bg-white/10 transition-colors pointer-events-none" />

                                {/* Building */}
                                {building && buildingConfig && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        style={{
                                            // Counter-rotate to make it look like it's standing up or floating
                                            transform: 'translateZ(30px) rotateZ(-45deg) rotateX(-60deg) scale(1.4)',
                                            transformOrigin: 'center center',
                                        }}
                                    >
                                        <div
                                            className="w-12 h-12 rounded-xl backdrop-blur-md flex flex-col items-center justify-center text-xs font-black text-white border-2 border-white/30 transition-all shadow-2xl group"
                                            style={{
                                                backgroundColor: `${buildingConfig.color}40`, // Low opacity base color
                                                boxShadow: `0 0 20px -5px ${buildingConfig.color}CC, inset 0 0 10px rgba(255,255,255,0.1)`,
                                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                            }}
                                        >
                                            <div
                                                className="absolute inset-0 rounded-xl animate-pulse -z-10"
                                                style={{ boxShadow: `0 0 15px ${buildingConfig.color}40` }}
                                            />
                                            <span className="text-lg leading-none">{buildingConfig.name.substring(0, 1)}</span>
                                        </div>

                                        {/* Status Indicator */}
                                        {building.status !== 'active' && (
                                            <div className="absolute -top-1 -right-1 flex items-center justify-center">
                                                <div className="absolute w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-40" />
                                                <div className="relative w-2.5 h-2.5 bg-yellow-400 rounded-full border border-black/20" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TerrainTile>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
