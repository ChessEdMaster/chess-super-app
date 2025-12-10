'use client';

import React from 'react';
import Link from 'next/link';
import {
    BookOpen,
    CheckCircle,
    Play,
    Lock,
    Clock,
    ChevronRight,
    FileText,
    Brain
} from 'lucide-react';
import { AcademyModule, ModuleProgress } from '@/types/academy';

interface AcademicCourseViewProps {
    modules: AcademyModule[];
    progressMap: Record<string, ModuleProgress>;
}

export function AcademicCourseView({ modules, progressMap }: AcademicCourseViewProps) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header / Syllabus Info */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-indigo-400" size={20} /> Temari del Curs
                </h2>
                <div className="text-xs text-slate-400">
                    {modules.length} Unitats Didàctiques
                </div>
            </div>

            {modules.map((module, index) => {
                const progress = progressMap[module.id];
                const isCompleted = progress?.progressPercentage === 100;
                const isStarted = progress?.completedLessons > 0;
                const isLocked = index > 0 && !(progressMap[modules[index - 1].id]?.progressPercentage === 100);

                return (
                    <div key={module.id} className={`group relative pl-8 pb-8 border-l-2 ${isCompleted ? 'border-emerald-500/30' : 'border-slate-800'} last:pb-0`}>

                        {/* Timeline Connector */}
                        <div className={`
                            absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 
                            ${isCompleted
                                ? 'bg-emerald-500 border-emerald-900'
                                : isStarted
                                    ? 'bg-indigo-500 border-indigo-900'
                                    : 'bg-slate-900 border-slate-700'
                            }
                        `} />

                        <Link
                            href={isLocked ? '#' : `/academy/${module.id}`}
                            className={`block ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={(e) => isLocked && e.preventDefault()}
                        >
                            <div className={`
                                bg-slate-900/40 border rounded-xl p-4 transition-all
                                ${isLocked
                                    ? 'border-slate-800 opacity-60'
                                    : 'border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800'
                                }
                            `}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Unitat {index + 1}
                                            </span>
                                            {isCompleted && (
                                                <span className="bg-emerald-900/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    Completat
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`text-lg font-bold mb-1.5 ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                                            {module.title}
                                        </h3>

                                        <p className="text-slate-400 text-xs mb-3 line-clamp-2">
                                            {module.description}
                                        </p>

                                        {/* Metadata / Stats */}
                                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                                            <div className="flex items-center gap-1">
                                                <FileText size={12} /> {progress?.totalLessons || 0} Lliçons
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Brain size={12} /> Exercicis Pràctics
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} /> Est. 30 min
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex flex-col items-end justify-center h-full pt-1">
                                        {isLocked ? (
                                            <Lock className="text-slate-600" size={20} />
                                        ) : (
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center border transition-all
                                                ${isCompleted
                                                    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                                                    : 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10 group-hover:scale-110'
                                                }
                                            `}>
                                                {isCompleted ? <CheckCircle size={16} /> : <ChevronRight size={20} />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
