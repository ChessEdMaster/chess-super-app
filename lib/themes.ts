// Board theme configurations
export interface ThemeColors {
    light: string;
    dark: string;
    name: string;
}

export const BOARD_THEMES: Record<string, ThemeColors> = {
    classic: {
        name: 'Clàssic',
        light: '#ebecd0',
        dark: '#779556',
    },
    wood: {
        name: 'Fusta',
        light: '#f0d9b5',
        dark: '#b58863',
    },
    glass: {
        name: 'Vidre',
        light: '#e0f2f7',
        dark: '#4dd0e1',
    },
    marble: {
        name: 'Marbre',
        light: '#f5f5f5',
        dark: '#9e9e9e',
    },
};
