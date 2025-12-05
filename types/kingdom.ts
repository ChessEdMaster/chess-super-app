export type ResourceType = 'gold' | 'mana' | 'gems';
export type TerrainType = 'grass' | 'snow' | 'lava';

export interface KingdomResources {
    gold: number;
    mana: number;
    gems?: number;
}

export interface BuildingSchema {
    id: string;
    name: string;
    type: 'economy' | 'defense' | 'decorative';
    description: string;
    base_cost: Record<ResourceType, number>;
    production_rate: number; // Base resources per hour
    max_level: number;
    dimensions: { w: number; h: number };
    asset_path: string; // Relative to /assets/kingdom/
}

export interface UserBuilding {
    id: string;
    user_id: string;
    building_def_id: string; // Links to BuildingSchema.id
    level: number;
    x: number;
    y: number;
    status: 'active' | 'constructing' | 'upgrading';
    last_collected_at: string; // ISO Timestamp
    created_at: string;
    construction_finish_at?: string;
}

// Interface matching the current implementation in useKingdom.ts
export interface KingdomBuilding {
    id: string;
    user_id: string;
    type: string; // Key of BUILDING_TYPES
    x: number;
    y: number;
    status: 'active' | 'constructing' | 'upgrading';
    created_at: string;
}

export interface KingdomProfile {
    user_id: string;
    active_terrain_skin: 'grass' | 'snow' | 'lava';
    unlocked_skins: string[];
    defense_scenario_id?: string;
}

export interface KingdomState {
    resources: KingdomResources;
    buildings: KingdomBuilding[];
    buildingDefs: Record<string, BuildingSchema>;
    profile: KingdomProfile;
}

export const BUILDING_TYPES: Record<string, {
    type: string;
    name: string;
    description: string;
    color: string;
    cost: { gold: number; mana: number };
    production?: { resource: string; rate: number };
}> = {
    'gold_mine': {
        type: 'gold_mine',
        name: 'Gold Mine',
        description: 'Produces Gold over time.',
        color: '#fbbf24', // amber-400
        cost: { gold: 100, mana: 0 },
        production: { resource: 'gold', rate: 10 }
    },
    'mana_well': {
        type: 'mana_well',
        name: 'Mana Well',
        description: 'Gathers magical Mana.',
        color: '#60a5fa', // blue-400
        cost: { gold: 50, mana: 50 },
        production: { resource: 'mana', rate: 5 }
    },
    'barracks': {
        type: 'barracks',
        name: 'Barracks',
        description: 'Train units for raids.',
        color: '#f87171', // red-400
        cost: { gold: 200, mana: 20 }
    },
    'academy': {
        type: 'academy',
        name: 'Academy',
        description: 'Research new technologies.',
        color: '#a78bfa', // violet-400
        cost: { gold: 300, mana: 100 }
    }
};
