'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

export type PresenceStatus = 'online' | 'offline' | 'in_game';

export function usePresence() {
    const { user } = useAuth();

    // Actualitzar presència a online
    const setOnline = useCallback(async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('user_presence')
                .upsert(
                    {
                        user_id: user.id,
                        status: 'online',
                        last_seen: new Date().toISOString()
                    },
                    { onConflict: 'user_id' }
                );

            if (error) console.error('Error setting online status:', error);
        } catch (error) {
            console.error('Error in setOnline:', error);
        }
    }, [user]);

    // Actualitzar presència a offline
    const setOffline = useCallback(async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('user_presence')
                .upsert(
                    {
                        user_id: user.id,
                        status: 'offline',
                        last_seen: new Date().toISOString()
                    },
                    { onConflict: 'user_id' }
                );

            if (error) console.error('Error setting offline status:', error);
        } catch (error) {
            console.error('Error in setOffline:', error);
        }
    }, [user]);

    // Actualitzar presència a in_game
    const setInGame = useCallback(async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('user_presence')
                .upsert(
                    {
                        user_id: user.id,
                        status: 'in_game',
                        last_seen: new Date().toISOString()
                    },
                    { onConflict: 'user_id' }
                );

            if (error) console.error('Error setting in_game status:', error);
        } catch (error) {
            console.error('Error in setInGame:', error);
        }
    }, [user]);

    // Heartbeat - actualitza l'estat cada 30 segons per mantenir-lo viu
    useEffect(() => {
        if (!user) return;

        const heartbeat = setInterval(() => {
            setOnline();
        }, 30000); // 30 segons

        return () => clearInterval(heartbeat);
    }, [user, setOnline]);

    // Establir online quan el component es munta
    useEffect(() => {
        if (user) {
            setOnline();
        }
    }, [user, setOnline]);

    // Establir offline quan el component es desmunta o la finestra es tanca
    useEffect(() => {
        if (!user) return;

        const handleBeforeUnload = () => {
            // Usar sendBeacon per garantir que s'envia abans de tancar
            navigator.sendBeacon(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_presence`,
                JSON.stringify({
                    user_id: user.id,
                    status: 'offline',
                    last_seen: new Date().toISOString()
                })
            );
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setOffline();
            } else {
                setOnline();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            setOffline();
        };
    }, [user, setOffline, setOnline]);

    return {
        setOnline,
        setOffline,
        setInGame
    };
}
