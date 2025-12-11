import React from 'react';
import { useSABuilder } from './store';
import { Target, MapPin, Box } from 'lucide-react';

export function StepArchitecture() {
    const { moduleData, updateData } = useSABuilder();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 1. Context */}
            <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl md:flex gap-6 items-start">
                <div className="hidden md:flex bg-emerald-500/10 p-4 rounded-xl text-emerald-400 shrink-0">
                    <MapPin size={24} />
                </div>
                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 md:hidden mb-2 text-emerald-400 font-bold">
                        <MapPin size={18} /> Context
                    </div>
                    <div>
                        <label className="block text-lg font-bold text-white mb-1">El Context (Narrativa)</label>
                        <p className="text-sm text-slate-400 mb-2">Escenari real on se situa l'aprenentatge. "La Crida".</p>
                    </div>
                    <textarea
                        rows={3}
                        placeholder="Ex: Imagina que ets un arquitecte i t'encarreguen reformar un edifici..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 leading-relaxed font-sans"
                        value={moduleData.context_description || ''}
                        onChange={(e) => updateData({ context_description: e.target.value })}
                    />
                </div>
            </div>

            {/* 2. Repte */}
            <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl md:flex gap-6 items-start">
                <div className="hidden md:flex bg-indigo-500/10 p-4 rounded-xl text-indigo-400 shrink-0">
                    <Target size={24} />
                </div>
                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 md:hidden mb-2 text-indigo-400 font-bold">
                        <Target size={18} /> Repte
                    </div>
                    <div>
                        <label className="block text-lg font-bold text-white mb-1">El Repte (Ret)</label>
                        <p className="text-sm text-slate-400 mb-2">La pregunta clau que guia l'aprenentatge.</p>
                    </div>
                    <textarea
                        rows={2}
                        placeholder="Ex: Com podem diagnosticar la 'salut' d'una posició només mirant els peons?"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 font-serif italic text-lg"
                        value={moduleData.challenge_description || ''}
                        onChange={(e) => updateData({ challenge_description: e.target.value })}
                    />
                </div>
            </div>

            {/* 3. Producte Final */}
            <div className="bg-slate-900/50 border border-slate-700/50 p-6 rounded-2xl md:flex gap-6 items-start">
                <div className="hidden md:flex bg-amber-500/10 p-4 rounded-xl text-amber-400 shrink-0">
                    <Box size={24} />
                </div>
                <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 md:hidden mb-2 text-amber-400 font-bold">
                        <Box size={18} /> Producte
                    </div>
                    <div>
                        <label className="block text-lg font-bold text-white mb-1">Producte Final</label>
                        <p className="text-sm text-slate-400 mb-2">Què lliuraran els alumnes?</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Ex: L'Informe Tècnic d'Estructures"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600 font-medium"
                        value={moduleData.final_product || ''}
                        onChange={(e) => updateData({ final_product: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}
