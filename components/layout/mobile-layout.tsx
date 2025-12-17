'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ShoppingBag, Layers, Swords, Users, Trophy, Castle, Bot, GraduationCap, Settings, LogOut, Shield, Sparkles, Search, User, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useUIStore } from '@/lib/store/ui-store';
import { useAuth } from '@/components/auth-provider';

interface MobileLayoutProps {
    children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
    const { profile } = usePlayerStore();
    const pathname = usePathname();
    const { toggleAssistant, isAssistantOpen } = useUIStore();
    const { signOut, user } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);

    const tabs = [
        { name: 'Batalla', icon: Swords, href: '/' },
        { name: 'Anàlisi', icon: Search, href: '/analysis' }, // Changed Icon to Search or Microscope? Search is imported below.
        { name: 'Cartes', icon: Layers, href: '/cards' },
        { name: 'Acadèmia', icon: GraduationCap, href: '/academy' },
        { name: 'Perfil', icon: User, href: '/profile' },
    ];

    if (!user) {
        return <div className="h-dvh w-full">{children}</div>;
    }

    return (
        <div className="h-dvh w-full flex flex-col text-white overflow-hidden fixed inset-0">
            {/* Top Bar */}
            <header className="h-16 px-4 flex items-center justify-between bg-gradient-to-b from-blue-900/90 to-blue-950/90 backdrop-blur-md border-b-4 border-blue-800 shadow-lg z-50 shrink-0">
                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-3 hover:bg-white/5 p-1 -ml-1 rounded-xl transition-colors text-left group"
                    >
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center border-2 border-blue-300 shadow-[0_2px_0_#1e3a8a] relative shrink-0 group-active:translate-y-0.5 group-active:shadow-none transition-all">
                            {/* Placeholder Avatar */}
                            <span className="text-[12px] font-display font-bold text-white drop-shadow-md">{profile.level}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold font-display text-white drop-shadow-md tracking-wide">{profile.username}</span>
                            <div className="h-2 w-24 bg-black/40 rounded-full overflow-hidden mt-0.5 border border-white/10">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                                    style={{ width: `${(profile.xp / 1000) * 100}%` }}
                                />
                            </div>
                        </div>
                    </button>

                    {/* Profile Dropdown (Styled) */}
                    {profileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setProfileOpen(false)}
                            />
                            <div className="absolute top-14 left-0 w-52 bg-zinc-900 border-2 border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-zinc-800 mb-1 bg-zinc-800/50">
                                    <p className="text-xs text-zinc-400 font-bold tracking-wider">Mestre</p>
                                    <p className="text-sm font-bold truncate text-gold-400">{profile.username}</p>
                                </div>
                                {profile.role === 'SuperAdmin' && (
                                    <>
                                        <Link
                                            href="/admin/users"
                                            className="w-full text-left px-4 py-3 text-sm text-indigo-400 hover:bg-zinc-800 hover:text-indigo-300 flex items-center gap-3 font-medium"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <Shield size={16} />
                                            Panel Admin
                                        </Link>
                                        <Link
                                            href="/features"
                                            className="w-full text-left px-4 py-3 text-sm text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300 flex items-center gap-3 font-medium"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <Sparkles size={16} />
                                            Beta Features
                                        </Link>
                                    </>
                                )}
                                <Link
                                    href="/openings"
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 font-medium"
                                    onClick={() => setProfileOpen(false)}
                                >
                                    <BookOpen size={16} />
                                    Enciclopèdia
                                </Link>
                                <Link
                                    href="/profile"
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 font-medium"
                                    onClick={() => setProfileOpen(false)}
                                >
                                    <User size={16} />
                                    El meu perfil
                                </Link>
                                <button
                                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-3 font-medium"
                                    onClick={() => {/* TODO: Settings Link */ }}
                                >
                                    <Settings size={16} />
                                    Configuració
                                </button>
                                <button
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-3 font-medium"
                                    onClick={() => {
                                        setProfileOpen(false);
                                        signOut();
                                    }}
                                >
                                    <LogOut size={16} />
                                    Tancar Sessió
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Resources */}
                    <div className="hidden sm:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 shadow-inner">
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-sm bg-yellow-400 rotate-45 border border-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                            <span className="text-xs font-bold text-yellow-100 font-display">{profile.currencies.gold}</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-green-500 border border-green-300 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                            <span className="text-xs font-bold text-green-100 font-display">{profile.currencies.gems}</span>
                        </div>
                    </div>

                    <button
                        onClick={toggleAssistant}
                        className={`p-2.5 rounded-xl transition-all relative border-b-4 active:border-b-0 active:translate-y-1 ${isAssistantOpen
                            ? 'bg-indigo-600 border-indigo-800 text-white shadow-lg'
                            : 'bg-zinc-800 border-zinc-950 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700'
                            }`}
                    >
                        <Bot size={20} className="drop-shadow-sm" />
                        {!isAssistantOpen && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-800 rounded-full animate-pulse" />
                        )}
                    </button>

                    <Link href="/shop" className="group relative">
                        <div className="bg-amber-500 p-2.5 rounded-xl border-b-4 border-amber-700 hover:bg-amber-400 active:border-b-0 active:translate-y-1 transition-all">
                            <ShoppingBag size={20} className="text-white drop-shadow-md" />
                        </div>
                    </Link>
                    <NotificationBell />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto scrollbar-hide bg-transparent">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="h-20 bg-zinc-900 border-t-4 border-zinc-800 flex items-center justify-around z-50 pb-safe shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all duration-200",
                                isActive
                                    ? "-translate-y-3"
                                    : "opacity-70 hover:opacity-100 hover:bg-white/5 active:scale-95"
                            )}
                        >
                            {isActive && (
                                <div className="absolute inset-x-0 bottom-0 top-2 bg-gradient-to-t from-blue-600/20 to-transparent rounded-b-2xl pointer-events-none" />
                            )}

                            <div className={cn(
                                "p-2.5 rounded-xl transition-all duration-200 border-2 shadow-lg",
                                isActive
                                    ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-200 shadow-amber-500/20 rotate-3 scale-110"
                                    : "bg-zinc-800 border-zinc-700 shadow-black"
                            )}>
                                <tab.icon className={cn("w-6 h-6 drop-shadow-md", isActive ? "text-white fill-white/20" : "text-zinc-400")} />
                            </div>

                            {isActive && (
                                <span className="absolute -bottom-6 text-[10px] font-bold text-amber-400 bg-black/80 px-2 py-0.5 rounded-full whitespace-nowrap border border-amber-500/30">
                                    {tab.name}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
