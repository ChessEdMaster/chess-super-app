'use client';

import React from 'react';
import { Map, Lock, Star, Swords, Shield, Scroll } from 'lucide-react';

export default function AdventurePage() {
    return (
        <div className="min-h-screen bg-slate-950 pb-24 relative overflow-hidden">
            {/* Background Map Effect */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 pointer-events-none mix-blend-overlay" />

            <div className="relative z-10 p-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Map className="text-amber-500" size={32} />
                        Mode Història
                    </h1>
                    <div className="bg-slate-900/80 border border-slate-700 px-4 py-2 rounded-full flex items-center gap-2">
                        <Star className="text-yellow-400" size={16} fill="currentColor" />
                        <span className="font-bold text-white">Capítol 1</span>
                    </div>
                </div>

                <div className="space-y-12 max-w-2xl mx-auto">
                    {/* Daily Exercises - Always Available */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 flex items-center gap-6 hover:border-emerald-500/50 transition-colors cursor-pointer">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-lg shadow-emerald-500/20">
                                <Swords size={32} className="text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-1">Exercicis Diaris</h3>
                                <p className="text-slate-400 text-sm mb-3">Resol puzles tàctics de la base de dades de Lichess.</p>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1 text-emerald-400"><Star size={12} /> Infinit</span>
                                    <span>•</span>
                                    <span>Recompensa: ELO Tàctic</span>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <a href="/academy/exercises" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition inline-block">
                                    Entrenar
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Level 1 - Unlocked */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 flex items-center gap-6 hover:border-amber-500/50 transition-colors cursor-pointer">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-amber-500 shadow-lg shadow-amber-500/20">
                                <Swords size={32} className="text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-1">El Despertar del Peó</h3>
                                <p className="text-slate-400 text-sm mb-3">Aprèn els moviments bàsics i derrota al teu primer rival.</p>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1 text-emerald-400"><Star size={12} /> Completat</span>
                                    <span>•</span>
                                    <span>Recompensa: 50 Monedes</span>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                <button className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-bold transition">
                                    Jugar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Level 2 - Locked */}
                    <div className="relative opacity-75 grayscale">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-6">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 relative">
                                <Shield size={32} className="text-slate-600" />
                                <div className="absolute inset-0 bg-slate-950/50 rounded-full flex items-center justify-center">
                                    <Lock size={24} className="text-slate-400" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-300 mb-1">La Defensa del Castell</h3>
                                <p className="text-slate-500 text-sm mb-3">Protegeix el teu rei amb l'enroc i estructures sòlides.</p>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <span>Bloquejat</span>
                                    <span>•</span>
                                    <span>Nivell 2 Requerit</span>
                                </div>
                            </div>
                        </div>
                        {/* Path Connector */}
                        <div className="absolute -top-12 left-10 w-1 h-12 bg-slate-800 -z-10"></div>
                    </div>

                    {/* Level 3 - Locked */}
                    <div className="relative opacity-50 grayscale">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-6">
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-700 relative">
                                <Scroll size={32} className="text-slate-600" />
                                <div className="absolute inset-0 bg-slate-950/50 rounded-full flex items-center justify-center">
                                    <Lock size={24} className="text-slate-400" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-300 mb-1">Els Secrets dels Alfils</h3>
                                <p className="text-slate-500 text-sm mb-3">Domina les diagonals i controla el tauler.</p>
                                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <span>Bloquejat</span>
                                    <span>•</span>
                                    <span>Nivell 5 Requerit</span>
                                </div>
                            </div>
                        </div>
                        {/* Path Connector */}
                        <div className="absolute -top-12 left-10 w-1 h-12 bg-slate-800 -z-10"></div>
                    </div>

                </div>
            </div>
        </div>
    );
}
