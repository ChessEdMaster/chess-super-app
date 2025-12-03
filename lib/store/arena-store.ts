import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ArenaProgress, ArenaVariant } from '@/types/arena';

interface ArenaState {
    progress: Record<ArenaVariant, ArenaProgress | null>;
    isLoading: boolean;

    // Actions
    fetchArenaProgress: (userId: string) => Promise<void>;
    updateCups: (userId: string, variant: ArenaVariant, amount: number) => Promise<void>;
    claimChest: (userId: string, variant: ArenaVariant, chestId: string) => Promise<void>;
    recordGatekeeperDefeat: (userId: string, variant: ArenaVariant, tier: number) => Promise<void>;
}

export const useArenaStore = create<ArenaState>((set, get) => ({
    progress: {
        bullet: null,
        blitz: null,
        rapid: null,
    },
    isLoading: false,

    fetchArenaProgress: async (userId: string) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('arena_progress')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            const progressMap: Record<ArenaVariant, ArenaProgress | null> = {
                bullet: null,
                blitz: null,
                rapid: null,
            };

            // Initialize with default if not found
            const variants: ArenaVariant[] = ['bullet', 'blitz', 'rapid'];

            for (const variant of variants) {
                const existing = data?.find(p => p.variant === variant);
                if (existing) {
                    progressMap[variant] = existing;
                } else {
                    // Create default entry if it doesn't exist
                    // We can do this lazily or upfront. Let's do it lazily in UI, 
                    // but for the store, we'll just keep it null or create a local default object
                    // to avoid constant DB writes on just viewing.
                    // Actually, let's auto-create on fetch if missing to simplify logic?
                    // No, let's just return a default structure for UI rendering
                    progressMap[variant] = {
                        id: `temp_${variant}`,
                        user_id: userId,
                        variant: variant,
                        current_cups: 0,
                        highest_cups: 0,
                        chests_claimed: [],
                        gatekeepers_defeated: []
                    };
                }
            }

            set({ progress: progressMap });
        } catch (error) {
            console.error('Error fetching arena progress:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateCups: async (userId, variant, amount) => {
        const currentProgress = get().progress[variant];
        if (!currentProgress) return;

        let newCups = Math.max(0, currentProgress.current_cups + amount);

        // Gatekeeper Logic: Cap cups if gatekeeper not defeated
        const defeated = currentProgress.gatekeepers_defeated || [];

        if (currentProgress.current_cups < 250 && newCups >= 250 && !defeated.includes(1)) {
            newCups = 250;
        } else if (currentProgress.current_cups < 500 && newCups >= 500 && !defeated.includes(2)) {
            newCups = 500;
        } else if (currentProgress.current_cups < 750 && newCups >= 750 && !defeated.includes(3)) {
            newCups = 750;
        }

        const newHighest = Math.max(currentProgress.highest_cups, newCups);

        // Optimistic update
        set(state => ({
            progress: {
                ...state.progress,
                [variant]: {
                    ...state.progress[variant]!,
                    current_cups: newCups,
                    highest_cups: newHighest
                }
            }
        }));

        // DB Update
        const { error } = await supabase
            .from('arena_progress')
            .upsert({
                user_id: userId,
                variant: variant,
                current_cups: newCups,
                highest_cups: newHighest,
                chests_claimed: currentProgress.chests_claimed, // Keep existing
                gatekeepers_defeated: currentProgress.gatekeepers_defeated // Keep existing
            }, { onConflict: 'user_id, variant' });

        if (error) {
            console.error('Error updating cups:', error);
            // Revert on error? For now, we assume success.
        }
    },

    claimChest: async (userId, variant, chestId) => {
        const currentProgress = get().progress[variant];
        if (!currentProgress) return;

        if (currentProgress.chests_claimed.includes(chestId)) return;

        const newClaimed = [...currentProgress.chests_claimed, chestId];

        // Optimistic update
        set(state => ({
            progress: {
                ...state.progress,
                [variant]: {
                    ...state.progress[variant]!,
                    chests_claimed: newClaimed
                }
            }
        }));

        // DB Update
        const { error } = await supabase
            .from('arena_progress')
            .upsert({
                user_id: userId,
                variant: variant,
                chests_claimed: newClaimed
            }, { onConflict: 'user_id, variant' });

        if (error) console.error('Error claiming chest:', error);
    },

    recordGatekeeperDefeat: async (userId, variant, tier) => {
        const currentProgress = get().progress[variant];
        if (!currentProgress) return;

        if (currentProgress.gatekeepers_defeated.includes(tier)) return;

        const newDefeated = [...currentProgress.gatekeepers_defeated, tier];

        // Optimistic update
        set(state => ({
            progress: {
                ...state.progress,
                [variant]: {
                    ...state.progress[variant]!,
                    gatekeepers_defeated: newDefeated
                }
            }
        }));

        // DB Update
        const { error } = await supabase
            .from('arena_progress')
            .upsert({
                user_id: userId,
                variant: variant,
                gatekeepers_defeated: newDefeated
            }, { onConflict: 'user_id, variant' });

        if (error) console.error('Error recording gatekeeper defeat:', error);
    }
}));
