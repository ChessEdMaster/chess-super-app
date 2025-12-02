
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
}

export interface Chest {
    id: string;
    type: 'WOODEN' | 'SILVER' | 'GOLDEN' | 'MAGIC';
    unlockTime: number; // Seconds
    status: 'LOCKED' | 'UNLOCKING' | 'READY';
}
