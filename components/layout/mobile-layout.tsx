'use client';

import React from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ShoppingBag, Layers, Swords, Users, Trophy, Castle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
    children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
    const { profile } = usePlayerStore();
    const pathname = usePathname();

    const tabs = [
        { name: 'Battle', icon: Swords, href: '/' },
        { name: 'Kingdom', icon: Castle, href: '/kingdom' },
        { name: 'Cards', icon: Layers, href: '/cards' },
        { name: 'Improve', icon: Trophy, href: '/improve' },
        { name: 'Social', icon: Users, href: '/social' },
    ];

    return (
        <div className="h-dvh w-full flex flex-col bg-zinc-950 text-white overflow-hidden">
            {/* Top Bar */}
            <header className="h-14 px-4 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md border-b border-white/5 z-50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border border-white shadow-lg relative">
                        {/* Placeholder Avatar */}
                        <span className="text-[10px] font-bold">{profile.level}</span>
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
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="h-16 bg-zinc-900/90 backdrop-blur-lg border-t border-white/5 flex items-center justify-around z-50 pb-safe shrink-0">
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
