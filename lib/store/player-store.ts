import { create } from 'zustand';
import { PlayerProfile, ConceptCard, Chest } from '@/types/rpg';
import { supabase } from '@/lib/supabase';

interface PlayerState {
    profile: PlayerProfile;
    cards: ConceptCard[];
    chests: (Chest | null)[];
    isLoaded: boolean;

    // Actions
    loadProfile: (userId: string) => Promise<void>;
    saveProfile: () => Promise<void>;
    addGold: (amount: number) => void;
    addGems: (amount: number) => void;
    addXp: (amount: number) => void;
    addCardCopy: (cardId: string, amount?: number) => void;
    upgradeCard: (cardId: string) => void;

    // Chest Actions
    startUnlockChest: (chestIndex: number) => boolean;
    updateChestTimers: () => void;
    openChest: (chestIndex: number) => { gold: number; gems: number; cardId: string; cardAmount: number } | null;
    addChest: (chest: Chest) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    profile: {
        id: '',
        username: 'Jugador',
        avatarId: 'king-piece',
        level: 1,
        xp: 0,
        currencies: { gold: 0, gems: 0 },
        attributes: { AGGRESSION: 0, SOLIDITY: 0, KNOWLEDGE: 0, SPEED: 0 },
        settings: { language: 'ca', notifications: true },
    },
    cards: [], // Initial empty state, populated on loadProfile
    chests: [null, null, null, null],
    isLoaded: false,

    loadProfile: async (userId: string) => {
        try {
            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*, app_roles(name)')
                .eq('id', userId)
                .single();

            if (profileError || !profileData) {
                console.error('Error loading profile:', profileError);
                return;
            }

            // 2. Fetch Concepts to build the base Card List
            const { data: conceptsData, error: conceptsError } = await supabase
                .from('academy_concepts')
                .select('*');

            if (conceptsError) {
                console.error('Error loading concepts:', conceptsError);
                return;
            }

            // 3. Construct Base Cards from Concepts
            const baseCards: ConceptCard[] = (conceptsData || []).map((concept: any) => ({
                id: `c_${concept.name}`,
                title: concept.display_name || formatName(concept.name),
                description: concept.description || 'Master this concept to improve your chess skills.',
                rarity: determineRarity(concept.puzzle_count), // Custom logic or random
                category: mapCategory(concept.category),
                level: 1,
                cardsOwned: 0,
                cardsRequired: 10, // Base requirement
                minigameId: concept.name, // The tag acts as the "minigame" ID
                tags: [concept.name]
            }));

            // 4. Merge with User's Owned Cards (Saved Progress)
            let finalCards = [...baseCards];
            if (profileData.cards && Array.isArray(profileData.cards) && profileData.cards.length > 0) {
                const dbCardsMap = new Map<string, any>(profileData.cards.map((c: any) => [c.id, c]));
                finalCards = finalCards.map(baseCard => {
                    // Try exact match or legacy match (e.g. c_fork vs c_puzzle-fork)
                    const savedCard = dbCardsMap.get(baseCard.id) || dbCardsMap.get(baseCard.id.replace('c_', 'c_puzzle-'));

                    if (savedCard) {
                        return {
                            ...baseCard,
                            level: savedCard.level || 1,
                            cardsOwned: savedCard.cardsOwned || 0,
                            cardsRequired: savedCard.cardsRequired || 10
                        };
                    }
                    return baseCard;
                });
            }

            const roleName = profileData.app_roles && !Array.isArray(profileData.app_roles) ? profileData.app_roles.name : undefined;

            let loadedChests = (profileData.chests && Array.isArray(profileData.chests)) ? profileData.chests : [null, null, null, null];
            if (loadedChests.length < 4) {
                loadedChests = [...loadedChests, ...Array(4 - loadedChests.length).fill(null)];
            }

            // SuperAdmin Bonus Check
            const currencies = {
                gold: profileData.gold || 0,
                gems: profileData.gems || 0,
            };

            if (roleName === 'SuperAdmin') {
                if (currencies.gold < 100000) currencies.gold = 100000;
                if (currencies.gems < 1000) currencies.gems = 1000;
            }

            set({
                profile: {
                    id: profileData.id,
                    username: profileData.username || 'Jugador',
                    avatarId: 'king-piece',
                    level: profileData.level || 1,
                    xp: profileData.xp || 0,
                    currencies: currencies,
                    attributes: profileData.attributes || { AGGRESSION: 0, SOLIDITY: 0, KNOWLEDGE: 0, SPEED: 0 },
                    settings: profileData.settings || { language: 'ca', notifications: true },
                    role: roleName as any,
                },
                cards: finalCards,
                chests: loadedChests,
                isLoaded: true,
            });

            // Save immediately if we updated SuperAdmin currencies
            if (roleName === 'SuperAdmin' && (profileData.gold < 100000 || profileData.gems < 1000)) {
                get().saveProfile();
            }

        } catch (err) {
            console.error("Critical error loading profile:", err);
        }
    },

    saveProfile: async () => {
        const state = get();
        if (!state.profile.id) return;

        // Simplify cards for saving: we only need ID, level, owned, required
        // But storing full object is safer for now if descriptions change, 
        // ALTHOUGH best practice is storing only mutable state.
        // For simplicity and existing pattern, we store the full array.
        const cardsToSave = state.cards.map(c => ({
            id: c.id,
            level: c.level,
            cardsOwned: c.cardsOwned,
            cardsRequired: c.cardsRequired
            // We omit description, title etc to save space if we wanted to be efficient,
            // but the current implementation loads/overwrites properties from DB map anyway.
            // Let's store minimal data to keep DB clean? 
            // Current implementation: `dbCardsMap` has everything. 
            // If we only save stats, next load relies on `academy_concepts` for titles. THIS IS BETTER.
        })).filter(c => c.level > 1 || c.cardsOwned > 0); // Only save modified cards?
        // Actually, let's just save valid cards state to avoid losing progress.
        // We will stick to saving what we have but maybe keep it lightweight?
        // Reverting to saving the state.cards as is to be safe with existing robust logic.

        const { error } = await supabase
            .from('profiles')
            .update({
                username: state.profile.username,
                level: state.profile.level,
                xp: state.profile.xp,
                gold: state.profile.currencies.gold,
                gems: state.profile.currencies.gems,
                attributes: state.profile.attributes,
                settings: state.profile.settings,
                cards: state.cards, // Saves the full JSON
                chests: state.chests,
            })
            .eq('id', state.profile.id);

        if (error) console.error('Error saving profile:', error);
    },

    addGold: (amount) => {
        set((state) => ({
            profile: {
                ...state.profile,
                currencies: { ...state.profile.currencies, gold: state.profile.currencies.gold + amount }
            }
        }));
        get().saveProfile();
    },

    addGems: (amount) => {
        set((state) => ({
            profile: {
                ...state.profile,
                currencies: { ...state.profile.currencies, gems: state.profile.currencies.gems + amount }
            }
        }));
        get().saveProfile();
    },

    addXp: (amount) => {
        set((state) => {
            const newXp = state.profile.xp + amount;
            const xpToNextLevel = state.profile.level * 1000;
            let newLevel = state.profile.level;

            if (newXp >= xpToNextLevel) {
                newLevel++;
            }

            return {
                profile: {
                    ...state.profile,
                    xp: newXp,
                    level: newLevel,
                }
            };
        });
        get().saveProfile();
    },

    addCardCopy: (cardId, amount = 1) => {
        set((state) => ({
            cards: state.cards.map(card =>
                card.id === cardId
                    ? { ...card, cardsOwned: card.cardsOwned + amount }
                    : card
            )
        }));
        get().saveProfile();
    },

    upgradeCard: (cardId) => {
        set((state) => {
            const cardIndex = state.cards.findIndex(c => c.id === cardId);
            if (cardIndex === -1) return state;

            const card = state.cards[cardIndex];
            const upgradeCost = card.level * 100;

            if (state.profile.currencies.gold < upgradeCost) return state; // Not enough gold
            if (card.cardsOwned < card.cardsRequired) return state; // Not enough cards

            const newCards = [...state.cards];
            newCards[cardIndex] = {
                ...card,
                level: card.level + 1,
                cardsOwned: card.cardsOwned - card.cardsRequired,
                cardsRequired: Math.floor(card.cardsRequired * 1.5)
            };

            return {
                cards: newCards,
                profile: {
                    ...state.profile,
                    currencies: {
                        ...state.profile.currencies,
                        gold: state.profile.currencies.gold - upgradeCost
                    }
                }
            };
        });
        get().saveProfile();
    },

    // --- Chest Logic ---

    addChest: (chest: Chest) => {
        set((state) => {
            const emptyIndex = state.chests.findIndex(c => c === null);
            if (emptyIndex === -1) return state; // No space

            const newChests = [...state.chests];
            newChests[emptyIndex] = chest;
            return { chests: newChests };
        });
        get().saveProfile();
    },

    startUnlockChest: (chestIndex: number) => {
        let success = false;
        set((state) => {
            const newChests = [...state.chests];
            const chest = newChests[chestIndex];
            if (!chest || chest.status !== 'LOCKED') return state;

            // Limit to 1 chest unlocking at a time
            const isAnyUnlocking = newChests.some(c => c && c.status === 'UNLOCKING');
            if (isAnyUnlocking) return state;

            newChests[chestIndex] = {
                ...chest,
                status: 'UNLOCKING',
                unlockStartedAt: Date.now(),
            };
            success = true;
            return { chests: newChests };
        });
        get().saveProfile();
        return success;
    },

    updateChestTimers: () => {
        set((state) => {
            let hasChanges = false;
            const newChests = state.chests.map(chest => {
                if (!chest || chest.status !== 'UNLOCKING' || !chest.unlockStartedAt) return chest;

                const elapsed = (Date.now() - chest.unlockStartedAt) / 1000;
                if (elapsed >= chest.unlockTime) {
                    hasChanges = true;
                    return { ...chest, status: 'READY' as const };
                }
                return chest;
            });

            if (hasChanges) {
                return { chests: newChests };
            }
            return state;
        });

        const state = get();
        if (state.chests.some(c => c?.status === 'READY' && c.unlockStartedAt)) {
            get().saveProfile();
        }
    },

    openChest: (chestIndex: number) => {
        const state = get();
        const chest = state.chests[chestIndex];
        if (!chest) return null;

        // 1. Generate Rewards
        const goldReward = Math.floor(Math.random() * 50) + 10;
        const gemsReward = Math.floor(Math.random() * 5);

        // Random Card
        // Handle case where no cards exist yet (rare but possible if concepts fail to load)
        let cardId = '';
        let cardAmount = 0;
        if (state.cards.length > 0) {
            const randomCardIndex = Math.floor(Math.random() * state.cards.length);
            cardId = state.cards[randomCardIndex].id;
            cardAmount = Math.floor(Math.random() * 5) + 1;
        }

        // 2. Apply Rewards
        state.addGold(goldReward);
        state.addGems(gemsReward);
        if (cardId) state.addCardCopy(cardId, cardAmount);

        // 3. Remove Chest & Handle SuperAdmin Infinite Chests
        set((currentState) => {
            const newChests = [...currentState.chests];

            if (currentState.profile.role === 'SuperAdmin') {
                newChests[chestIndex] = {
                    id: Math.random().toString(36).substring(7),
                    type: Math.random() > 0.8 ? 'GOLDEN' : Math.random() > 0.5 ? 'SILVER' : 'WOODEN',
                    unlockTime: 10,
                    status: 'LOCKED'
                };
            } else {
                newChests[chestIndex] = null;
            }

            return { chests: newChests };
        });

        get().saveProfile();

        return {
            gold: goldReward,
            gems: gemsReward,
            cardId,
            cardAmount
        };
    }
}));


// Helper functions
function formatName(name: string) {
    return name.split(/(?=[A-Z])|_|-/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function determineRarity(count: number): 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' {
    if (count > 100000) return 'COMMON';
    if (count > 50000) return 'RARE';
    if (count > 10000) return 'EPIC';
    return 'LEGENDARY';
}

function mapCategory(category: string): 'AGGRESSION' | 'SOLIDITY' | 'KNOWLEDGE' | 'SPEED' {
    if (!category) return 'KNOWLEDGE';
    const upper = category.toUpperCase();
    if (upper.includes('ATTACK') || upper.includes('MATE') || upper.includes('TACTIC')) return 'AGGRESSION';
    if (upper.includes('DEFENSE') || upper.includes('PAWN') || upper.includes('ENDGAME')) return 'SOLIDITY';
    if (upper.includes('OPENING') || upper.includes('STRATEGY')) return 'KNOWLEDGE';
    return 'SPEED';
}
