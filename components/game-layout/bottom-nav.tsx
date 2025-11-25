'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, Map, Users, User, ShoppingBag, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import toast, { Toaster } from 'react-hot-toast';

export function BottomNav() {
    const pathname = usePathname();
    const { role } = useAuth();
    const isSuperAdmin = role === 'SuperAdmin';

    const navItems = [
        { name: 'Batalla', href: '/', icon: Swords, locked: !isSuperAdmin },
        { name: 'Aventura', href: '/adventure', icon: Map, locked: !isSuperAdmin },
        { name: 'Clubs', href: '/clubs', icon: Users, locked: false }, // Always open
        { name: 'Perfil', href: '/profile', icon: User, locked: !isSuperAdmin },
        { name: 'Botiga', href: '/shop', icon: ShoppingBag, locked: !isSuperAdmin },
    ];

    const handleLockedClick = (e: React.MouseEvent, name: string) => {
        e.preventDefault();
        toast.error(`Funcionalitat ${name} bloquejada per a Reclutes. Accedeix als Clubs!`, {
            style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #475569',
            },
            icon: '🔒',
        });
    };

    return (
        <>
            <Toaster position="top-center" />
            <div className="fixed bottom-4 left-4 right-4 h-20 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl z-50 flex items-center justify-around px-2 max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <div key={item.name} className="relative flex flex-col items-center justify-center w-full h-full">
                            {item.locked ? (
                                <button
                                    onClick={(e) => handleLockedClick(e, item.name)}
                                    className="flex flex-col items-center justify-center w-full h-full text-slate-600 hover:text-slate-500 transition-colors cursor-not-allowed"
                                >
                                    <div className="relative grayscale opacity-50">
                                        <Icon size={24} />
                                        <div className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-0.5 border border-slate-600">
                                            <Lock size={12} className="text-amber-600" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider opacity-40">{item.name}</span>
                                </button>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive
                                            ? 'text-amber-400 -translate-y-2'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-slate-800 shadow-lg shadow-amber-500/20' : ''}`}>
                                        <Icon size={isActive ? 28 : 24} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                        {item.name}
                                    </span>
                                    {isActive && (
                                        <div className="absolute -bottom-2 w-1 h-1 bg-amber-400 rounded-full" />
                                    )}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
