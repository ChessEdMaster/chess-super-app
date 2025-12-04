import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { KingdomBuilding, KingdomResources, BUILDING_TYPES } from '@/types/kingdom';
import { toast } from 'sonner';

export function useKingdom() {
    const [resources, setResources] = useState<KingdomResources | null>(null);
    const [buildings, setBuildings] = useState<KingdomBuilding[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKingdomData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Resources
            let { data: resData, error: resError } = await supabase
                .from('kingdom_resources')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (resError && resError.code === 'PGRST116') {
                // Create if not exists
                const { data: newData, error: createError } = await supabase
                    .from('kingdom_resources')
                    .insert({ user_id: user.id, gold: 500, mana: 100 }) // Starting resources
                    .select()
                    .single();

                if (createError) throw createError;
                resData = newData;
            } else if (resError) {
                throw resError;
            }

            setResources(resData);

            // Fetch Buildings
            const { data: bData, error: bError } = await supabase
                .from('kingdom_buildings')
                .select('*')
                .eq('user_id', user.id);

            if (bError) throw bError;
            setBuildings(bData || []);

        } catch (error) {
            console.error('Error fetching kingdom data:', error);
            // toast.error('Failed to load kingdom data'); // Suppress initial load error to avoid spam if not logged in
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKingdomData();

        // Subscribe to changes
        const channel = supabase
            .channel('kingdom_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kingdom_resources' }, (payload) => {
                if (payload.new) setResources(payload.new as KingdomResources);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kingdom_buildings' }, () => {
                fetchKingdomData(); // Refetch buildings to be safe
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchKingdomData]);

    const constructBuilding = async (type: string, x: number, y: number) => {
        if (!resources) return;

        const config = BUILDING_TYPES[type];
        if (!config) return;

        if (resources.gold < config.cost.gold || resources.mana < config.cost.mana) {
            toast.error('Not enough resources!');
            return;
        }

        // Check if spot is taken
        if (buildings.some(b => b.x === x && b.y === y)) {
            toast.error('Spot already taken!');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Deduct resources
            const { error: resError } = await supabase
                .from('kingdom_resources')
                .update({
                    gold: resources.gold - config.cost.gold,
                    mana: resources.mana - config.cost.mana
                })
                .eq('user_id', user.id);

            if (resError) throw resError;

            // Create building
            const { error: buildError } = await supabase
                .from('kingdom_buildings')
                .insert({
                    user_id: user.id,
                    type,
                    x,
                    y,
                    status: 'constructing'
                });

            if (buildError) throw buildError;

            toast.success(`Construction of ${config.name} started!`);

        } catch (error) {
            console.error('Error constructing building:', error);
            toast.error('Construction failed');
        }
    };

    const collectResources = async () => {
        // Mock implementation for Phase 1
        if (!resources) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const goldGain = 10;
            const manaGain = 5;

            const { error } = await supabase
                .from('kingdom_resources')
                .update({
                    gold: resources.gold + goldGain,
                    mana: resources.mana + manaGain
                })
                .eq('user_id', user.id);

            if (error) throw error;
            toast.success(`Collected ${goldGain} Gold and ${manaGain} Mana!`);

        } catch (error) {
            console.error('Error collecting resources:', error);
        }
    };

    const convertPuzzleEloToGold = (eloChange: number) => {
        // Mock: 1 Elo = 10 Gold
        return eloChange * 10;
    };

    return {
        resources,
        buildings,
        loading,
        constructBuilding,
        collectResources,
        convertPuzzleEloToGold
    };
}
