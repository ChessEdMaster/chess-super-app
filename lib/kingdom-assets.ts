// lib/kingdom-assets.ts

export const KINGDOM_ASSETS = {
    terrain: {
        grass: {
            base: '/assets/kingdom/terrain-grass.png',
            highlight: '/assets/kingdom/terrain-highlight.png',
        },
        snow: {
            base: '/assets/kingdom/terrain-snow.png',
            highlight: '/assets/kingdom/terrain-highlight.png',
        },
        lava: {
            base: '/assets/kingdom/terrain-lava.png',
            highlight: '/assets/kingdom/terrain-highlight.png',
        },
    },
    buildings: {
        economy: {
            gold_mine_lv1: '/assets/kingdom/mine-lvl1.png',
            mana_nexus_lv1: '/assets/kingdom/nexus-lvl1.png',
        },
        defense: {
            rook_tower_lv1: '/assets/kingdom/tower-lvl1.png',
        },
        decorative: {
            // Add decorative assets here
        },
    },
    obstacles: {
        rock_sm: '/assets/kingdom/rock.png',
        tree_oak: '/assets/kingdom/tree.png',
    },
    ui: {
        gold: '/assets/ui/icon-gold.png',
        mana: '/assets/ui/icon-mana.png',
    },
} as const;

export type KingdomAssetPath = string;
