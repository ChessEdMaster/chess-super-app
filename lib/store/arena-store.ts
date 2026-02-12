import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { ArenaProgress, ArenaVariant } from '@/types/arena';
import { calculateNewRating, Glicko2Player, Glicko2Result } from '@/lib/game/ratings';
import { toast } from 'sonner';

interface ArenaState {
    progress: Record<ArenaVariant, ArenaProgress | null>;
    isLoading: boolean;

    // Actions
    fetchArenaProgress: (userId: string) => Promise<void>;
    updateCups: (userId: string, variant: ArenaVariant, amount: number) => Promise<void>;
    processMatchResult: (userId: string, variant: ArenaVariant, result: 'win' | 'draw' | 'loss', opponentRating?: number) => Promise<void>;
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

        // NEW LOGIC: If already above 1000 cups or elo_unlocked, we don't use updateCups for ELO.
        // But for backward compatibility with existing calls, we'll allow it if amount > 0.
        // Actually, let's follow the user rules:
        // 0-1000: +25 win, +10 draw, 0 loss.
        // Above 1000: Official ELO.

        let newCups = currentProgress.current_cups;
        let eloUnlocked = currentProgress.elo_unlocked || false;

        if (currentProgress.current_cups < 1000) {
            // Training Phase (+25 / +10 / 0)
            // Note: The 'amount' passed from the component is already 25 or 10.
            newCups = Math.max(0, currentProgress.current_cups + amount);
            
            // Check for 1000 cap and ELO unlock
            if (newCups >= 1000) {
                newCups = 1000;
                eloUnlocked = true;
                // toast.success("FELICITATS! Has desbloquejat l'ELO Oficial! 🏆"); // Not accessible here, handle in component
            }
        } else {
            // If already at 1000, we don't increment cups further via this simple method usually, 
            // but we might still use it for special bonuses.
            // For now, let's cap at 1000.
            newCups = 1000;
            eloUnlocked = true;
        }

        // Gatekeeper Logic: Cap cups if gatekeeper not defeated
        const defeated = currentProgress.gatekeepers_defeated || [];

        // Apply caps based on gatekeepers
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
                    highest_cups: newHighest,
                    elo_unlocked: eloUnlocked
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
                elo_unlocked: eloUnlocked,
                chests_claimed: currentProgress.chests_claimed,
                gatekeepers_defeated: currentProgress.gatekeepers_defeated,
                rating: currentProgress.rating || 1500,
                rating_deviation: currentProgress.rating_deviation || 350,
                volatility: currentProgress.volatility || 0.06
            }, { onConflict: 'user_id, variant' });

        if (error) {
            console.error('Error updating cups:', error);
        }
    },

    processMatchResult: async (userId, variant, result, opponentRating) => {
        const currentProgress = get().progress[variant];
        if (!currentProgress) {
            console.error(`[ArenaStore] No progress found for ${variant}. Fetching...`);
            await get().fetchArenaProgress(userId);
        }
        
        const progress = get().progress[variant];
        if (!progress) return;

        // 1. Cup Logic (Training Phase < 1000)
        if (progress.current_cups < 1000) {
            let cupGain = 0;
            if (result === 'win') cupGain = 25;
            else if (result === 'draw') cupGain = 10;
            
            if (cupGain > 0) {
                await get().updateCups(userId, variant, cupGain);
                toast.success(`🏆 +${cupGain} Copes! (${variant.toUpperCase()})`);
            } else {
                toast.info(`Derrota. No ganyes copes, però segueix intentant-ho! 💪`);
            }
        }

        // 2. Official ELO Logic (> 1000 or elo_unlocked)
        if (progress.elo_unlocked) {
            const player: Glicko2Player = {
                rating: progress.rating || 1500,
                rd: progress.rating_deviation || 350,
                volatility: progress.volatility || 0.06
            };

            const oppRating = opponentRating || 1200; 

            const results: Glicko2Result[] = [{
                opponent: { rating: oppRating, rd: 150, volatility: 0.06 },
                outcome: result === 'win' ? 1 : result === 'draw' ? 0.5 : 0
            }];

            const newRatingData = calculateNewRating(player, results);
            const ratingChange = newRatingData.rating - player.rating;

            console.log(`[ArenaStore] ELO Update (${variant}): ${player.rating.toFixed(0)} -> ${newRatingData.rating.toFixed(0)} (${ratingChange > 0 ? '+' : ''}${ratingChange.toFixed(0)})`);

            // Update State
            set(state => ({
                progress: {
                    ...state.progress,
                    [variant]: {
                        ...state.progress[variant]!,
                        rating: newRatingData.rating,
                        rating_deviation: newRatingData.rd,
                        volatility: newRatingData.volatility,
                        last_rating_change: ratingChange
                    }
                }
            }));

            // DB Update (Using upsert to ensure row exists/updates)
            const { error: ratingError } = await supabase
                .from('arena_progress')
                .upsert({
                    user_id: userId,
                    variant: variant,
                    rating: newRatingData.rating,
                    rating_deviation: newRatingData.rd,
                    volatility: newRatingData.volatility,
                    last_rating_change: ratingChange,
                    elo_unlocked: true, // Keep it true if we are in this block
                    current_cups: progress.current_cups,
                    highest_cups: progress.highest_cups,
                    chests_claimed: progress.chests_claimed,
                    gatekeepers_defeated: progress.gatekeepers_defeated
                }, { onConflict: 'user_id, variant' });

            if (ratingError) {
                console.error('Error updating official ELO rating:', ratingError);
                toast.error("Error al guardar l'ELO a la base de dades.");
            } else {
                const changeTxt = ratingChange >= 0 ? `+${ratingChange.toFixed(0)}` : `${ratingChange.toFixed(0)}`;
                toast.success(`📊 ELO ${variant.toUpperCase()}: ${newRatingData.rating.toFixed(0)} (${changeTxt})`);
            }
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
