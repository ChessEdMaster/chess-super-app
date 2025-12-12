
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChessLocation } from '@/types/chess-map';
import MapaEscacsContainer from '@/components/mapa/MapaEscacsContainer';
import { Loader2 } from 'lucide-react';

export function MapaEscacsWrapper() {
    const [locations, setLocations] = useState<ChessLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLocations() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('chess_locations')
                    .select('*');

                if (error) throw error;

                // Cast enums
                const typedLocs: ChessLocation[] = (data || []).map((item: any) => ({
                    ...item,
                    entity_type: item.entity_type as any
                }));

                setLocations(typedLocs);
            } catch (err) {
                console.error('Error fetching chess map locations:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchLocations();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                    <p className="text-zinc-500 text-sm">Carregant Mapa d'Escacs...</p>
                </div>
            </div>
        );
    }

    return <MapaEscacsContainer initialLocations={locations} />;
}
