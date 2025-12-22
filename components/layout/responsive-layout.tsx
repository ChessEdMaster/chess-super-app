'use client';

import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ShoppingBag, Layers, Swords, User, GraduationCap, Settings, LogOut, Shield, Sparkles, Search, BookOpen, Menu, X, Bot, Users, Trophy } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useUIStore } from '@/lib/store/ui-store';
import { useAuth } from '@/components/auth-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { SplashScreen } from '@/components/splash-screen';
import { Button } from '@/components/ui/button';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
    const { profile } = usePlayerStore();
    const pathname = usePathname();
    const { toggleAssistant, isAssistantOpen } = useUIStore();
    const { signOut, user } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Initial check and listener for screen size
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const desktopTabs = [
        { name: 'Batalla', icon: Swords, href: '/' },
        { name: 'Anàlisi', icon: Search, href: '/analysis' },
    ];

    // Limit mobile tabs to 5 key items to fit screen
    const mobileTabs = [
        { name: 'Batalla', icon: Swords, href: '/' },
        { name: 'Anàlisi', icon: Search, href: '/analysis' },
    ];

    if (!user) {
        // Simple full screen for unauthenticated (login, etc)
        // Ensure SplashScreen is still visible if needed
        return (
            <div className="h-dvh w-full">
                <SplashScreen />
                {children}
            </div>
        );
    }

    return (
        <div className="h-dvh w-full flex flex-col lg:flex-row text-foreground overflow-hidden fixed inset-0 bg-background transition-colors duration-300">
            <SplashScreen />

            {/* --- DESKTOP/TABLET SIDEBAR --- */}
            <aside className="hidden lg:flex flex-col w-64 bg-[var(--panel-bg)] border-r border-[var(--panel-border)] backdrop-blur-xl z-50 shrink-0 h-full shadow-2xl">
                {/* Sidebar Header */}
                <div className="p-6 flex items-center gap-3 border-b border-[var(--panel-border)]">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <span className="text-xl">👑</span>
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-lg leading-none tracking-wide text-foreground">CHESS <span className="text-[var(--color-gold)]">CLANS</span></h1>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-1">Grandmaster Edition</p>
                    </div>
                </div>

                {/* Sidebar Nav */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-subtle">
                    {desktopTabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-[var(--color-primary)] text-[var(--background)] shadow-md font-bold"
                                        : "hover:bg-[var(--color-muted)] text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <tab.icon size={20} className={cn(isActive ? "text-[var(--background)]" : "text-muted-foreground group-hover:text-[var(--color-accent)]")} />
                                <span>{tab.name}</span>
                            </Link>
                        );
                    })}

                    {profile.role === 'SuperAdmin' && (
                        <div className="pt-4 mt-4 border-t border-[var(--panel-border)]">
                            <p className="px-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-2">SuperAdmin Tools</p>
                            <Link href="/features" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-500 hover:bg-[var(--color-muted)] hover:text-amber-400 transition-all">
                                <Sparkles size={18} />
                                Beta Features
                            </Link>
                            <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-[var(--color-muted)] hover:text-red-300 transition-all">
                                <Shield size={18} />
                                Admin
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Sidebar Footer (User) */}
                <div className="p-4 border-t border-[var(--panel-border)] bg-[var(--color-muted)]/30">
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors text-left"
                    >
                        <div className="relative">
                            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center border border-white/10 shadow-inner">
                                <span className="text-sm font-bold text-white">{profile.level}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--panel-bg)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-foreground">{profile.username}</p>
                            <p className="text-xs text-muted-foreground truncate">{profile.role}</p>
                        </div>
                        <Settings size={16} className="text-muted-foreground" />
                    </button>
                    {profileOpen && (
                        <div className="absolute bottom-24 left-4 w-56 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl p-1 z-50 animate-in slide-in-from-left-2 pb-2">
                            <Link href="/features" className="w-full text-left px-3 py-2 text-sm text-amber-500 hover:bg-[var(--color-muted)] rounded-lg flex items-center gap-2 mb-1">
                                <Sparkles size={14} /> Beta Features
                            </Link>
                            <button onClick={signOut} className="w-full text-left px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg flex items-center gap-2">
                                <LogOut size={14} /> Tancar Sessió
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* --- MOBILE HEADER (Only Visible on Mobile/Tablet) --- */}
            <header className="lg:hidden h-16 px-4 flex items-center justify-between bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--border)] shadow-sm z-50 shrink-0 transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-sm">
                        <span className="text-lg">👑</span>
                    </div>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex flex-col"
                    >
                        <span className="text-sm font-bold font-display text-foreground tracking-wide">{profile.username}</span>
                        <div className="h-1.5 w-20 bg-[var(--color-muted)] rounded-full overflow-hidden mt-0.5">
                            <div
                                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400"
                                style={{ width: `${(profile.xp / 1000) * 100}%` }}
                            />
                        </div>
                    </button>
                    {/* Mobile Profile Dropdown Overlay */}
                    {profileOpen && (
                        <>
                            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setProfileOpen(false)} />
                            <div className="absolute top-16 left-4 w-64 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-in slide-in-from-top-2">
                                {profile.role === 'SuperAdmin' && (
                                    <>
                                        <Link href="/features" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-amber-500 hover:bg-[var(--background)] transition-colors" onClick={() => setProfileOpen(false)}>
                                            <Sparkles size={18} /> Features Beta
                                        </Link>
                                        <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-[var(--background)] transition-colors" onClick={() => setProfileOpen(false)}>
                                            <Shield size={18} /> Admin Panel
                                        </Link>
                                        <div className="h-px bg-[var(--border)] my-1" />
                                    </>
                                )}

                                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] transition-colors" onClick={() => setProfileOpen(false)}>
                                    <User size={18} /> El meu perfil
                                </Link>

                                <div className="h-px bg-[var(--border)] my-1" />
                                <button
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                                    onClick={() => { setProfileOpen(false); signOut(); }}
                                >
                                    <LogOut size={18} /> Tancar Sessió
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleAssistant}
                        className={`p-2 rounded-lg transition-all border border-transparent ${isAssistantOpen
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-muted-foreground hover:bg-[var(--color-muted)]'
                            }`}
                    >
                        <Bot size={20} />
                    </button>
                    <NotificationBell />
                </div>
            </header>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden scrollbar-subtle bg-transparent">
                <div className="w-full h-full min-h-full flex flex-col">
                    {children}
                </div>
            </main>

            {/* --- MOBILE BOTTOM NAV (Only Visible on Mobile/Tablet) --- */}
            <nav className="lg:hidden h-20 bg-[var(--nav-bg)] border-t border-[var(--border)] flex items-center justify-around z-50 pb-safe shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] transition-colors duration-300">
                {mobileTabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200",
                                isActive
                                    ? "-translate-y-2"
                                    : "opacity-60 hover:opacity-100 active:scale-95"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-[var(--color-primary)] text-[var(--background)] shadow-lg shadow-indigo-500/20"
                                    : "text-muted-foreground"
                            )}>
                                <tab.icon size={24} />
                            </div>
                            {isActive && (
                                <span className="text-[10px] font-bold text-[var(--color-primary)]">
                                    {tab.name}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <AssistantWidgetWrapper />
        </div>
    );
}

function AssistantWidgetWrapper() {
    const { isAssistantOpen } = useUIStore();
    // We can render this or just use the global one in layout
    return null;
}
