'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trophy, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export default function WelcomePage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements - Removed to use Global Layout Background */}

            <div className="relative z-10 max-w-md w-full text-center">
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 relative rotate-3 shadow-2xl shadow-orange-500/30">
                        <Image
                            src="/assets/branding/desktop/logo-icon.png"
                            alt="Logo"
                            fill
                            className="object-contain drop-shadow-md"
                        />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    CHESS<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">CLANS</span>
                </h1>
                <p className="text-slate-400 text-lg mb-12 leading-relaxed">
                    La plataforma definitiva per a jugadors d'escacs. Competeix, millora i connecta.
                </p>

                <div className="space-y-4">
                    <Link href="/login" className="block w-full">
                        <button className="w-full bg-white text-slate-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition transform hover:scale-105 shadow-lg">
                            <LogIn size={20} />
                            Iniciar Sessió
                        </button>
                    </Link>

                    <Link href="/register" className="block w-full">
                        <button className="w-full bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition transform hover:scale-105">
                            <UserPlus size={20} className="text-purple-400" />
                            Crear Compte
                        </button>
                    </Link>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8 text-slate-500 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span>1,240 Jugadors Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
