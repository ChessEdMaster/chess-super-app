'use client';

import { usePresence } from '@/hooks/usePresence';

export function PresenceSync() {
    usePresence();
    return null;
}
