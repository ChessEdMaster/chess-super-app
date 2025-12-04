export interface KingdomResources {
    user_id: string;
    gold: number;
    mana: number;
    last_updated: string;
}

export interface KingdomBuilding {
    id: string;
    user_id: string;
    type: string;
    level: number;
    x: number;
    y: number;
    status: 'active' | 'constructing' | 'upgrading';
    constructed_at: string;
}

export interface BuildingConfig {
    type: string;
    name: string;
    description: string;
    cost: {
        gold: number;
        mana: number;
    };
    constructionTime: number; // in seconds
    width: number; // in tiles
    height: number; // in tiles
    spriteUrl?: string;
    color?: string; // Fallback color
}

export const BUILDING_TYPES: Record<string, BuildingConfig> = {
    academy: {
        type: 'academy',
        name: 'Academy',
        description: 'Train your units and learn new strategies.',
        cost: { gold: 100, mana: 0 },
        constructionTime: 60,
        width: 1,
        height: 1,
        color: '#3b82f6' // Blue
    },
    tower: {
        type: 'tower',
        name: 'Watch Tower',
        description: 'Defend your kingdom from attacks.',
        cost: { gold: 150, mana: 50 },
        constructionTime: 120,
        width: 1,
        height: 1,
        color: '#ef4444' // Red
    },
    mine: {
        type: 'mine',
        name: 'Gold Mine',
        description: 'Generates gold over time.',
        cost: { gold: 50, mana: 0 },
        constructionTime: 30,
        width: 1,
        height: 1,
        color: '#eab308' // Yellow
    }
};
