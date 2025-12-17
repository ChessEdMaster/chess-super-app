'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';

type Theme = 'light' | 'clash';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { profile, saveProfile } = usePlayerStore();

    // Default to light (Professional Light) if no setting exists
    const [theme, setThemeState] = useState<Theme>(profile?.settings?.theme || 'light');

    // Sync with store updates (e.g. when profile loads)
    useEffect(() => {
        if (profile?.settings?.theme) {
            setThemeState(profile.settings.theme);
        }
    }, [profile?.settings?.theme]);

    // Apply theme class to body
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove all theme classes first
        root.classList.remove('theme-clash', 'theme-light');

        // Add current theme class
        // 'light' is default, so we might not strictly need a class if root vars are light by default,
        // but explicit is better for switching.
        // 'clash' will trigger the overrides.
        if (theme === 'clash') {
            root.classList.add('theme-clash');
        } else {
            root.classList.add('theme-light');
        }

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
