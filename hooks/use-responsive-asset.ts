'use client';

import { useState, useEffect } from 'react';

type AssetCategory = 'branding' | 'backgrounds' | 'ui' | 'kingdom' | 'cards' | 'avatars';

export function useResponsiveAsset() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkMobile();

        // Listen for resize
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const getAssetPath = (category: AssetCategory, filename: string) => {
        const deviceFolder = isMobile ? 'mobile' : 'desktop';
        // Ensure filename doesn't start with a slash to avoid double slashes if we add one
        const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
        return `/assets/${category}/${deviceFolder}/${cleanFilename}`;
    };

    return { getAssetPath, isMobile };
}
