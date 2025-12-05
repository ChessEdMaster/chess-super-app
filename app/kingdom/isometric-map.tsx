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
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1">
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
                                {/* Building */}
                                {building && buildingConfig && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                        style={{
                                            // Counter-rotate to make it look like it's standing up or floating
                                            transform: 'translateZ(20px) rotateZ(-45deg) rotateX(-60deg) scale(1.5)',
                                            transformOrigin: 'center center',
                                        }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-md shadow-2xl flex items-center justify-center text-xs font-bold text-white border-2 border-white/20"
                                            style={{
                                                backgroundColor: buildingConfig.color,
                                                boxShadow: `0 10px 20px -5px ${buildingConfig.color}80`
                                            }}
                                        >
                                            {buildingConfig.name.substring(0, 1)}
                                        </div>

                                        {/* Status Indicator */}
                                        {building.status !== 'active' && (
                                            <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
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
