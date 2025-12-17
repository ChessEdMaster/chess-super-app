'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Loader2, User, Trophy, Shield, Swords, Calendar, Lock } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

function ThemeOption({ title, description, value, currentTheme }: { title: string, description: string, value: 'light' | 'clash', currentTheme: string }) {
    const { setTheme } = useTheme();
    const isActive = currentTheme === value;

    return (
        <button
            onClick={() => setTheme(value)}
            className={cn(
                "p-4 rounded-xl border text-left transition-all relative overflow-hidden group",
                isActive
                    ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500"
                    : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
            )}
        >
            <div className="flex justify-between items-start mb-2">
                <span className={cn("font-bold text-lg", isActive ? "text-amber-500" : "text-zinc-300")}>{title}</span>
                {isActive && <div className="bg-amber-500 text-black p-1 rounded-full"><Check size={14} strokeWidth={3} /></div>}
            </div>
            <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">{description}</p>
        </button>
    );
}

interface PublicProfileData {
    id: string;
    username: string;
    avatar_url?: string;
    level: number;
    xp: number;
    attributes: any;
    created_at: string;
    settings?: {
        theme?: 'light' | 'clash';
    };
}

interface SocialSettings {
    privacy_level: 'public' | 'friends_only' | 'private';
    show_online_status: boolean;
}

export default function PublicProfilePage() {
    const params = useParams();
    const userId = params.id as string;
    const { user } = useAuth();

    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [settings, setSettings] = useState<SocialSettings | null>(null);
    const [isFriend, setIsFriend] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            if (!userId) return;
            setLoading(true);

            try {
                // 1. Load Settings
                const { data: settingsData } = await supabase
                    .from('user_social_settings')
                    .select('privacy_level, show_online_status')
                    .eq('user_id', userId)
                    .single();

                const privacy = settingsData?.privacy_level || 'public';
                setSettings(settingsData);

                // 2. Check Friendship if needed
                let areFriends = false;
                if (user) {
                    const { data: friendData } = await supabase
                        .from('friends')
                        .select('id')
                        .match({ user_id: user.id, friend_id: userId })
                        .single();
                    areFriends = !!friendData;
                    setIsFriend(areFriends);
                }

                // 3. Check Access
                if (privacy === 'private' && user?.id !== userId) {
                    setError('This profile is private.');
                    setLoading(false);
                    return;
                }

                if (privacy === 'friends_only' && !areFriends && user?.id !== userId) {
                    setError('This profile is only visible to friends.');
                    setLoading(false);
                    return;
                }

                // 4. Load Profile Data
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileError) throw profileError;
                setProfile(profileData);

            } catch (err) {
                console.error('Error loading profile:', err);
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, [userId, user]);

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500">
                <Loader2 className="animate-spin mr-2" /> Loading Profile...
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 gap-4">
                <Lock size={48} className="opacity-20" />
                <p>{error || 'Profile not found'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-zinc-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-900/20 to-transparent"></div>

                    {/* Avatar */}
                    <div className="relative z-10">
                        <div className="w-32 h-32 bg-zinc-800 rounded-full border-4 border-zinc-900 shadow-xl flex items-center justify-center overflow-hidden">
                            {profile.avatar_url ? (
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-4xl font-bold text-zinc-500">{profile.username[0].toUpperCase()}</span>
                            )}
                        </div>
                        {settings?.show_online_status && (
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-zinc-900 rounded-full" title="Online"></div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left z-10">
                        <h1 className="text-3xl font-black text-white mb-2">{profile.username}</h1>
                        <p className="text-zinc-400 mb-4 flex items-center justify-center md:justify-start gap-2">
                            <Trophy size={16} className="text-yellow-500" /> Level {profile.level}
                            <span className="mx-2">•</span>
                            <span className="text-zinc-500">Member since {new Date(profile.created_at).getFullYear()}</span>
                        </p>

                        {user?.id !== userId && !isFriend && (
                            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
                                Add Friend
                            </button>
                        )}
                        {isFriend && (
                            <span className="bg-green-900/30 text-green-400 px-4 py-1 rounded-full text-sm font-bold border border-green-500/30">
                                Friend
                            </span>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    {profile.attributes && Object.entries(profile.attributes).map(([key, value]) => (
                        <div key={key} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex flex-col items-center">
                            <span className="text-[10px] text-zinc-500 font-bold tracking-wide mb-1">{key}</span>
                            <span className="text-2xl font-black text-white">{value as React.ReactNode}</span>
                        </div>
                    ))}
                </div>

                {/* Theme Selector (Only for Owner) */}
                {user?.id === userId && (
                    <div className="mt-8 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            🎨 App Theme
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ThemeOption
                                title="Professional Light"
                                description="Clean, modern, and professional (Default)"
                                value="light"
                                currentTheme={profile.settings?.theme || 'light'}
                            />
                            <ThemeOption
                                title="Clash Royale Mode"
                                description="Immersive dark gaming aesthetic"
                                value="clash"
                                currentTheme={profile.settings?.theme || 'light'}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
