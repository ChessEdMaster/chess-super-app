'use client';

import { useState, useMemo } from 'react';
import { ChessLocation, MapFilters } from '@/types/chess-map';
import { FiltresMapa } from './FiltresMapa';
import { MapaEscacs } from './MapaEscacs';
import { TaulaLlocs } from './TaulaLlocs';

interface MapaEscacsContainerProps {
    initialLocations: ChessLocation[];
}

export default function MapaEscacsContainer({ initialLocations }: MapaEscacsContainerProps) {
    const [locations] = useState<ChessLocation[]>(initialLocations); // Raw data
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
                // If it doesn't have a date, maybe exclude? Or include?
                // Usually "Upcoming" implies it has a start_date in the future.
                if (!loc.start_date) return false;
                if (new Date(loc.start_date) < now) return false;
            }

            return true;
        });
    }, [locations, filters]);

    const handleRegionSelect = (region: string, type: 'comarca' | 'provincia') => {
        setFilters(prev => ({
            ...prev,
            [type]: region,
            // If selecting province, reset comarca/municipi?
            // Actually the current filter logic might need adjustment if we want smart reset.
            // For now, let's just set the specific one.
            ...(type === 'provincia' ? { comarca: 'all', municipi: 'all' } : { municipi: 'all' })
        }));
    };

    return (
        <div className="flex flex-col h-full space-y-4 p-4">
            {/* 1. Panell de Filtres */}
            <FiltresMapa
                locations={locations}
                onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
            />

            {/* 2. Secció del Mapa */}
            <div className="flex-1 w-full h-[50vh] lg:h-[70vh] rounded-xl shadow-2xl overflow-hidden relative z-0">
                <MapaEscacs
                    locations={locations}
                    filteredLocations={filteredLocations}
                    onRegionSelect={handleRegionSelect}
                />
            </div>

            {/* 3. Secció de Taula de Dades */}
            <div className="w-full">
                <h2 className="text-2xl font-bold mb-3 text-secondary-500">Llistat d'Entitats i Esdeveniments</h2>
                <TaulaLlocs locations={filteredLocations} />
            </div>
        </div>
    );
}
