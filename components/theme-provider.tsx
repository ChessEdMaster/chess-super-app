'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';

export type Theme = 'light' | 'dark-premium' | 'clash';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_CLASSES: Record<Theme, string> = {
    'light': 'theme-light',
    'dark-premium': 'theme-dark-premium',
    'clash': 'theme-clash',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { profile, saveProfile } = usePlayerStore();

    // Default to light (Professional Light) if no setting exists
    const [theme, setThemeState] = useState<Theme>(
        (profile?.settings?.theme as Theme) || 'light'
    );

    // Sync with store updates (e.g. when profile loads)
    useEffect(() => {
        if (profile?.settings?.theme) {
            setThemeState(profile.settings.theme as Theme);
        }
    }, [profile?.settings?.theme]);

    // Apply theme class to document root
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove all theme classes
        Object.values(THEME_CLASSES).forEach(cls => root.classList.remove(cls));

        // Add current theme class
        root.classList.add(THEME_CLASSES[theme]);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        // Update store state immediately for UI consistency
        usePlayerStore.setState(state => ({
            profile: {
                ...state.profile,
                settings: {
                    ...state.profile.settings!,
                    theme: newTheme
                }
            }
        }));
        // Persist to DB
        saveProfile();
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
