
export type EntityType =
    | 'Club'
    | 'Tournament'
    | 'School'
    | 'Business'
    | 'Conference'
    | 'Official_Act';

export type MapLayerType = 'provincies' | 'comarques' | 'municipis';

export interface ChessLocation {
    id: string;
    name: string;
    entity_type: EntityType;
    status?: string;
    latitude: number;
    longitude: number;
    address?: string;
    municipi_nom?: string;
    comarca_nom?: string;
    provincia_nom?: string;
    country_code?: string;
    start_date?: string;
    end_date?: string;
    url?: string;
    metadata?: Record<string, any>;

    // Extended fields for Tournaments
    time_control?: string;
    registered_players?: number;
    rules_url?: string;
}

export interface MapFilters {
    provincia?: string;
    comarca?: string;
    municipi?: string;
    types: EntityType[];
    dateRange?: { from: Date; to: Date };
    onlyUpcoming?: boolean;
}
