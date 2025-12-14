'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSettings } from '@/lib/settings';

export function GlobalBackground() {
    const { backgroundImage } = useSettings();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by rendering default first or nothing
    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-0">
            {/* Desktop Background */}
            <div className="hidden md:block absolute inset-0 transition-opacity duration-1000">
                <Image
                    src={backgroundImage || '/assets/backgrounds/desktop/main-bg.png'}
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                />
            </div>
            {/* Mobile Background (Could be handled separately if needed, for now reuse desktop or use logic) */}
            <div className="block md:hidden absolute inset-0">
                <Image
                    src={backgroundImage || '/assets/backgrounds/mobile/main-bg.png'}
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                    quality={100}
                />
            </div>
            {/* Gradient Overlay - Darker for premium feel */}
            <div className="absolute inset-0 bg-zinc-950/80" />
        </div>
    );
}
