export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            academy_achievements: {
                Row: {
                    created_at: string | null
                    description: string
                    icon: string
                    id: string
                    requirement: Json
                    title: string
                }
                Insert: {
                    created_at?: string | null
                    description: string
                    icon: string
                    id?: string
                    requirement: Json
                    title: string
                }
                Update: {
                    created_at?: string | null
                    description?: string
                    icon?: string
                    id?: string
                    requirement?: Json
                    title?: string
                }
                Relationships: []
            }
            academy_courses: {
                Row: {
                    created_at: string | null
                    description: string | null
                    difficulty_level: string | null
                    id: string
                    image_url: string | null
                    published: boolean | null
                    settings: Json | null
                    slug: string
                    subject: string | null
                    subject_tags: string[] | null
                    target_grade: string | null
                    title: string
                    track: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    difficulty_level?: string | null
                    id?: string
                    image_url?: string | null
                    published?: boolean | null
                    settings?: Json | null
                    slug: string
                    subject?: string | null
                    subject_tags?: string[] | null
                    target_grade?: string | null
                    title: string
                    track?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    difficulty_level?: string | null
                    id?: string
                    image_url?: string | null
                    published?: boolean | null
                    settings?: Json | null
                    slug?: string
                    subject?: string | null
                    subject_tags?: string[] | null
                    target_grade?: string | null
                    title?: string
                    track?: string | null
                }
                Relationships: []
            }
            academy_lessons: {
                Row: {
                    content: Json
                    created_at: string | null
                    description: string | null
                    duration_minutes: number
                    id: string
                    module_id: string
                    order_index: number
                    published: boolean | null
                    title: string
                    type: string
                    video_url: string | null
                }
                Insert: {
                    content?: Json
                    created_at?: string | null
                    description?: string | null
                    duration_minutes?: number
                    id?: string
                    module_id: string
                    order_index?: number
                    published?: boolean | null
                    title: string
                    type?: string
                    video_url?: string | null
                }
                Update: {
                    content?: Json
                    created_at?: string | null
                    description?: string | null
                    duration_minutes?: number
                    id?: string
                    module_id?: string
                    order_index?: number
                    published?: boolean | null
                    title?: string
                    type?: string
                    video_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "academy_lessons_module_id_fkey"
                        columns: ["module_id"]
                        isOneToOne: false
                        referencedRelation: "academy_modules"
                        referencedColumns: ["id"]
                    },
                ]
            }
            academy_modules: {
                Row: {
                    course_id: string
                    created_at: string | null
                    description: string | null
                    id: string
                    order_index: number
                    published: boolean | null
                    title: string
                }
                Insert: {
                    course_id: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    order_index?: number
                    published?: boolean | null
                    title: string
                }
                Update: {
                    course_id?: string
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    order_index?: number
                    published?: boolean | null
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "academy_modules_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "academy_courses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            academy_progress: {
                Row: {
                    completed: boolean | null
                    completed_at: string | null
                    course_id: string
                    id: string
                    last_accessed_at: string | null
                    lesson_id: string
                    started_at: string | null
                    user_id: string
                }
                Insert: {
                    completed?: boolean | null
                    completed_at?: string | null
                    course_id: string
                    id?: string
                    last_accessed_at?: string | null
                    lesson_id: string
                    started_at?: string | null
                    user_id: string
                }
                Update: {
                    completed?: boolean | null
                    completed_at?: string | null
                    course_id?: string
                    id?: string
                    last_accessed_at?: string | null
                    lesson_id?: string
                    started_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "academy_progress_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "academy_courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "academy_progress_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "academy_lessons"
                        referencedColumns: ["id"]
                    },
                ]
            }
            challenges: {
                Row: {
                    bot_difficulty: string | null
                    created_at: string | null
                    host_id: string | null
                    id: string
                    is_bot: boolean | null
                    map_x: number | null
                    map_y: number | null
                    player_color: string
                    rated: boolean | null
                    status: string | null
                    time_control_type: string
                }
                Insert: {
                    bot_difficulty?: string | null
                    created_at?: string | null
                    host_id?: string | null
                    id?: string
                    is_bot?: boolean | null
                    map_x?: number | null
                    map_y?: number | null
                    player_color: string
                    rated?: boolean | null
                    status?: string | null
                    time_control_type: string
                }
                Update: {
                    bot_difficulty?: string | null
                    created_at?: string | null
                    host_id?: string | null
                    id?: string
                    is_bot?: boolean | null
                    map_x?: number | null
                    map_y?: number | null
                    player_color?: string
                    rated?: boolean | null
                    status?: string | null
                    time_control_type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "fk_challenges_profiles"
                        columns: ["host_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            club_members: {
                Row: {
                    club_id: string
                    id: string
                    joined_at: string
                    role: string
                    user_id: string
                }
                Insert: {
                    club_id: string
                    id?: string
                    joined_at?: string
                    role: string
                    user_id: string
                }
                Update: {
                    club_id?: string
                    id?: string
                    joined_at?: string
                    role?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "club_members_club_id_fkey"
                        columns: ["club_id"]
                        isOneToOne: false
                        referencedRelation: "clubs"
                        referencedColumns: ["id"]
                    },
                ]
            }
            club_posts: {
                Row: {
                    author_id: string
                    club_id: string
                    content: string
                    created_at: string
                    id: string
                    title: string
                    updated_at: string
                }
                Insert: {
                    author_id: string
                    club_id: string
                    content: string
                    created_at?: string
                    id?: string
                    title: string
                    updated_at?: string
                }
                Update: {
                    author_id?: string
                    club_id?: string
                    content?: string
                    created_at?: string
                    id?: string
                    title?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "club_posts_club_id_fkey"
                        columns: ["club_id"]
                        isOneToOne: false
                        referencedRelation: "clubs"
                        referencedColumns: ["id"]
                    },
                ]
            }
            club_private_info: {
                Row: {
                    bank_account: string | null
                    club_id: string
                    contact_email: string | null
                    created_at: string | null
                    id: string
                    revenue_data: Json | null
                    tax_id: string | null
                }
                Insert: {
                    bank_account?: string | null
                    club_id: string
                    contact_email?: string | null
                    created_at?: string | null
                    id?: string
                    revenue_data?: Json | null
                    tax_id?: string | null
                }
                Update: {
                    bank_account?: string | null
                    club_id?: string
                    contact_email?: string | null
                    created_at?: string | null
                    id?: string
                    revenue_data?: Json | null
                    tax_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "club_private_info_club_id_fkey"
                        columns: ["club_id"]
                        isOneToOne: true
                        referencedRelation: "clubs"
                        referencedColumns: ["id"]
                    },
                ]
            }
            clubs: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    logo_url: string | null
                    name: string
                    owner_id: string
                    settings: Json | null
                    slug: string
                    type: Database["public"]["Enums"]["club_type"]
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    logo_url?: string | null
                    name: string
                    owner_id: string
                    settings?: Json | null
                    slug: string
                    type?: Database["public"]["Enums"]["club_type"]
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string
                    owner_id?: string
                    settings?: Json | null
                    slug?: string
                    type?: Database["public"]["Enums"]["club_type"]
                }
                Relationships: []
            }
            games: {
                Row: {
                    black_player_id: string
                    black_time: number
                    created_at: string | null
                    fen: string
                    id: string
                    last_move_at: string | null
                    pgn: string | null
                    status: string
                    white_player_id: string
                    white_time: number
                    winner_id: string | null
                }
                Insert: {
                    black_player_id: string
                    black_time: number
                    created_at?: string | null
                    fen: string
                    id: string
                    last_move_at?: string | null
                    pgn?: string | null
                    status: string
                    white_player_id: string
                    white_time: number
                    winner_id?: string | null
                }
                Update: {
                    black_player_id?: string
                    black_time?: number
                    created_at?: string | null
                    fen?: string
                    id?: string
                    last_move_at?: string | null
                    pgn?: string | null
                    status?: string
                    white_player_id?: string
                    white_time?: number
                    winner_id?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    elo_blitz: number | null
                    elo_bullet: number | null
                    elo_rapid: number | null
                    full_name: string | null
                    id: string
                    updated_at: string | null
                    username: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    elo_blitz?: number | null
                    elo_bullet?: number | null
                    elo_rapid?: number | null
                    full_name?: string | null
                    id: string
                    updated_at?: string | null
                    username?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    elo_blitz?: number | null
                    elo_bullet?: number | null
                    elo_rapid?: number | null
                    full_name?: string | null
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                }
                Relationships: []
            }
            social_comments: {
                Row: {
                    author_id: string
                    content: string
                    created_at: string | null
                    id: string
                    post_id: string
                    updated_at: string | null
                }
                Insert: {
                    author_id: string
                    content: string
                    created_at?: string | null
                    id?: string
                    post_id: string
                    updated_at?: string | null
                }
                Update: {
                    author_id?: string
                    content?: string
                    created_at?: string | null
                    id?: string
                    post_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "social_comments_post_id_fkey"
                        columns: ["post_id"]
                        isOneToOne: false
                        referencedRelation: "social_posts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            social_follows: {
                Row: {
                    created_at: string | null
                    follower_id: string
                    following_id: string
                    id: string
                }
                Insert: {
                    created_at?: string | null
                    follower_id: string
                    following_id: string
                    id?: string
                }
                Update: {
                    created_at?: string | null
                    follower_id?: string
                    following_id?: string
                    id?: string
                }
                Relationships: []
            }
            social_posts: {
                Row: {
                    content: string
                    created_at: string | null
                    id: string
                    image_url: string | null
                    likes_count: number | null
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    content: string
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    likes_count?: number | null
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    content?: string
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    likes_count?: number | null
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "fk_social_posts_profiles"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_module_progress: {
                Row: {
                    best_score: number | null
                    completed: boolean | null
                    completed_at: string | null
                    id: string
                    last_accessed_at: string | null
                    module_id: string
                    self_evaluation: string | null
                    user_id: string
                }
                Insert: {
                    best_score?: number | null
                    completed?: boolean | null
                    completed_at?: string | null
                    id?: string
                    last_accessed_at?: string | null
                    module_id: string
                    self_evaluation?: string | null
                    user_id: string
                }
                Update: {
                    best_score?: number | null
                    completed?: boolean | null
                    completed_at?: string | null
                    id?: string
                    last_accessed_at?: string | null
                    module_id?: string
                    self_evaluation?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_module_progress_module_id_fkey"
                        columns: ["module_id"]
                        isOneToOne: false
                        referencedRelation: "academy_modules"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            update_avatar: {
                Args: {
                    avatar_url: string
                }
                Returns: undefined
            }
            update_profile: {
                Args: {
                    username: string
                    full_name: string
                }
                Returns: undefined
            }
        }
        Enums: {
            club_type: "online" | "physical_club" | "school"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (
        (Database[PublicTableNameOrOptions["schema"]] extends { Tables: unknown }
            ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
            : unknown)
        &
        (Database[PublicTableNameOrOptions["schema"]] extends { Views: unknown }
            ? Database[PublicTableNameOrOptions["schema"]]["Views"]
            : unknown)
    )
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (
        (Database[PublicTableNameOrOptions["schema"]] extends { Tables: unknown }
            ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
            : unknown)
        &
        (Database[PublicTableNameOrOptions["schema"]] extends { Views: unknown }
            ? Database[PublicTableNameOrOptions["schema"]]["Views"]
            : unknown)
    )[TableName] extends {
        Row: infer R
    }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] extends { Tables: unknown }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never)
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] extends { Tables: unknown }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never)[TableName] extends {
            Insert: infer I
        }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]] extends { Tables: unknown }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never)
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]] extends { Tables: unknown }
        ? Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never)[TableName] extends {
            Update: infer U
        }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof (Database[DefaultSchemaEnumNameOrOptions["schema"]] extends { Enums: unknown }
        ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never)
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
}
    ? (Database[DefaultSchemaEnumNameOrOptions["schema"]] extends { Enums: unknown }
        ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
        : never)[EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof (Database[PublicCompositeTypeNameOrOptions["schema"]] extends { CompositeTypes: unknown }
        ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never)
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
}
    ? (Database[PublicCompositeTypeNameOrOptions["schema"]] extends { CompositeTypes: unknown }
        ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
        : never)[CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            club_type: ["online", "physical_club", "school"],
        },
    },
} as const
