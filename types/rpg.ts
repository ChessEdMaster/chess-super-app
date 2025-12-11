
export type ChessAttribute = 'AGGRESSION' | 'SOLIDITY' | 'KNOWLEDGE' | 'SPEED';

export interface PlayerProfile {
    id: string;
    username: string;
    avatarId: string; // ID of the 3D model
    level: number;
    xp: number;
    currencies: {
        gold: number;   // Soft currency (upgrades)
        gems: number;   // Hard currency (cosmetics/speedups)
    };
    attributes: Record<ChessAttribute, number>; // e.g., { AGGRESSION: 15 }
    role?: 'SuperAdmin' | 'ClubMember' | 'Guest' | 'NewUser';
    settings?: {
        language: 'ca' | 'es' | 'en';
        notifications: boolean;
    };
}

export interface ConceptCard {
    id: string;
    title: string;       // e.g., "Knight Fork"
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    category: ChessAttribute; // Upgrading this boosts the specific attribute
    level: number;
    cardsOwned: number;  // Current copies (e.g., 5/10 to upgrade)
    cardsRequired: number;
    description: string;
    minigameId: string;  // The puzzle set ID to "mine" this card
    tags?: string[];
}

export interface Chest {
    id: string;
    type: 'WOODEN' | 'SILVER' | 'GOLDEN' | 'MAGIC' | 'LEGENDARY';
    unlockTime: number; // Seconds
    status: 'LOCKED' | 'UNLOCKING' | 'READY';
    unlockStartedAt?: number; // Timestamp in ms
}
