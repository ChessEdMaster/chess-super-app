export type ClubType = 'online' | 'physical_club' | 'school';

export interface ClubAddress {
    street?: string;
    city?: string;
    zip?: string;
    country?: string;
}

// Estructura de la informació privada (Fiscal)
export interface ClubPrivateInfo {
    club_id: string;
    legal_name: string | null;
    tax_id: string | null;
    billing_email: string | null;
    address_info: ClubAddress;
    subscription_plan: 'free' | 'pro' | 'enterprise';
}

// Actualització de la interfície principal
export interface Club {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    owner_id: string;
    // Nous camps
    type: ClubType;
    parent_id?: string | null; // For Super Clans / Schools
    settings: {
        allow_chat: boolean;
        require_approval: boolean;
        [key: string]: any;
    };
    created_at: string;
}

export interface ClubStudent {
    id: string;
    club_id: string;
    first_name: string;
    last_name?: string;
    group_identifier?: string;
    notes?: string;
    elo: number;
    puzzle_rating: number;
    created_at: string;
}
