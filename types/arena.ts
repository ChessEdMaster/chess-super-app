export type ArenaVariant = 'bullet' | 'blitz' | 'rapid';

export interface ArenaProgress {
    id: string;
    user_id: string;
    variant: ArenaVariant;
    current_cups: number;
    highest_cups: number;
    chests_claimed: string[]; // IDs of chests claimed on the path
    gatekeepers_defeated: number[]; // Tiers where the boss has been defeated (1, 2, 3)
    created_at?: string;
    updated_at?: string;
}

export interface ArenaTierInfo {
    tier: number;
    name: string;
    minCups: number;
    maxCups: number;
    bossName: string;
    bossAvatar: string; // Path to avatar image
    bossRating: number; // Approximate Elo strength of the bot
}

export const ARENA_TIERS: ArenaTierInfo[] = [
    {
        tier: 1,
        name: 'Novice Grounds',
        minCups: 0,
        maxCups: 250,
        bossName: 'Gatekeeper Pawn',
        bossAvatar: '/bots/pawn-boss.png',
        bossRating: 400
    },
    {
        tier: 2,
        name: 'Knight\'s Outpost',
        minCups: 250,
        maxCups: 500,
        bossName: 'Gatekeeper Knight',
        bossAvatar: '/bots/knight-boss.png',
        bossRating: 800
    },
    {
        tier: 3,
        name: 'Bishop\'s Sanctum',
        minCups: 500,
        maxCups: 750,
        bossName: 'Gatekeeper Bishop',
        bossAvatar: '/bots/bishop-boss.png',
        bossRating: 1200
    },
    {
        tier: 4,
        name: 'Royal Court',
        minCups: 750,
        maxCups: 1000,
        bossName: 'Gatekeeper Queen',
        bossAvatar: '/bots/queen-boss.png',
        bossRating: 1600
    }
];

export interface ArenaRewardNode {
    cups: number;
    type: 'CHEST' | 'GATEKEEPER' | 'START' | 'END';
    chestId?: string;
    chestType?: 'WOODEN' | 'SILVER' | 'GOLDEN' | 'LEGENDARY';
    isClaimed?: boolean; // Client-side helper
    isLocked?: boolean; // Client-side helper
}

// Helper to generate the static path nodes
export const generateArenaPath = (): ArenaRewardNode[] => {
    const nodes: ArenaRewardNode[] = [];

    // Start
    nodes.push({ cups: 0, type: 'START' });

    // Generate chests every 50 cups
    for (let cups = 50; cups < 1000; cups += 50) {
        // Skip if it overlaps with a gatekeeper (250, 500, 750)
        if (cups % 250 === 0) continue;

        let chestType: 'WOODEN' | 'SILVER' | 'GOLDEN' | 'LEGENDARY' = 'WOODEN';
        if (cups % 200 === 0) chestType = 'GOLDEN';
        else if (cups % 100 === 0) chestType = 'SILVER';

        nodes.push({
            cups,
            type: 'CHEST',
            chestId: `chest_${cups}`,
            chestType
        });
    }

    // Gatekeepers
    nodes.push({ cups: 250, type: 'GATEKEEPER' });
    nodes.push({ cups: 500, type: 'GATEKEEPER' });
    nodes.push({ cups: 750, type: 'GATEKEEPER' });

    // End
    nodes.push({ cups: 1000, type: 'END' });

    return nodes.sort((a, b) => a.cups - b.cups);
};
