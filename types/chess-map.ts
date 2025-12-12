
export type EntityType =
    | 'Club'
    | 'Tournament'
    | 'School'
    | 'Business'
    | 'Conference'
    | 'Official_Act';

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
    start_date?: string; // ISO string for timestamps
    end_date?: string;
    url?: string;
    metadata?: Record<string, any>;
}

export interface MapFilters {
    provincia?: string;
    comarca?: string;
    municipi?: string;
    types: EntityType[];
    dateRange?: { from: Date; to: Date };
    onlyUpcoming?: boolean;
}
