'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PresenceStatus } from '@/hooks/usePresence';

interface OnlineIndicatorProps {
    userId: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function OnlineIndicator({ userId, showLabel = false, size = 'md' }: OnlineIndicatorProps) {
    const [status, setStatus] = useState<PresenceStatus>('offline');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Obtenir l'estat inicial
        fetchPresence();

        // Subscriure's als canvis en temps real
        const channel = supabase
            .channel(`presence:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_presence',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.new && 'status' in payload.new) {
                        setStatus(payload.new.status as PresenceStatus);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const fetchPresence = async () => {
        try {
            const { data, error } = await supabase
                .from('user_presence')
                .select('status')
                .eq('user_id', userId)
                .single();

            if (error) {
                // Si no existeix, assumim offline
                setStatus('offline');
            } else if (data) {
                setStatus(data.status as PresenceStatus);
            }
        } catch (error) {
            console.error('Error fetching presence:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'online':
                return 'bg-green-500';
            case 'in_game':
                return 'bg-blue-500';
            case 'offline':
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'online':
                return 'Online';
            case 'in_game':
                return 'In Game';
            case 'offline':
            default:
                return 'Offline';
        }
    };

    const getSizeClass = () => {
        switch (size) {
            case 'sm':
                return 'w-2 h-2';
            case 'lg':
                return 'w-4 h-4';
            case 'md':
            default:
                return 'w-3 h-3';
        }
    };

    if (loading) {
        return (
            <div className={`${getSizeClass()} rounded-full bg-gray-700 animate-pulse`} />
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className={`${getSizeClass()} rounded-full ${getStatusColor()} ${status === 'online' || status === 'in_game' ? 'animate-pulse' : ''}`} />
            {showLabel && (
                <span className="text-xs text-gray-400 font-medium">
                    {getStatusLabel()}
                </span>
            )}
        </div>
    );
}
