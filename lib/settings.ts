// Zustand store for global app settings
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BoardTheme = 'classic' | 'wood' | 'glass' | 'marble';

interface SettingsState {
    soundEnabled: boolean;
    boardTheme: BoardTheme;
    toggleSound: () => void;
    setBoardTheme: (theme: BoardTheme) => void;
}

export const useSettings = create<SettingsState>()(
    persist(
        (set) => ({
            soundEnabled: true,
            boardTheme: 'classic',
            toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
            setBoardTheme: (theme) => set({ boardTheme: theme }),
        }),
        {
            name: 'chess-settings',
        }
    )
);
