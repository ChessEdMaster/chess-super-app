export interface HostProfile {
    username: string;
    avatar_url: string;
}

export interface Challenge {
    id: string;
    host_id: string;
    is_bot: boolean;
    bot_difficulty: string | null;
    player_color: string;
    rated: boolean;
    time_control_type: string;
    status: string;
    map_x: number;
    map_y: number;
    host?: HostProfile;
}
