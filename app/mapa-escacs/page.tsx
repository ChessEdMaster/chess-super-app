
import { createClient } from '@supabase/supabase-js';
import MapaEscacsContainer from '@/components/mapa/MapaEscacsContainer';
import { ChessLocation } from '@/types/chess-map';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function MapaEscacsPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
        .from('chess_locations')
        .select('*');

    if (error) {
        console.error('Error fetching chess locations:', error);
        return (
            <div className="p-8 text-red-500">
                Error carregant dades del mapa: {error.message}
            </div>
        );
    }

    // Cast specific fields if needed
    const locations: ChessLocation[] = (data || []).map((item: any) => ({
        ...item,
        entity_type: item.entity_type as any // Cast string to enum union
    }));

    return (
        <div className="h-full">
            <MapaEscacsContainer initialLocations={locations} />
        </div>
    );
}
