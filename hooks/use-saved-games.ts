import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SavedGame {
    id: string;
    white: string;
    black: string;
    result: string;
    date: string;
    event: string;
    pgn: string;
    updated_at: string;
}

export function useSavedGames() {
    const [games, setGames] = useState<SavedGame[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('pgn_games')
                .select('id, white, black, result, date, event, pgn, updated_at')
                .order('updated_at', { ascending: false })
                .limit(50); // Pagination could be added later

            if (error) {
                console.error('Error fetching games:', error);
            } else {
                setGames(data || []);
            }
            setLoading(false);
        };

        fetchGames();
    }, []);

    const deleteGame = async (id: string) => {
        const { error } = await supabase
            .from('pgn_games')
            .delete()
            .eq('id', id);

        if (!error) {
            setGames(prev => prev.filter(g => g.id !== id));
        }
    };

    return { games, loading, deleteGame };
}
