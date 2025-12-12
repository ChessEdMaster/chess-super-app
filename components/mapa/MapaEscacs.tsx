'use client';

import dynamic from 'next/dynamic';
import { ChessLocation } from '@/types/chess-map';

// Dynamically import the map component with SSR disabled
const MapaEscacsClient = dynamic(
    () => import('./MapaEscacsClient'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white animate-pulse">
                Carregant Mapa...
            </div>
        )
    }
);

interface MapaEscacsProps {
    locations: ChessLocation[];
    filteredLocations: ChessLocation[];
    currentLayer: MapLayerType;
    onRegionSelect?: (region: string, type: 'comarca' | 'provincia' | 'municipi') => void;
}

export function MapaEscacs(props: MapaEscacsProps) {
    return <MapaEscacsClient {...props} />;
}
