export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: FriendRequestStatus;
    created_at: string;
    updated_at: string;
    sender?: {
        username: string;
        avatar_url?: string;
    };
    receiver?: {
        username: string;
        avatar_url?: string;
    };
}

export interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    created_at: string;
    friend?: {
        username: string;
        avatar_url?: string;
        status?: 'online' | 'offline' | 'in-game';
    };
}

export interface UserSocialSettings {
    user_id: string;
    privacy_level: 'public' | 'friends_only' | 'private';
    show_online_status: boolean;
    allow_friend_requests: boolean;
    updated_at: string;
}

export interface SocialProfile {
    id: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    social_settings?: UserSocialSettings;
}
