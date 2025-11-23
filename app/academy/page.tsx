'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, Video, Puzzle, ArrowRight } from 'lucide-react';

const modules = [
    {
        title: "Fonaments",
        description: "Aprèn com es mouen les peces i les regles bàsiques.",
        icon: <BookOpen className="text-emerald-400" size={32} />,
        level: "Principiant",
        lessons: 5,
        progress: 0
    },
    {
        title: "Tàctica Bàsica",
        description: "Descobreix els patrons com la clavada, l'atac doble i l'enfilada.",
        icon: <Puzzle className="text-amber-400" size={32} />,
        level: "Intermedi",
        lessons: 12,
        progress: 0
    },
    {
        title: "Finals Essencials",
        description: "Com guanyar quan queden poques peces al tauler.",
        icon: <GraduationCap className="text-indigo-400" size={32} />,
        level: "Avançat",
        lessons: 8,
        progress: 0
    },
    {
        title: "Video Lliçons",
        description: "Classes magistrals de Grans Mestres.",
        icon: <Video className="text-rose-400" size={32} />,
        level: "Tots",
        lessons: 20,
        progress: 0
    }
];

export default function AcademyPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">

                <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                        <GraduationCap size={40} className="text-indigo-500" /> Acadèmia ChessHub
                    </h1>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        Millora el teu joc amb les nostres lliçons interactives. Des dels moviments bàsics fins a estratègies de Gran Mestre.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((module, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition group cursor-pointer shadow-lg hover:shadow-indigo-900/20">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 group-hover:scale-110 transition-transform">
                                    {module.icon}
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${module.level === 'Principiant' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                        module.level === 'Intermedi' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' :
                                            module.level === 'Avançat' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' :
                                                'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                    {module.level}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{module.title}</h3>
                            <p className="text-slate-400 mb-6 text-sm">{module.description}</p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="text-xs text-slate-500 font-bold flex items-center gap-1">
                                    <BookOpen size={14} /> {module.lessons} Lliçons
                                </div>
                                <button className="text-indigo-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Començar <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Progress Bar Placeholder */}
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[0%]"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Vols entrenament personalitzat?</h2>
                    <p className="text-indigo-200 mb-6">La nostra IA analitza les teves partides i et recomana exercicis específics.</p>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-900/50">
                        Analitzar les meves partides
                    </button>
                </div>

            </div>
        </div>
    );
}
