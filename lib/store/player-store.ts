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

const GENERATE_CARDS = (): ConceptCard[] => {
    type CardDef = {
        title: string;
        desc: string;
        puzzle: string;
        rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
        category: 'AGGRESSION' | 'SOLIDITY' | 'KNOWLEDGE' | 'SPEED';
        tags: string[];
    };

    // Unique list of cards based on themes available in DB
    const cards: CardDef[] = [
        { title: 'La Forquilla', desc: 'Atacar dues peces alhora amb una sola peça.', puzzle: 'puzzle-fork', rarity: 'COMMON', category: 'AGGRESSION', tags: ['fork'] },
        { title: 'La Clavada', desc: 'Immobilitzar una peça perquè no exposi una de més valor.', puzzle: 'puzzle-pin', rarity: 'COMMON', category: 'SOLIDITY', tags: ['pin'] },
        { title: "L'Enfilada", desc: 'Atacar una peça valuosa i capturar la que hi ha darrere.', puzzle: 'puzzle-skewer', rarity: 'RARE', category: 'AGGRESSION', tags: ['skewer'] },
        { title: 'Escac a la Descoberta', desc: 'Moure una peça per obrir línia d\'atac d\'una altra.', puzzle: 'puzzle-discovered', rarity: 'RARE', category: 'KNOWLEDGE', tags: ['discoveredAttack'] },
        { title: 'Raigs X', desc: 'Atacar a través d\'una peça enemiga.', puzzle: 'puzzle-xray', rarity: 'RARE', category: 'KNOWLEDGE', tags: ['xRayAttack'] },
        { title: 'Sacrifici', desc: 'Entregar material per obtenir avantatge tàctic.', puzzle: 'puzzle-sacrifice', rarity: 'EPIC', category: 'AGGRESSION', tags: ['sacrifice'] },
        { title: 'Desviació', desc: 'Forçar una peça a abandonar una casella clau.', puzzle: 'puzzle-deflection', rarity: 'EPIC', category: 'SPEED', tags: ['deflection'] },
        { title: 'Intercepció', desc: 'Tallar la línia d\'acció d\'una peça enemiga.', puzzle: 'puzzle-interception', rarity: 'EPIC', category: 'SPEED', tags: ['interference'] },
        { title: 'Zugzwang', desc: 'Qualsevol moviment empitjora la posició.', puzzle: 'puzzle-zugzwang', rarity: 'LEGENDARY', category: 'KNOWLEDGE', tags: ['zugzwang'] },
        { title: 'Peó Passat', desc: 'Un peó sense oposició cap a la promoció.', puzzle: 'puzzle-passed-pawn', rarity: 'COMMON', category: 'SOLIDITY', tags: ['advancedPawn'] },
        { title: 'Mate del Passadís', desc: 'Mate a la vuitena fila per bloqueig de peons.', puzzle: 'puzzle-back-rank', rarity: 'COMMON', category: 'SPEED', tags: ['backRankMate'] },
        { title: 'Mate de l\'Ofegat', desc: 'El rei està atrapat per les seves pròpies peces.', puzzle: 'puzzle-smothered', rarity: 'RARE', category: 'AGGRESSION', tags: ['smotheredMate'] },
        { title: 'Obertura Italiana', desc: 'Control del centre i atac ràpid.', puzzle: 'puzzle-italian', rarity: 'COMMON', category: 'KNOWLEDGE', tags: ['italian'] },
        { title: 'Defensa Siciliana', desc: 'Contraatac agressiu des del principi.', puzzle: 'puzzle-sicilian', rarity: 'COMMON', category: 'AGGRESSION', tags: ['sicilian'] },
        { title: 'Gambit de Dama', desc: 'Sacrifici de peó per control central.', puzzle: 'puzzle-queens-gambit', rarity: 'COMMON', category: 'KNOWLEDGE', tags: ['queensGambit'] },
        { title: 'Ruy Lopez', desc: 'Pressió constant sobre el cavall i el centre.', puzzle: 'puzzle-ruy-lopez', rarity: 'COMMON', category: 'KNOWLEDGE', tags: ['ruyLopez'] },
        { title: 'Defensa Francesa', desc: 'Estructura sòlida i contraatac al centre.', puzzle: 'puzzle-french', rarity: 'COMMON', category: 'SOLIDITY', tags: ['french'] },
        { title: 'Defensa Caro-Kann', desc: 'Solidesa extrema i finals favorables.', puzzle: 'puzzle-caro-kann', rarity: 'COMMON', category: 'SOLIDITY', tags: ['caroKann'] },
        { title: 'Atac Indi de Rei', desc: 'Atac directe al rei enrocant.', puzzle: 'puzzle-kings-indian', rarity: 'RARE', category: 'AGGRESSION', tags: ['kingsIndian'] },
        { title: 'Sistema Londres', desc: 'Desenvolupament sòlid i universal.', puzzle: 'puzzle-london', rarity: 'COMMON', category: 'SOLIDITY', tags: ['london'] }
    ];

    return cards.map((c, i) => ({
        id: `c_${c.puzzle}`, // Stable ID based on puzzle type
        title: c.title,
        rarity: c.rarity,
        category: c.category,
        level: 1,
        cardsOwned: 0,
        cardsRequired: 10,
        description: c.desc,
        minigameId: c.puzzle,
        tags: c.tags
    }));
};

const DEFAULT_CARDS = GENERATE_CARDS();

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
    cards: DEFAULT_CARDS,
    chests: [null, null, null, null],
    isLoaded: false,

    loadProfile: async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*, app_roles(name)')
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error('Error loading profile:', error);
            return;
        }

        const roleName = data.app_roles && !Array.isArray(data.app_roles) ? data.app_roles.name : undefined;

        // Merge logic: Use DEFAULT_CARDS but update with owned counts/levels from DB if they exist
        let loadedCards = [...DEFAULT_CARDS];
        if (data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
            // Map DB cards to current definitions to keep descriptions/titles updated
            const dbCardsMap = new Map<string, any>(data.cards.map((c: any) => [c.id, c]));
            loadedCards = loadedCards.map(card => {
                const dbCard = dbCardsMap.get(card.id);
                if (dbCard) {
                    return { ...card, level: dbCard.level, cardsOwned: dbCard.cardsOwned, cardsRequired: dbCard.cardsRequired };
                }
                return card;
            });
        }

        let loadedChests = (data.chests && Array.isArray(data.chests)) ? data.chests : [null, null, null, null];
        if (loadedChests.length < 4) {
            loadedChests = [...loadedChests, ...Array(4 - loadedChests.length).fill(null)];
        }

        // SuperAdmin Bonus Check
        const currencies = {
            gold: data.gold || 0,
            gems: data.gems || 0,
        };

        if (roleName === 'SuperAdmin') {
            if (currencies.gold < 100000) currencies.gold = 100000;
            if (currencies.gems < 1000) currencies.gems = 1000;
        }

        set({
            profile: {
                id: data.id,
                username: data.username || 'Jugador',
                avatarId: 'king-piece',
                level: data.level || 1,
                xp: data.xp || 0,
                currencies: currencies,
                attributes: data.attributes || { AGGRESSION: 0, SOLIDITY: 0, KNOWLEDGE: 0, SPEED: 0 },
                settings: data.settings || { language: 'ca', notifications: true },
                role: roleName as any,
            },
            cards: loadedCards,
            chests: loadedChests,
            isLoaded: true,
        });

        // Save immediately if we updated SuperAdmin currencies
        if (roleName === 'SuperAdmin' && (data.gold < 100000 || data.gems < 1000)) {
            get().saveProfile();
        }
    },

    saveProfile: async () => {
        const state = get();
        if (!state.profile.id) return;

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
                cards: state.cards,
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
            // Cost logic: Level * 100 Gold (Example)
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
        // Save if changed (can be optimized to debounce)
        // We'll just save periodically or when status changes to READY
        const state = get();
        if (state.chests.some(c => c?.status === 'READY' && c.unlockStartedAt)) {
            // Clear unlockStartedAt for READY chests to avoid re-saving? 
            // Actually, let's just save.
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
        const randomCardIndex = Math.floor(Math.random() * state.cards.length);
        const cardId = state.cards[randomCardIndex].id;
        const cardAmount = Math.floor(Math.random() * 5) + 1;

        // 2. Apply Rewards
        state.addGold(goldReward);
        state.addGems(gemsReward);
        state.addCardCopy(cardId, cardAmount);

        // 3. Remove Chest & Handle SuperAdmin Infinite Chests
        set((currentState) => {
            const newChests = [...currentState.chests];

            if (currentState.profile.role === 'SuperAdmin') {
                // Refill immediately with a new random chest
                newChests[chestIndex] = {
                    id: Math.random().toString(36).substring(7),
                    type: Math.random() > 0.8 ? 'GOLDEN' : Math.random() > 0.5 ? 'SILVER' : 'WOODEN',
                    unlockTime: 10, // Short time for testing
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

