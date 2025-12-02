'use client';

import React from 'react';
import { usePlayerStore } from '@/lib/store/player-store';
import { ShoppingBag, Layers, Swords, Users, Trophy } from 'lucide-react';
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
        { name: 'Shop', icon: ShoppingBag, href: '/shop' },
        { name: 'Cards', icon: Layers, href: '/cards' },
        { name: 'Battle', icon: Swords, href: '/' },
        { name: 'Social', icon: Users, href: '/social' },
        { name: 'Events', icon: Trophy, href: '/events' },
    ];

    return (
        <div className="h-dvh w-full flex flex-col bg-zinc-950 text-white overflow-hidden">
            {/* Top Bar */}
            <header className="h-16 px-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md border-b border-white/10 z-50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white shadow-lg relative">
                        {/* Placeholder Avatar */}
                        <span className="text-xs font-bold">{profile.level}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-100">{profile.username}</span>
                        <div className="h-2 w-24 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${(profile.xp / 1000) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-yellow-400" />
                        <span className="text-sm font-bold text-yellow-400">{profile.currencies.gold}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-green-400" />
                        <span className="text-sm font-bold text-green-400">{profile.currencies.gems}</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="h-20 bg-zinc-900 border-t border-white/10 flex items-center justify-around z-50 pb-2 shrink-0">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl transition-all active:scale-95",
                                isActive ? "bg-white/10 text-blue-400" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <tab.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            <span className="text-[10px] font-bold uppercase tracking-wide">{tab.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
