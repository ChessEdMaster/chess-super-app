// lib/kingdom-assets.ts

export const KINGDOM_ASSETS = {
    terrain: {
        grass: {
            base: '/assets/kingdom/terrain/grass/tile_base.png',
            highlight: '/assets/kingdom/terrain/grass/tile_highlight.png',
        },
        snow: {
            base: '/assets/kingdom/terrain/snow/tile_base.png',
            highlight: '/assets/kingdom/terrain/snow/tile_highlight.png',
        },
        lava: {
            base: '/assets/kingdom/terrain/lava/tile_base.png',
            highlight: '/assets/kingdom/terrain/lava/tile_highlight.png',
        },
    },
    buildings: {
        economy: {
            gold_mine_lv1: '/assets/kingdom/buildings/economy/gold_mine_lv1.png',
            mana_nexus_lv1: '/assets/kingdom/buildings/economy/mana_nexus_lv1.png',
        },
        defense: {
            rook_tower_lv1: '/assets/kingdom/buildings/defense/rook_tower_lv1.png',
        },
        decorative: {
            // Add decorative assets here
        },
    },
    obstacles: {
        rock_sm: '/assets/kingdom/obstacles/rock_sm.png',
        tree_oak: '/assets/kingdom/obstacles/tree_oak.png',
    },
    ui: {
        gold: '/assets/kingdom/ui/icons/gold.png',
        mana: '/assets/kingdom/ui/icons/mana.png',
    },
} as const;

export type KingdomAssetPath = string;
