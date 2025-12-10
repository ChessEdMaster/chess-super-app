'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Lock, Play, Check, Map as MapIcon } from 'lucide-react';
import { AcademyModule, ModuleProgress } from '@/types/academy';

interface GamifiedCourseViewProps {
    modules: AcademyModule[];
    progressMap: Record<string, ModuleProgress>;
}

export function GamifiedCourseView({ modules, progressMap }: GamifiedCourseViewProps) {
    return (
        <div className="relative max-w-2xl mx-auto py-12">

            {/* Background Path (Simulated with dashed line) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-dashed border-l-2 border-indigo-500/20 -translate-x-1/2 hidden md:block" />

            <div className="space-y-16 relative">
                {modules.map((module, index) => {
                    const progress = progressMap[module.id];
                    const isCompleted = progress?.progressPercentage === 100;
                    const isLocked = index > 0 && !(progressMap[modules[index - 1].id]?.progressPercentage === 100);
                    const isCurrent = !isCompleted && !isLocked;

                    // Alternate left/right alignment for visual interest
                    const isLeft = index % 2 === 0;

                    return (
                        <div key={module.id} className={`flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col gap-8`}>

                            {/* The Node/Circle */}
                            <div className="relative z-10">
                                <Link
                                    href={isLocked ? '#' : `/academy/${module.id}`}
                                    className={`
                                        w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all transform hover:scale-110
                                        ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-300 text-white'
                                            : isLocked
                                                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                                                : 'bg-indigo-600 border-indigo-400 text-white animate-pulse shadow-indigo-500/50'
                                        }
                                    `}
                                    onClick={(e) => isLocked && e.preventDefault()}
                                >
                                    {isCompleted ? (
                                        <Star size={40} fill="currentColor" />
                                    ) : isLocked ? (
                                        <Lock size={32} />
                                    ) : (
                                        <Play size={40} fill="currentColor" className="ml-1" />
                                    )}

                                    {/* Level Badge */}
                                    <div className="absolute -bottom-2 bg-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700 whitespace-nowrap">
                                        Nivell {index + 1}
                                    </div>
                                </Link>
                            </div>

                            {/* The Card/Content */}
                            <div className={`flex-1 ${isLeft ? 'md:text-left' : 'md:text-right'} text-center md:items-start items-center flex flex-col`}>
                                <div className={`
                                    p-6 rounded-2xl border backdrop-blur-sm transition-all
                                    ${isCurrent
                                        ? 'bg-indigo-900/40 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
                                        : 'bg-slate-900/50 border-slate-800'
                                    }
                                    ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'}
                                `}>
                                    <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                                    <p className="text-slate-400 text-sm mb-4 max-w-xs mx-auto md:mx-0">
                                        {module.description}
                                    </p>

                                    {!isLocked && (
                                        <div className="flex items-center gap-2 justify-center md:justify-start">
                                            <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all duration-1000"
                                                    style={{ width: `${progress?.progressPercentage || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-bold text-emerald-400">
                                                {progress?.completedLessons || 0}/{progress?.totalLessons || 0}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* Start Flag */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-12 flex flex-col items-center opacity-50">
                <MapIcon size={32} className="text-slate-600 mb-2" />
                <span className="text-xs uppercase font-bold text-slate-600 tracking-widest">Inici de l'Aventura</span>
            </div>
        </div>
    );
}
