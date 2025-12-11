import React from 'react';
import { useSABuilder } from '../store';
import { Sparkles, Clock, Tag } from 'lucide-react';

export function StepIdentification() {
    const { moduleData, updateData } = useSABuilder();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Title (Full Width) */}
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Sparkles size={14} className="text-indigo-400" />
                        Títol de la Situació d'Aprenentatge
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: Arquitectes del Tauler: Per què cauen els edificis?"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 font-medium"
                        value={moduleData.title}
                        onChange={(e) => updateData({ title: e.target.value })}
                    />
                    <p className="text-xs text-slate-500">Ha de ser suggeridor i plantejar una pregunta o repte.</p>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                        <Clock size={14} className="text-indigo-400" />
                        Temporització
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: 3 Sessions"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-medium"
                        value={moduleData.duration || ''}
                        onChange={(e) => updateData({ duration: e.target.value })}
                    />
                </div>
            </div>

            {/* Tags / Vectors */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Tag size={14} className="text-indigo-400" />
                    Vectors Transversals
                </label>
                <div className="flex flex-wrap gap-2">
                    {['Pensament Crític', 'Benestar Emocional', 'Perspectiva de Gènere', 'Ciutadania', 'Sostenibilitat'].map(vector => {
                        const isSelected = moduleData.transversal_vectors?.includes(vector);
                        return (
                            <button
                                key={vector}
                                onClick={() => {
                                    const current = moduleData.transversal_vectors || [];
                                    updateData({
                                        transversal_vectors: isSelected
                                            ? current.filter(v => v !== vector)
                                            : [...current, vector]
                                    });
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${isSelected
                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                                    }`}
                            >
                                {vector}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Description (Hidden for now, maybe less important than Context) */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Descripció Tècnica (Opcional)</label>
                <textarea
                    rows={2}
                    placeholder="Breu resum pel professorat..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm"
                    value={moduleData.description}
                    onChange={(e) => updateData({ description: e.target.value })}
                />
            </div>
        </div>
    );
}
