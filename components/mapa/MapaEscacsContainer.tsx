'use client';

import { useState, useMemo } from 'react';
import { ChessLocation, MapFilters, MapLayerType } from '@/types/chess-map';
import { FiltresMapa } from './FiltresMapa';
import { MapaEscacs } from './MapaEscacs';
import { TaulaLlocs } from './TaulaLlocs';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Map } from 'lucide-react';

interface MapaEscacsContainerProps {
    initialLocations: ChessLocation[];
}

export default function MapaEscacsContainer({ initialLocations }: MapaEscacsContainerProps) {
    const [locations] = useState<ChessLocation[]>(initialLocations); // Raw data
    const [currentLayer, setCurrentLayer] = useState<MapLayerType>('comarques');
    const [filters, setFilters] = useState<MapFilters>({
        types: ['Club', 'Tournament', 'School', 'Business', 'Conference', 'Official_Act'],
        onlyUpcoming: false
    });

    const filteredLocations = useMemo(() => {
        const now = new Date();
        return locations.filter(loc => {
            // 1. Geography
            if (filters.provincia && filters.provincia !== 'all' && loc.provincia_nom !== filters.provincia) return false;
            if (filters.comarca && filters.comarca !== 'all' && loc.comarca_nom !== filters.comarca) return false;
            if (filters.municipi && filters.municipi !== 'all' && loc.municipi_nom !== filters.municipi) return false;

            // 2. Type
            if (filters.types.length > 0 && !filters.types.includes(loc.entity_type)) return false;

            // 3. Time (Only for Upcoming)
            if (filters.onlyUpcoming) {
                if (!loc.start_date) return false;
                if (new Date(loc.start_date) < now) return false;
            }

            return true;
        });
    }, [locations, filters]);

    const handleRegionSelect = (region: string, type: 'comarca' | 'provincia' | 'municipi') => {
        setFilters(prev => ({
            ...prev,
            [type]: region,
            // Smart reset logic
            ...(type === 'provincia' ? { comarca: 'all', municipi: 'all' } :
                type === 'comarca' ? { municipi: 'all' } :
                    {})
        }));
    };

    return (
        <div className="flex flex-col h-full gap-6 p-4 max-w-[1920px] mx-auto">
            {/* Header */}
            <Panel className="flex items-center gap-4 py-4 px-6 bg-zinc-900/90 border-zinc-700">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Map className="text-amber-500" size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600 uppercase tracking-tight font-display drop-shadow-sm text-stroke">
                        Mapa d'Escacs
                    </h1>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                        Explore clubs, tournaments, and events across the territory.
                    </p>
                </div>
            </Panel>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left: Filters & Table */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                    {/* 1. Panell de Filtres */}
                    <GameCard variant="default" className="p-4 bg-zinc-900/80 border-zinc-700">
                        <FiltresMapa
                            locations={locations}
                            currentLayer={currentLayer}
                            onLayerChange={setCurrentLayer}
                            onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
                        />
                    </GameCard>

                    {/* 3. Secció de Taula de Dades (Mobile/Desktop List) */}
                    <GameCard variant="default" className="flex-1 min-h-[400px] bg-zinc-900/80 border-zinc-700 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-zinc-950/30">
                            <h2 className="text-sm font-black text-zinc-300 uppercase tracking-wider">Llistat ({filteredLocations.length})</h2>
                        </div>
                        <div className="flex-1 overflow-auto p-0">
                            <TaulaLlocs locations={filteredLocations} />
                        </div>
                    </GameCard>
                </div>

                {/* Right: Map */}
                <div className="w-full lg:w-2/3 flex flex-col">
                    {/* 2. Secció del Mapa */}
                    <GameCard variant="blue" className="flex-1 w-full min-h-[600px] lg:min-h-0 rounded-2xl shadow-2xl overflow-hidden relative z-0 border-4 border-zinc-800 p-0">
                        <MapaEscacs
                            locations={locations}
                            filteredLocations={filteredLocations}
                            currentLayer={currentLayer}
                            onRegionSelect={handleRegionSelect}
                        />
                    </GameCard>
                </div>
            </div>
        </div>
    );
}
