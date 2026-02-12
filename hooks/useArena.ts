import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArenaDivision, ArenaProgress, ArenaVariant } from '@/types/arena';
import { useAuth } from '@/components/auth-provider';

export function useArena(variant: ArenaVariant = 'blitz') {
    const { user } = useAuth();
    const [divisions, setDivisions] = useState<ArenaDivision[]>([]);
    const [progress, setProgress] = useState<ArenaProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            try {
                // Fetch Divisions
                const { data: divsData, error: divsError } = await supabase
                    .from('arena_divisions')
                    .select('*')
                    .order('min_cups', { ascending: true });
                
                if (divsError) throw divsError;
                setDivisions(divsData || []);

                // Fetch User Progress
                const { data: progData, error: progError } = await supabase
                    .from('arena_progress')
                    .select('*')
                    .eq('user_id', user!.id)
                    .eq('variant', variant)
                    .single();

                if (progError && progError.code !== 'PGRST116') throw progError; // PGRST116 is "No rows found"

                // If no progress exists, create default
                if (!progData && divsData && divsData.length > 0) {
                    const firstDiv = divsData[0];
                    const { data: newProg, error: createError } = await supabase
                        .from('arena_progress')
                        .insert({
                            user_id: user!.id,
                            variant: variant,
                            current_cups: 0,
                            highest_cups: 0,
                            current_division_id: firstDiv.id
                        })
                        .select()
                        .single();
                    
                    if (createError) throw createError;
                    setProgress(newProg);
                } else {
                    setProgress(progData);
                }

            } catch (error) {
                console.error('Error fetching Arena data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user, variant]);

    return { divisions, progress, loading };
}
