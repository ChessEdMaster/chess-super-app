// Zustand store for global app settings
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BoardTheme = 'classic' | 'wood' | 'glass' | 'marble';

interface SettingsState {
    soundEnabled: boolean;
    boardTheme: BoardTheme;
    toggleSound: () => void;
    setBoardTheme: (theme: BoardTheme) => void;
    backgroundImage: string;
    setBackgroundImage: (url: string) => void;
}

export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            soundEnabled: true,
            boardTheme: 'classic',
            backgroundImage: '/assets/backgrounds/desktop/main-bg.png',
            toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
            setBoardTheme: (theme) => set({ boardTheme: theme }),
            setBackgroundImage: (url) => set({ backgroundImage: url }),
        }),
        {
            name: 'chess-settings',
        }
    )
);
