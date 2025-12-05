'use client';

import React, { useState } from 'react';
import { KINGDOM_ASSETS } from '@/lib/kingdom-assets';

export type TerrainType = 'grass' | 'snow' | 'lava';

interface TerrainTileProps {
    x: number;
    y: number;
    terrain?: TerrainType;
    hasBuilding?: boolean;
    onClick: () => void;
    children?: React.ReactNode;
}

export function TerrainTile({
    x,
    y,
    terrain = 'grass',
    hasBuilding = false,
    onClick,
    children
}: TerrainTileProps) {
    const [isHovered, setIsHovered] = useState(false);

    const terrainAssets = KINGDOM_ASSETS.terrain[terrain];

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative border border-white/5 transition-all duration-200 cursor-pointer hover:border-white/30 hover:translate-z-2 shadow-sm overflow-hidden"
            style={{
                transformStyle: 'preserve-3d'
            }}
        >
            {/* Base Terrain Texture */}
            <img
                src={terrainAssets.base}
                alt={`${terrain} tile`}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{
                    imageRendering: 'pixelated' // Per mantenir estil pixelat si és pixel art
                }}
            />

            {/* Highlight ao fer hover */}
            {isHovered && (
                <img
                    src={terrainAssets.highlight}
                    alt="highlight"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none animate-pulse"
                    style={{
                        imageRendering: 'pixelated',
                        opacity: 0.7
                    }}
                />
            )}

            {/* Building/Content Layer */}
            {children}
        </div>
    );
}
