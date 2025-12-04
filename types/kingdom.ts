export type ResourceType = 'gold' | 'mana' | 'gems';

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

export interface KingdomProfile {
    user_id: string;
    active_terrain_skin: 'grass' | 'snow' | 'lava';
    unlocked_skins: string[];
    defense_scenario_id?: string;
}

export interface KingdomState {
    resources: Record<ResourceType, number>;
    buildings: UserBuilding[];
    buildingDefs: Record<string, BuildingSchema>;
    profile: KingdomProfile;
}
