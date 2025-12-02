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
    cards: [], // We can populate this later
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
