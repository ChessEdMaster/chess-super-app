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

export function TerrainTileV2({
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
            className="relative border border-white/5 transition-all duration-200 cursor-pointer hover:border-white/30 hover:translate-z-2 shadow-sm overflow-hidden aspect-square"
            style={{
                transformStyle: 'preserve-3d',
                backgroundImage: `url(${terrainAssets.base})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                imageRendering: 'pixelated'
            }}
        >
            {/* Highlight layer amb background-image */}
            {isHovered && (
                <div
                    className="absolute inset-0 animate-pulse pointer-events-none"
                    style={{
                        backgroundImage: `url(${terrainAssets.highlight})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.7,
                        imageRendering: 'pixelated'
                    }}
                />
            )}

            {/* Building/Content Layer */}
            {children}
        </div>
    );
}
