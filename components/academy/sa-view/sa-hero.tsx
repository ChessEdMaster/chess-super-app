import React from 'react';
import { Sparkles, Target, Clock, MapPin } from 'lucide-react';
import { AcademyModule } from '@/types/academy';

interface SAHeroProps {
    module: AcademyModule;
    progressPercentage: number;
}

export function SAHero({ module, progressPercentage }: SAHeroProps) {
    return (
        <div className="relative w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl mb-8 group">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />

            <div className="relative z-10 p-8 md:p-12">
                {/* Header Badge */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Situació d'Aprenentatge
                    </span>
                    {module.duration && (
                        <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                            <Clock size={12} />
                            {module.duration}
                        </span>
                    )}
                </div>

                {/* Title & Challenge */}
                <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
                    {module.title}
                </h1>

                {module.challenge_description && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group-hover:bg-slate-800/70 transition-colors duration-500">
                        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-emerald-500" />

                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-500/20 p-3 rounded-full shrink-0">
                                <Target size={24} className="text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    El Repte (Ret)
                                </h3>
                                <p className="text-xl md:text-2xl font-serif italic text-white leading-relaxed">
                                    "{module.challenge_description}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="mt-8 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-white">
                        {Math.round(progressPercentage)}% Completat
                    </span>
                </div>
            </div>
        </div>
    );
}
