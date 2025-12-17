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
import { useSettings } from '@/lib/settings';
import { ImageIcon } from 'lucide-react';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { useTheme } from '@/components/theme-provider';
import { Palette } from 'lucide-react';

function BackgroundSelector() {
    const { backgroundImage, setBackgroundImage } = useSettings();
    const [backgrounds, setBackgrounds] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && backgrounds.length === 0) {
            fetch('/api/backgrounds')
                .then(res => res.json())
                .then(data => {
                    if (data.files) setBackgrounds(data.files);
                })
                .catch(err => console.error("Error fetching backgrounds", err));
        }
    }, [isOpen]);

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800 transition"
            >
                <div className="flex items-center gap-3">
                    <ImageIcon size={18} className="text-purple-400" />
                    <span className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Fons de Pantalla</span>
                </div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-2">
                    {backgroundImage ? 'Personalitzat' : 'Per defecte'}
                    {isOpen ? <X size={14} /> : <Edit2 size={14} />}
                </div>
            </div>

            {isOpen && (
                <div className="p-3 border-t border-zinc-800 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {backgrounds.map((bg) => (
                        <div
                            key={bg}
                            onClick={() => setBackgroundImage(bg)}
                            className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition hover:scale-105 ${backgroundImage === bg ? 'border-purple-500' : 'border-zinc-800'}`}
                        >
                            <Image src={bg} alt="bg" fill className="object-cover" sizes="150px" />
                        </div>
                    ))}
                    {backgrounds.length === 0 && (
                        <div className="col-span-2 text-center text-xs text-zinc-500 py-4 font-medium uppercase">
                            Carregant fons...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function UserProfile() {
    const { user, loading: authLoading, signOut } = useAuth();
    const { checkPermission } = useRBAC();
    const { profile, saveProfile } = usePlayerStore();
    const router = useRouter();
    const { setTheme } = useTheme();

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
            <div className="h-full flex items-center justify-center text-zinc-500">
                <Loader2 className="animate-spin mr-2" /> <span className="uppercase font-bold tracking-widest text-xs">Verificant accés...</span>
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
        <div className="h-full w-full max-w-5xl mx-auto p-4 md:p-8 pb-24 overflow-y-auto">
            {/* Capçalera */}
            <Panel className="flex flex-col md:flex-row items-center justify-between p-6 mb-8 gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <h1 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-wider font-display text-stroke">
                    <User className="text-white drop-shadow-md" size={32} /> El teu Perfil
                </h1>
                <div className="flex flex-wrap justify-center items-center gap-3">
                    {checkPermission('admin.all') && (
                        <Link href="/admin/users">
                            <ShinyButton variant="secondary" className="px-4 py-2">
                                <Shield size={16} className="mr-2" /> Panel Admin
                            </ShinyButton>
                        </Link>
                    )}
                    <ShinyButton variant="danger" onClick={signOut} className="px-4 py-2 opacity-80 hover:opacity-100">
                        <LogOut size={16} className="mr-2" /> Tancar Sessió
                    </ShinyButton>
                </div>
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Columna Esquerra: Info Usuari */}
                <div className="md:col-span-1 space-y-6">
                    {/* Targeta d'Usuari */}
                    <GameCard variant="default" className="flex flex-col items-center text-center relative overflow-hidden p-0 border-zinc-700">
                        {/* Banner Background */}
                        <div className="w-full h-32 bg-gradient-to-b from-indigo-900 via-indigo-950 to-zinc-950/0 relative">
                            <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-10"></div>
                        </div>

                        <div className="relative -mt-16 mb-4 group">
                            {/* Avatar Glow */}
                            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500 animate-spin-slow"></div>
                            <div className="relative w-32 h-32 bg-zinc-950 rounded-full p-1.5 flex items-center justify-center overflow-hidden border-4 border-zinc-800 shadow-2xl z-10">
                                {user.user_metadata?.avatar_url ? (
                                    <Image
                                        src={user.user_metadata.avatar_url}
                                        alt="Avatar"
                                        width={128}
                                        height={128}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-4xl font-black text-white font-display">
                                        {user.email?.[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-1 right-1 bg-zinc-900 rounded-full p-2 border-2 border-amber-500 text-amber-500 shadow-lg z-20">
                                <Trophy size={16} fill="currentColor" />
                            </div>
                        </div>

                        <div className="w-full px-6 pb-6">
                            {isEditing ? (
                                <div className="flex items-center gap-2 mb-2 w-full">
                                    <input
                                        type="text"
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        className="bg-zinc-950 border-2 border-indigo-500/50 rounded-xl px-3 py-2 text-white text-center w-full focus:outline-none focus:border-indigo-500 font-bold"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveProfile} className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-900/20 active:translate-y-0.5 transition-all outline-none">
                                        <Save size={18} />
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-white shadow-lg active:translate-y-0.5 transition-all outline-none">
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <h2 className="text-2xl font-black text-white font-display uppercase tracking-wide text-stroke shadow-black drop-shadow-md">
                                        {profile.username || user.user_metadata?.full_name || 'Jugador'}
                                    </h2>
                                    <button onClick={() => setIsEditing(true)} className="text-zinc-500 hover:text-indigo-400 transition-colors bg-zinc-900/50 p-1.5 rounded-lg">
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            )}

                            <p className="text-amber-500 font-black uppercase text-xs tracking-[0.2em] mb-4">Level {profile.level}</p>

                            {/* XP Bar */}
                            <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden mb-2 border border-zinc-700 shadow-inner relative">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${Math.min((profile.xp / xpToNextLevel) * 100, 100)}%` }}
                                />
                                <div className="absolute inset-0 bg-[url('/patterns/stripes.png')] opacity-20 bg-repeat-x animate-slide"></div>
                            </div>
                            <p className="text-[10px] text-zinc-400 font-bold w-full flex justify-between uppercase tracking-wider">
                                <span>{profile.xp} XP</span>
                                <span>{xpToNextLevel} XP</span>
                            </p>
                        </div>
                    </GameCard>

                    {/* Configuració */}
                    <Panel className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wide font-display text-stroke">
                            <Settings size={20} className="text-zinc-400" /> Configuració
                        </h3>

                        <div className="space-y-3">
                            {/* Language */}
                            <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Globe size={18} className="text-indigo-400" />
                                    <span className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Idioma</span>
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
                                    className="bg-zinc-950 border border-zinc-700 rounded-lg text-xs px-2 py-1 text-zinc-300 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                                >
                                    <option value="ca">Català</option>
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                </select>
                            </div>

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
                                className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm cursor-pointer hover:bg-zinc-800 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Bell size={18} className={profile.settings?.notifications ? "text-indigo-400" : "text-zinc-600"} />
                                    <span className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Notificacions</span>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors border border-transparent ${profile.settings?.notifications ? 'bg-indigo-600 border-indigo-400' : 'bg-zinc-700 border-zinc-600'}`}>
                                    <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm ${profile.settings?.notifications ? 'left-5' : 'left-0.5'}`}></div>
                                </div>
                            </div>

                            {/* Theme Selector */}
                            <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Palette size={18} className="text-pink-400" />
                                    <span className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Tema Visual</span>
                                </div>
                                <select
                                    value={profile.settings?.theme || 'light'}
                                    onChange={(e) => {
                                        const newTheme = e.target.value as 'light' | 'clash';
                                        setTheme(newTheme);
                                        toast.success(`Tema canviat a ${newTheme === 'light' ? 'Professional' : 'Gamer'}`);
                                    }}
                                    className="bg-zinc-950 border border-zinc-700 rounded-lg text-xs px-2 py-1 text-zinc-300 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                                >
                                    <option value="light">Professional</option>
                                    <option value="clash">Gamer (Clash)</option>
                                </select>
                            </div>

                            {/* Background Selector */}
                            <BackgroundSelector />

                            {/* Social Privacy Settings */}
                            {socialSettings && (
                                <>
                                    <div className="h-px bg-zinc-800 my-4 bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>

                                    {/* Privacy Level */}
                                    <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Shield size={18} className="text-emerald-400" />
                                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Privacitat</span>
                                        </div>
                                        <select
                                            value={socialSettings.privacy_level}
                                            onChange={(e) => updateSettings({ privacy_level: e.target.value as any })}
                                            className="bg-zinc-950 border border-zinc-700 rounded-lg text-xs px-2 py-1 text-zinc-300 focus:outline-none focus:border-indigo-500 font-bold uppercase"
                                        >
                                            <option value="public">Públic</option>
                                            <option value="friends_only">Només Amics</option>
                                            <option value="private">Privat</option>
                                        </select>
                                    </div>

                                    {/* Show Online Status */}
                                    <div
                                        onClick={() => updateSettings({ show_online_status: !socialSettings.show_online_status })}
                                        className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm cursor-pointer hover:bg-zinc-800 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Activity size={18} className={socialSettings.show_online_status ? "text-green-400" : "text-zinc-600"} />
                                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Estat Online</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors border border-transparent ${socialSettings.show_online_status ? 'bg-green-600 border-green-400' : 'bg-zinc-700 border-zinc-600'}`}>
                                            <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm ${socialSettings.show_online_status ? 'left-5' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>

                                    {/* Allow Friend Requests */}
                                    <div
                                        onClick={() => updateSettings({ allow_friend_requests: !socialSettings.allow_friend_requests })}
                                        className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm cursor-pointer hover:bg-zinc-800 transition"
                                    >
                                        <div className="flex items-center gap-3">
                                            <User size={18} className={socialSettings.allow_friend_requests ? "text-blue-400" : "text-zinc-600"} />
                                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-wide">Peticions Amistat</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-colors border border-transparent ${socialSettings.allow_friend_requests ? 'bg-blue-600 border-blue-400' : 'bg-zinc-700 border-zinc-600'}`}>
                                            <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm ${socialSettings.allow_friend_requests ? 'left-5' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Panel>
                </div>

                {/* Columna Dreta: Stats i Historial */}
                <div className="md:col-span-2 space-y-8">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <GameCard variant="default" className="p-4 flex flex-col items-center justify-center border-amber-500/20 bg-zinc-900">
                            <Zap className="text-amber-400 mb-2 drop-shadow-md" size={32} />
                            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Agressivitat</span>
                            <span className="text-2xl font-black text-white font-display text-stroke">{profile.attributes.AGGRESSION}</span>
                        </GameCard>
                        <GameCard variant="default" className="p-4 flex flex-col items-center justify-center border-emerald-500/20 bg-zinc-900">
                            <ShieldCheck className="text-emerald-400 mb-2 drop-shadow-md" size={32} />
                            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Solidesa</span>
                            <span className="text-2xl font-black text-white font-display text-stroke">{profile.attributes.SOLIDITY}</span>
                        </GameCard>
                        <GameCard variant="default" className="p-4 flex flex-col items-center justify-center border-blue-500/20 bg-zinc-900">
                            <Brain className="text-blue-400 mb-2 drop-shadow-md" size={32} />
                            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Coneixement</span>
                            <span className="text-2xl font-black text-white font-display text-stroke">{profile.attributes.KNOWLEDGE}</span>
                        </GameCard>
                        <GameCard variant="default" className="p-4 flex flex-col items-center justify-center border-purple-500/20 bg-zinc-900">
                            <Activity className="text-purple-400 mb-2 drop-shadow-md" size={32} />
                            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Velocitat</span>
                            <span className="text-2xl font-black text-white font-display text-stroke">{profile.attributes.SPEED}</span>
                        </GameCard>
                    </div>

                    {/* Social Wall */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide font-display text-stroke">
                            <Activity size={24} className="text-indigo-400" /> Activitat Recent
                        </h3>
                        <Feed userId={user.id} limit={3} />
                    </div>

                    {/* Historial de Partides */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide font-display text-stroke">
                            <Swords size={24} className="text-indigo-400" /> Partides Recents
                        </h3>

                        <Panel className="p-0 overflow-hidden bg-zinc-900/50">
                            {games.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                                        <Swords className="text-zinc-600" size={32} />
                                    </div>
                                    <p className="text-zinc-400 font-bold mb-4">Encara no has jugat cap partida.</p>
                                    <Link href="/play">
                                        <ShinyButton variant="primary" className="px-6 py-3">
                                            Juga ara!
                                        </ShinyButton>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="divide-y divide-zinc-800">
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
                                            let outcomeColor = 'text-zinc-400';
                                            let outcomeLabel = 'Taules';
                                            let outcomeBg = 'bg-zinc-800/50';
                                            let outcomeBorder = 'border-zinc-700';

                                            if (game.result === '1/2-1/2') {
                                                outcomeLabel = 'Taules';
                                            } else if ((isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1')) {
                                                outcomeLabel = 'Victòria';
                                                outcomeColor = 'text-emerald-400';
                                                outcomeBg = 'bg-emerald-950/30';
                                                outcomeBorder = 'border-emerald-900/50';
                                            } else {
                                                outcomeLabel = 'Derrota';
                                                outcomeColor = 'text-red-400';
                                                outcomeBg = 'bg-red-950/30';
                                                outcomeBorder = 'border-red-900/50';
                                            }

                                            return (
                                                <div
                                                    key={game.id}
                                                    onClick={() => router.push(`/analysis?gameId=${game.id}`)}
                                                    className="p-4 hover:bg-white/5 transition flex flex-col sm:flex-row justify-between items-center gap-4 cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-md border-2 ${isWhite ? 'bg-zinc-200 text-zinc-900 border-white' : 'bg-zinc-800 text-zinc-200 border-zinc-600'}`}>
                                                            {isWhite ? 'W' : 'B'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors text-lg">vs {opponentName}</p>
                                                            <p className="text-xs text-zinc-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                                                                <Calendar size={12} /> {new Date(game.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                                                        <div className={`px-4 py-2 rounded-lg border ${outcomeBg} ${outcomeBorder} text-center min-w-[100px]`}>
                                                            <p className={`font-black uppercase text-xs tracking-widest ${outcomeColor}`}>{outcomeLabel}</p>
                                                            <p className="text-xs text-zinc-500 font-mono font-bold mt-1">{game.result}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {games.length > 5 && (
                                        <div className="p-3 bg-zinc-900 text-center border-t border-zinc-800">
                                            <Link href="/profile/games" className="text-xs text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest hover:underline flex items-center justify-center gap-2">
                                                Veure totes les partides ({games.length})
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </Panel>
                    </div>

                </div>
            </div>
        </div>
    );
}
