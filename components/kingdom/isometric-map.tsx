"use client";

import React, { useState } from 'react';
import { UserBuilding } from '@/types/kingdom';
import { KINGDOM_ASSETS } from '@/lib/kingdom-assets';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface IsometricMapProps {
    buildings: UserBuilding[];
    onTileClick?: (x: number, y: number) => void;
    gridSize?: number;
    terrainSkin?: 'grass' | 'snow' | 'lava';
}

export function IsometricMap({
    buildings,
    onTileClick,
    gridSize = 8,
    terrainSkin = 'grass'
}: IsometricMapProps) {
    const [hoveredTile, setHoveredTile] = useState<{ x: number, y: number } | null>(null);

    // Generate grid
    const tiles = [];
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            tiles.push({ x, y });
        }
    }

    // Helper to find building at coordinates
    const getBuildingAt = (x: number, y: number) => {
        return buildings.find(b => b.x === x && b.y === y);
    };

    return (
        <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-sky-900/20 flex items-center justify-center perspective-1000">
            {/* World Container - Applies the Isometric Projection */}
            <div
                className="relative transform-style-3d transition-transform duration-500 ease-out"
                style={{
                    transform: 'rotateX(60deg) rotateZ(45deg)',
                    width: `${gridSize * 64}px`, // Adjust scale as needed
                    height: `${gridSize * 64}px`,
                }}
            >
                {tiles.map((tile) => {
                    const building = getBuildingAt(tile.x, tile.y);
                    const isHovered = hoveredTile?.x === tile.x && hoveredTile?.y === tile.y;
                    const zIndex = tile.x + tile.y; // Simple depth sorting

                    return (
                        <div
                            key={`${tile.x}-${tile.y}`}
                            className="absolute w-16 h-16 border-[0.5px] border-white/10 transition-colors duration-200"
                            style={{
                                left: `${tile.x * 64}px`,
                                top: `${tile.y * 64}px`,
                                zIndex: zIndex,
                                backgroundImage: `url(${KINGDOM_ASSETS.terrain[terrainSkin].base})`,
                                backgroundSize: 'cover',
                            }}
                            onMouseEnter={() => setHoveredTile(tile)}
                            onMouseLeave={() => setHoveredTile(null)}
                            onClick={() => onTileClick?.(tile.x, tile.y)}
                        >
                            {/* Hover Effect Overlay */}
                            {isHovered && (
                                <div className="absolute inset-0 bg-white/20 pointer-events-none" />
                            )}

                            {/* Building Sprite */}
                            {building && (
                                <div
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
                                    style={{
                                        // Counter-rotation to make the sprite stand up
                                        transform: 'rotateZ(-45deg) rotateX(-60deg) translateY(-50%)',
                                        transformOrigin: 'bottom center',
                                        width: '128px', // Assuming sprites are larger than tiles
                                        height: '128px',
                                    }}
                                >
                                    {/* Placeholder for building image - in real app use building.asset_path */}
                                    <img
                                        src={KINGDOM_ASSETS.buildings.economy.gold_mine_lv1} // Fallback/Test
                                        alt="Building"
                                        className="w-full h-full object-contain drop-shadow-xl"
                                    />

                                    {/* Floating Level Indicator */}
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-2 rounded-full backdrop-blur-sm">
                                        Lv.{building.level}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
