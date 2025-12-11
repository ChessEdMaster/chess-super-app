import { create } from 'zustand';

interface UIStore {
    isAssistantOpen: boolean;
    toggleAssistant: () => void;
    setAssistantOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
    isAssistantOpen: false,
    toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
    setAssistantOpen: (open) => set({ isAssistantOpen: open }),
}));
