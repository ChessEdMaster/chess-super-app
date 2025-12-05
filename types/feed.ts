export type MediaType = 'image' | 'video' | 'gif' | 'none';

export interface SocialPost {
    id: string;
    user_id: string;
    content: string | null;
    media_url?: string;
    media_type: MediaType;
    game_id?: string;
    fen?: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    created_at: string;
    profiles?: {
        username: string;
        avatar_url?: string;
    };
    liked_by_user?: boolean; // Virtual field for UI
}

export interface SocialComment {
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        username: string;
        avatar_url?: string;
    };
}

export type ClubType = 'online' | 'club' | 'school';

export interface Club {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    banner_url?: string;
    owner_id: string;
    is_public: boolean;
    member_count: number;
    type: ClubType;
    verified: boolean;
    address?: string;
    website?: string;
    created_at: string;
}
