import { create } from 'zustand';
import { PlayerProfile, ConceptCard, Chest } from '@/types/rpg';

interface PlayerState {
    profile: PlayerProfile;
    cards: ConceptCard[];
    chests: (Chest | null)[];

    // Actions
    addGold: (amount: number) => void;
    addGems: (amount: number) => void;
    addXp: (amount: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
    profile: {
        id: 'mock-player-1',
        username: 'GrandmasterFlash',
        avatarId: 'king-piece',
        level: 3,
        xp: 450,
        currencies: {
            gold: 1000,
            gems: 50,
        },
        attributes: {
            AGGRESSION: 12,
            SOLIDITY: 8,
            KNOWLEDGE: 15,
            SPEED: 10,
        },
    },
    cards: [
        {
            id: 'card-1',
            title: 'Knight Fork',
            rarity: 'COMMON',
            category: 'AGGRESSION',
            level: 1,
            cardsOwned: 5,
            cardsRequired: 10,
            description: 'Attacks two pieces simultaneously with a Knight.',
            minigameId: 'puzzle-fork'
        },
        {
            id: 'card-2',
            title: 'Back Rank Mate',
            rarity: 'RARE',
            category: 'KNOWLEDGE',
            level: 3,
            cardsOwned: 2,
            cardsRequired: 20,
            description: 'Checkmate on the back rank when the king is trapped by its own pawns.',
            minigameId: 'puzzle-backrank'
        },
        {
            id: 'card-3',
            title: 'Greek Gift',
            rarity: 'EPIC',
            category: 'AGGRESSION',
            level: 1,
            cardsOwned: 1,
            cardsRequired: 5,
            description: 'Sacrifice a bishop on h7/h2 to expose the enemy king.',
            minigameId: 'puzzle-greek'
        },
        {
            id: 'card-4',
            title: 'Solid Pawn Structure',
            rarity: 'COMMON',
            category: 'SOLIDITY',
            level: 5,
            cardsOwned: 45,
            cardsRequired: 50,
            description: 'Maintain a strong pawn chain to deny enemy entry.',
            minigameId: 'puzzle-pawns'
        },
        {
            id: 'card-5',
            title: 'Time Management',
            rarity: 'LEGENDARY',
            category: 'SPEED',
            level: 1,
            cardsOwned: 0,
            cardsRequired: 2,
            description: 'Play faster in critical moments.',
            minigameId: 'puzzle-speed'
        }
    ],
    chests: [
        { id: 'c1', type: 'WOODEN', unlockTime: 3600, status: 'LOCKED' },
        null,
        null,
        null
    ],

    addGold: (amount) => set((state) => ({
        profile: {
            ...state.profile,
            currencies: { ...state.profile.currencies, gold: state.profile.currencies.gold + amount }
        }
    })),
    addGems: (amount) => set((state) => ({
        profile: {
            ...state.profile,
            currencies: { ...state.profile.currencies, gems: state.profile.currencies.gems + amount }
        }
    })),
    addXp: (amount) => set((state) => ({
        profile: {
            ...state.profile,
            xp: state.profile.xp + amount
        }
    })),
}));
