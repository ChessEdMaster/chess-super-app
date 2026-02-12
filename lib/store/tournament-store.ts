import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface TournamentPlayer {
    user_id: string;
    score: number;
    performance: number;
    rank: number;
    profiles?: {
        username: string;
        avatar_url: string;
    };
}

interface TournamentState {
    players: TournamentPlayer[];
    isJoined: boolean;
    isQueued: boolean;
    fetchPlayers: (tournamentId: string) => Promise<void>;
    joinTournament: (tournamentId: string, userId: string) => Promise<void>;
    joinQueue: (tournamentId: string, userId: string, rating: number) => Promise<void>;
    leaveQueue: (tournamentId: string, userId: string) => Promise<void>;
    checkIfJoined: (tournamentId: string, userId: string) => Promise<void>;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
    players: [],
    isJoined: false,
    isQueued: false,

    fetchPlayers: async (tournamentId) => {
        const { data, error } = await supabase
            .from('tournament_players')
            .select(`
                *,
                profiles:user_id(username, avatar_url)
            `)
            .eq('tournament_id', tournamentId)
            .order('score', { ascending: false });

        if (data) set({ players: data as any });
    },

    joinTournament: async (tournamentId, userId) => {
        const { error } = await supabase
            .from('tournament_players')
            .upsert({ tournament_id: tournamentId, user_id: userId }, { onConflict: 'tournament_id, user_id' });

        if (!error) {
            set({ isJoined: true });
            get().fetchPlayers(tournamentId);
        }
    },

    joinQueue: async (tournamentId, userId, rating) => {
        const { error } = await supabase
            .from('tournament_queue')
            .upsert({ tournament_id: tournamentId, user_id: userId, rating });

        if (!error) set({ isQueued: true });
    },

    leaveQueue: async (tournamentId, userId) => {
        const { error } = await supabase
            .from('tournament_queue')
            .delete()
            .match({ tournament_id: tournamentId, user_id: userId });

        if (!error) set({ isQueued: false });
    },

    checkIfJoined: async (tournamentId, userId) => {
        const { data } = await supabase
            .from('tournament_players')
            .select('user_id')
            .match({ tournament_id: tournamentId, user_id: userId })
            .maybeSingle();

        const { data: queueData } = await supabase
            .from('tournament_queue')
            .select('user_id')
            .match({ tournament_id: tournamentId, user_id: userId })
            .maybeSingle();

        set({ isJoined: !!data, isQueued: !!queueData });
    }
}));
