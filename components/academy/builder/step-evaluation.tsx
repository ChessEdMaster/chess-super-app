import React from 'react';
import { useSABuilder } from './store';
import { Award, CheckCircle2, Circle, AlertCircle, HelpCircle } from 'lucide-react';

const RUBRIC_LEVELS = [
    {
        key: 'expert',
        label: 'Expert (Excel·lent)',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'focus:border-purple-500',
        icon: Award,
        placeholder: "L'alumne supera les expectatives. Ex: Identifica patrons complexos i proposa solucions creatives..."
    },
    {
        key: 'avancat',
        label: 'Avançat (Notable)',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'focus:border-emerald-500',
        icon: CheckCircle2,
        placeholder: "L'alumne assoleix els objectius. Ex: Identifica els problemes principals correctament..."
    },
    {
        key: 'aprenent',
        label: 'Aprenent (Bàsic)',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'focus:border-amber-500',
        icon: Circle,
        placeholder: "L'alumne necessita ajuda puntual. Ex: Confon alguns conceptes però entén la idea general..."
    },
    {
        key: 'novell',
        label: 'Novell (En procés)',
        color: 'text-slate-400',
        bg: 'bg-slate-800',
        border: 'focus:border-slate-500',
        icon: AlertCircle,
        placeholder: "L'alumne encara no ha assolit els mínims. Ex: No identifica els elements bàsics..."
    },
];

export function StepEvaluation() {
    const { moduleData, setRubricLevel } = useSABuilder();
    const rubric = moduleData.evaluation_criteria?.rubrica || {};

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Intro Header */}
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex items-start gap-4">
                <div className="hidden md:block bg-indigo-500/10 p-3 rounded-lg text-indigo-400">
                    <HelpCircle size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Disseny de la Rúbrica Competencial</h3>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                        Defineix clarament què esperes de l'alumne a cada nivell.
                        Evita comptar quantitat ("té 3 faltes") i centra't en la qualitat ("utilitza vocabulari precís").
                    </p>
                </div>
            </div>

            {/* Rubric Grid */}
            <div className="grid grid-cols-1 gap-6">
                {RUBRIC_LEVELS.map((level) => {
                    const Icon = level.icon;
                    // @ts-ignore - dynamic key access
                    const value = rubric[level.key as keyof typeof rubric] || '';

                    return (
                        <div key={level.key} className="relative group">
                            {/* Decorative Line connection */}
                            <div className="absolute top-0 bottom-0 -left-6 w-0.5 bg-slate-800 hidden md:block group-last:bg-gradient-to-b group-last:from-slate-800 group-last:to-transparent" />

                            <div className={`
                                relative bg-slate-950 border border-slate-800 rounded-xl p-1 
                                transition-all duration-300 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-950
                                ${level.border.replace('focus:', 'hover:')}
                            `}>
                                <div className="flex flex-col md:flex-row gap-0 md:gap-4">

                                    {/* Level Badge (Left) */}
                                    <div className={`p-4 md:w-64 shrink-0 flex items-center gap-3 rounded-t-lg md:rounded-l-lg md:rounded-tr-none ${level.bg}`}>
                                        <Icon className={level.color} size={20} />
                                        <div>
                                            <div className={`font-bold text-sm uppercase tracking-wider ${level.color}`}>
                                                {level.label}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium opacity-80 mt-0.5">
                                                Criteri d'Èxit
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input Area (Right) */}
                                    <div className="flex-1">
                                        <textarea
                                            rows={2}
                                            className="w-full h-full bg-transparent border-none text-white placeholder:text-slate-600 p-4 focus:ring-0 resize-none leading-relaxed text-sm"
                                            placeholder={level.placeholder}
                                            value={value}
                                            onChange={(e) => setRubricLevel(level.key as any, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
