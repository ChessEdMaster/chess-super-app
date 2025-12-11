'use client';

import React, { useState } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ShoppingBag, Layers, Swords, Users, Trophy, Castle, Bot, GraduationCap, Settings, LogOut, Shield } from 'lucide-react';
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
        { name: 'Battle', icon: Swords, href: '/' },
        { name: 'Kingdom', icon: Castle, href: '/kingdom' },
        { name: 'Cards', icon: Layers, href: '/cards' },
        { name: 'Academy', icon: GraduationCap, href: '/academy' },
        { name: 'Improve', icon: Trophy, href: '/improve' },
        { name: 'Social', icon: Users, href: '/social' },
    ];

    if (!user) {
        return <div className="h-dvh w-full">{children}</div>;
    }

    return (
        <div className="h-dvh w-full flex flex-col text-white overflow-hidden">
            {/* Top Bar */}
            <header className="h-14 px-4 flex items-center justify-between bg-zinc-900/40 backdrop-blur-md border-b border-white/5 z-50 shrink-0">
                <div className="flex items-center gap-3 relative">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-3 hover:bg-white/5 p-1 -ml-1 rounded-lg transition-colors text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border border-white shadow-lg relative shrink-0">
                            {/* Placeholder Avatar */}
                            <span className="text-[10px] font-bold text-white">{profile.level}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-100">{profile.username}</span>
                            <div className="h-1.5 w-20 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${(profile.xp / 1000) * 100}%` }}
                                />
                            </div>
                        </div>
                    </button>

                    {/* Profile Dropdown */}
                    {profileOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40 bg-transparent"
                                onClick={() => setProfileOpen(false)}
                            />
                            <div className="absolute top-12 left-0 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                <div className="px-4 py-2 border-b border-zinc-800 mb-1">
                                    <p className="text-xs text-zinc-400">Autenticat com</p>
                                    <p className="text-sm font-bold truncate">{profile.username}</p>
                                </div>
                                {profile.role === 'SuperAdmin' && (
                                    <Link
                                        href="/admin/users"
                                        className="w-full text-left px-4 py-2 text-sm text-indigo-400 hover:bg-zinc-800 hover:text-indigo-300 flex items-center gap-2"
                                        onClick={() => setProfileOpen(false)}
                                    >
                                        <Shield size={14} />
                                        Panel Admin
                                    </Link>
                                )}
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                                    onClick={() => {/* TODO: Settings Link */ }}
                                >
                                    <Settings size={14} />
                                    Configuració
                                </button>
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2"
                                    onClick={() => {
                                        setProfileOpen(false);
                                        signOut();
                                    }}
                                >
                                    <LogOut size={14} />
                                    Tancar Sessió
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-zinc-800/50 px-2 py-1 rounded-full border border-white/5">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                        <span className="text-xs font-bold text-yellow-100">{profile.currencies.gold}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-800/50 px-2 py-1 rounded-full border border-white/5">
                        <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                        <span className="text-xs font-bold text-green-100">{profile.currencies.gems}</span>
                    </div>

                    <button
                        onClick={toggleAssistant}
                        className={`p-2 rounded-full transition-colors relative ${isAssistantOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800'
                            }`}
                    >
                        <Bot size={20} />
                        {!isAssistantOpen && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        )}
                    </button>

                    <Link href="/shop" className="text-zinc-400 hover:text-white transition-colors relative">
                        <div className="bg-zinc-800/50 p-2 rounded-full border border-white/5 hover:bg-zinc-700/50">
                            <ShoppingBag size={18} />
                        </div>
                    </Link>
                    <NotificationBell />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="h-16 bg-zinc-900/50 backdrop-blur-lg border-t border-white/5 flex items-center justify-around z-50 pb-safe shrink-0">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all active:scale-95",
                                isActive ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <div className={cn("p-1.5 rounded-lg transition-colors", isActive && "bg-blue-500/10")}>
                                <tab.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                            </div>
                            <span className={cn("text-[10px] font-bold uppercase tracking-wide transition-colors", isActive ? "text-blue-400" : "text-zinc-600")}>{tab.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
