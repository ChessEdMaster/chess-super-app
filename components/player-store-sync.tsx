'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { usePlayerStore } from '@/lib/store/player-store';

export function PlayerStoreSync({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { loadProfile, isLoaded } = usePlayerStore();

    useEffect(() => {
        if (user && !isLoaded) {
            loadProfile(user.id);
        }
    }, [user, isLoaded, loadProfile]);

    return <>{children}</>;
}
