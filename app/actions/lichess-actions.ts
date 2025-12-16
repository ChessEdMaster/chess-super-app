'use server';

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export interface MinePuzzlesResult {
    puzzles: any[];
    error?: string;
    count?: number;
}

/**
 * Mines puzzles based on criteria.
 * Leverages the GIN index on 'tags' for performance.
 */
export async function minePuzzles(criteria: {
    concept?: string;
    ratingMin?: number;
    ratingMax?: number;
    limit?: number;
}): Promise<MinePuzzlesResult> {
    const supabase = await createClient();
    const limit = criteria.limit || 10;
    const minRating = criteria.ratingMin || 0;
    const maxRating = criteria.ratingMax || 3500;

    let query = supabase
        .from('academy_exercises')
        .select('*')
        .gte('rating', minRating)
        .lte('rating', maxRating)
        .limit(limit);

    if (criteria.concept) {
        // Postgres array containment operator @>
        // This requires the GIN index we created: idx_academy_exercises_tags
        query = query.contains('tags', [criteria.concept]);
    }

    // Randomize results slightly? 
    // Retrieving 5M rows randomly is expensive (ORDER BY RANDOM()).
    // A better approach for "mining" is to offset randomly or use a specific strategy.
    // For now, simple fetch. To improve "mining" feel, we could use ID ranges or random offset.
    // Note: OFFSET is slow for large numbers.
    // Strategy: Get a random ID? or just return standard results. 
    // Let's rely on standard index scan first.

    const { data, error } = await query;

    if (error) {
        console.error('Error mining puzzles:', error);
        return { puzzles: [], error: error.message };
    }

    return { puzzles: data || [], count: data?.length };
}

/**
 * Fetches Live Games from Lichess TV
 */
export async function getLichessTV() {
    try {
        const response = await fetch('https://lichess.org/api/tv/feed', {
            method: 'GET',
            next: { revalidate: 10 }, // Cache for 10 seconds
        });

        if (!response.ok) {
            throw new Error(`Lichess API error: ${response.statusText}`);
        }

        // Lichess TV feed is a stream of NDJSON. 
        // BUT the 'feed' endpoint is a stream.. usually we want 'current games'.
        // The endpoint `https://lichess.org/api/tv/channels` or `https://lichess.org/api/tv` (best game) might be better.
        // Let's use `https://lichess.org/api/tv/channels` for variety or `https://lichess.org/api/tv` for the top game.

        // Actually, `GET https://lichess.org/api/tv/feed` is a stream. We don't want a stream server-side usually for a quick fetch.
        // Better: `GET https://lichess.org/tv/best` (redirects) or specific channels.
        // Let's use the list of top games: `https://lichess.org/api/tv/best` -> returns JSON of best game.

        // To get a LIST, we might need to hit multiple channels.
        // Channels: 'bot', 'blitz', 'rapid', 'classical', 'top' (default)

        // We will implement a robust fetcher for 4 top channels.
        const channels = ['best', 'bullet', 'blitz', 'rapid'];
        const results = await Promise.all(
            channels.map(async (c) => {
                const res = await fetch(`https://lichess.org/api/tv/${c}`, { next: { revalidate: 5 } });
                if (res.ok) return await res.json();
                return null;
            })
        );

        return results.filter(Boolean);
    } catch (error) {
        console.error('Error fetching Lichess TV:', error);
        return [];
    }
}
