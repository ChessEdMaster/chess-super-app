'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth, useRBAC } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { usePlayerStore } from '@/lib/store/player-store';
import { Trophy, Calendar, User, Swords, Loader2, LogOut, Shield, Zap, ShieldCheck, Brain, Activity, Settings, Edit2, Save, X, Globe, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useSocial } from '@/hooks/useSocial';
import { Feed } from '@/components/social/feed';

export function UserProfile() {
    const { user, loading: authLoading, signOut } = useAuth();
    const { checkPermission } = useRBAC();
    const { profile, saveProfile } = usePlayerStore();
    const router = useRouter();

    // Social Hook
    const { socialSettings, updateSettings } = useSocial();

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');

    // Calculate XP to next level (simple formula)
    const xpToNextLevel = profile.level * 1000;

    interface GameRecord {
        id: string;
        white_player_id: string | null;
        black_player_id: string | null;
        result: string;
        created_at: string;
        white?: { username: string };
        black?: { username: string };
    }

    const [games, setGames] = useState<GameRecord[]>([]);
    const [loadingGames, setLoadingGames] = useState(true);

    useEffect(() => {
        if (profile.username) {
            setEditUsername(profile.username);
        }
    }, [profile.username]);

    useEffect(() => {
        async function fetchGames() {
            if (!user) return;

            // Busquem partides on l'usuari sigui blanques O negres
            // I fem join amb profiles per obtenir els noms
            const { data, error } = await supabase
                .from('games')
                .select(`
          *,
          white:white_player_id(username),
          black:black_player_id(username)
        `)
                .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error carregant partides:', error);
            } else {
                setGames(data || []);
            }
            setLoadingGames(false);
        }

        if (user) fetchGames();
    }, [user]);

    const handleSaveProfile = async () => {
        if (!editUsername.trim()) {
            toast.error("El nom d'usuari no pot estar buit");
            return;
        }

        // Update local store (which syncs to DB via saveProfile)
        usePlayerStore.setState(state => ({
            profile: { ...state.profile, username: editUsername }
        }));

        await saveProfile();
        setIsEditing(false);
        toast.success("Perfil actualitzat correctament");
    };

    // Mentres comprovem l'usuari, mostrem càrrega
    if (authLoading || !user || loadingGames) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500">
                <Loader2 className="animate-spin mr-2" /> Verificant accés...
            </div>
        );
    }

    // Càlcul d'estadístiques simples
    const totalGames = games.length;
    const wins = games.filter(g =>
        (g.white_player_id === user.id && g.result === '1-0') ||
        (g.black_player_id === user.id && g.result === '0-1')
    ).length;
    const losses = games.filter(g =>
        (g.white_player_id === user.id && g.result === '0-1') ||
        (g.black_player_id === user.id && g.result === '1-0')
    ).length;
    const draws = totalGames - wins - losses;

    return (
        <div className="h-full w-full max-w-4xl mx-auto p-4 pb-24 overflow-y-auto">
            {/* Capçalera */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="text-indigo-500" /> El teu Perfil
                </h1>
                <div className="flex items-center gap-3">
                    {checkPermission('admin.all') && (
                        <Link href="/admin/users">
                            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition shadow-lg shadow-indigo-900/20 text-sm font-bold">
                                <Shield size={16} /> Panel Admin
                            </button>
                        </Link>
                    )}
                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-2 rounded-lg transition border border-red-500/30 text-sm font-bold"
                    >
                        <LogOut size={16} /> Tancar Sessió
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Columna Esquerra: Info Usuari */}
                <div className="md:col-span-1 space-y-6">
                    {/* Targeta d'Usuari */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-900/20 to-transparent"></div>

                        <div className="relative group mb-4">
                            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative w-32 h-32 bg-slate-900 rounded-full p-1 flex items-center justify-center overflow-hidden border-4 border-slate-800 shadow-2xl">
                                {user.user_metadata?.avatar_url ? (
                                    <Image
                                        src={user.user_metadata.avatar_url}
                                        alt="Avatar"
                                        width={128}
                                        height={128}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-slate-900 rounded-full p-1.5 border border-slate-700 text-amber-400 shadow-lg">
                                <Trophy size={16} fill="currentColor" />
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="flex items-center gap-2 mb-2 w-full">
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-white text-center w-full focus:outline-none focus:border-indigo-500"
                                    autoFocus
                                />
                                <button onClick={handleSaveProfile} className="p-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white">
                                    <Save size={16} />
                                </button>
                                <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-2xl font-black text-white">{profile.username || user.user_metadata?.full_name || 'Jugador'}</h2>
                                <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-indigo-400 transition">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}

                        <p className="text-slate-400 font-medium text-sm mb-4">Nivell {profile.level}</p>

                        {/* XP Bar */}
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${Math.min((profile.xp / xpToNextLevel) * 100, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 w-full flex justify-between">
                            <span>{profile.xp} XP</span>
                            <span>{xpToNextLevel} XP</span>
                        </p>
                    </div>

                    {/* Configuració */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Settings size={20} className="text-slate-400" /> Configuració
                        </h3>

                        <div className="space-y-4">
                            {/* Language */}
                            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <Globe size={18} className="text-indigo-400" />
                                    <span className="text-sm font-medium text-slate-300">Idioma</span>
                                </div>
                                <select
                                    value={profile.settings?.language || 'ca'}
                                    onChange={(e) => {
                                        const newLang = e.target.value as 'ca' | 'es' | 'en';
                                        usePlayerStore.setState(state => ({
                                            profile: {
                                                ...state.profile,
                                                settings: { ...state.profile.settings!, language: newLang }
                                            }
                                        }));
                                        saveProfile();
                                        toast.success("Idioma actualitzat");
                                    }}
                                    className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="ca">Català</option>
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

                            {/* Notifications */}
                            <div
                                onClick={() => {
                                    const newNotif = !profile.settings?.notifications;
                                    usePlayerStore.setState(state => ({
                                        profile: {
                                            ...state.profile,
                                            settings: { ...state.profile.settings!, notifications: newNotif }
                                        }
                                    }));
                                    saveProfile();
                                    toast.success(`Notificacions ${newNotif ? 'activades' : 'desactivades'}`);
                                }}
                                className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 cursor-pointer hover:bg-slate-900/50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Bell size={18} className={profile.settings?.notifications ? "text-indigo-400" : "text-slate-600"} />
                                    <span className="text-sm font-medium text-slate-300">Notificacions</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${profile.settings?.notifications ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${profile.settings?.notifications ? 'left-5' : 'left-1'}`}></div>
                                </div>
                            </div>

                            {/* Social Privacy Settings */}
                            {socialSettings && (
                                <>
                                    <div className="h-px bg-slate-800 my-2"></div>

                                    {/* Privacy Level */}
                                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <Shield size={18} className="text-emerald-400" />
                                            <span className="text-sm font-medium text-slate-300">Privacitat del Perfil</span>
                                        </div>
                                        <select
                                            value={socialSettings.privacy_level}
                                            onChange={(e) => updateSettings({ privacy_level: e.target.value as any })}
                                            className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="public">Públic</option>
                                            <option value="friends_only">Només Amics</option>
                                            <option value="private">Privat</option>
                                        </select>
                                    </div>

                                    {/* Show Online Status */}
                                    <div
                                        onClick={() => updateSettings({ show_online_status: !socialSettings.show_online_status })}
                                        className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 cursor-pointer hover:bg-slate-900/50 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Activity size={18} className={socialSettings.show_online_status ? "text-green-400" : "text-slate-600"} />
                                            <span className="text-sm font-medium text-slate-300">Mostrar Estat Online</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${socialSettings.show_online_status ? 'bg-green-600' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${socialSettings.show_online_status ? 'left-5' : 'left-1'}`}></div>
                                        </div>
                                    </div>

                                    {/* Allow Friend Requests */}
                                    <div
                                        onClick={() => updateSettings({ allow_friend_requests: !socialSettings.allow_friend_requests })}
                                        className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 cursor-pointer hover:bg-slate-900/50 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <User size={18} className={socialSettings.allow_friend_requests ? "text-blue-400" : "text-slate-600"} />
                                            <span className="text-sm font-medium text-slate-300">Acceptar Sol·licituds</span>
                                        </div>
                                        <div className={`w-8 h-4 rounded-full relative transition-colors ${socialSettings.allow_friend_requests ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${socialSettings.allow_friend_requests ? 'left-5' : 'left-1'}`}></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Dreta: Stats i Historial */}
                <div className="md:col-span-2 space-y-8">



                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                            <Zap className="text-amber-400 mb-2" size={24} />
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Agressivitat</span>
                            <span className="text-xl font-black text-white">{profile.attributes.AGGRESSION}</span>
                        </div>
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                            <ShieldCheck className="text-emerald-400 mb-2" size={24} />
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Solidesa</span>
                            <span className="text-xl font-black text-white">{profile.attributes.SOLIDITY}</span>
                        </div>
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                            <Brain className="text-blue-400 mb-2" size={24} />
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Coneixement</span>
                            <span className="text-xl font-black text-white">{profile.attributes.KNOWLEDGE}</span>
                        </div>
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
                            <Activity className="text-purple-400 mb-2" size={24} />
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Velocitat</span>
                            <span className="text-xl font-black text-white">{profile.attributes.SPEED}</span>
                        </div>
                    </div>

                    {/* Social Wall */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-slate-400" /> Activity Wall
                        </h3>
                        <Feed userId={user.id} limit={3} />
                    </div>

                    {/* Historial de Partides */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Swords size={20} className="text-slate-400" /> Historial Recent
                        </h3>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                            {games.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    Encara no has jugat cap partida.
                                    <Link href="/play" className="text-indigo-400 hover:underline ml-1">Juga ara!</Link>
                                </div>
                            ) : (
                                <>
                                    <div className="divide-y divide-slate-800">
                                        {games.slice(0, 5).map((game) => {
                                            const isWhite = game.white_player_id === user.id;
                                            // Determinar nom del rival
                                            let opponentName = 'Stockfish (CPU)';
                                            if (isWhite) {
                                                if (game.black_player_id) opponentName = game.black?.username || 'Jugador 2';
                                            } else {
                                                if (game.white_player_id) opponentName = game.white?.username || 'Jugador 1';
                                            }

                                            // Determinem si has guanyat tu
                                            let outcomeColor = 'text-slate-400';
                                            let outcomeLabel = 'Taules';

                                            if (game.result === '1/2-1/2') {
                                                outcomeLabel = '🤝 Taules';
                                                outcomeColor = 'text-slate-400';
                                            } else if ((isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1')) {
                                                outcomeLabel = '🏆 Victòria';
                                                outcomeColor = 'text-emerald-400';
                                            } else {
                                                outcomeLabel = '❌ Derrota';
                                                outcomeColor = 'text-red-400';
                                            }

                                            return (
                                                <div
                                                    key={game.id}
                                                    onClick={() => router.push(`/analysis?gameId=${game.id}`)}
                                                    className="p-4 hover:bg-slate-800/50 transition flex flex-col sm:flex-row justify-between items-center gap-4 cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                                        <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg ${isWhite ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>
                                                            {isWhite ? 'W' : 'B'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">vs {opponentName}</p>
                                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Calendar size={12} /> {new Date(game.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                                        <div className="text-right">
                                                            <p className={`font-bold ${outcomeColor}`}>{outcomeLabel}</p>
                                                            <p className="text-xs text-slate-600 font-mono">{game.result}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {games.length > 5 && (
                                        <div className="p-3 bg-slate-900/50 text-center border-t border-slate-800">
                                            <Link href="/profile/games" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                                                Veure totes les partides ({games.length})
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
