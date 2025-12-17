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
    Brain,
    GraduationCap
} from 'lucide-react';
import { AcademyModule, ModuleProgress } from '@/types/academy';
import { Panel } from '@/components/ui/design-system/Panel';

interface AcademicCourseViewProps {
    modules: AcademyModule[];
    progressMap: Record<string, ModuleProgress>;
}

export function AcademicCourseView({ modules, progressMap }: AcademicCourseViewProps) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header / Syllabus Info */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <h2 className="text-lg font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap className="text-indigo-500" size={24} /> Syllabus
                </h2>
                <div className="text-xs font-bold text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                    {modules.length} Units
                </div>
            </div>

            {modules.map((module, index) => {
                const progress = progressMap[module.id];
                const isCompleted = progress?.progressPercentage === 100;
                const isStarted = progress?.completedLessons > 0;
                const isLocked = index > 0 && !(progressMap[modules[index - 1].id]?.progressPercentage === 100);

                return (
                    <div key={module.id} className="group relative pl-8 pb-8 last:pb-0">

                        {/* Vertical Line */}
                        <div className="absolute left-[3px] top-4 bottom-0 w-0.5 bg-zinc-800 group-last:hidden" />

                        {/* Timeline Status Dot */}
                        <div className={`
                            absolute left-0 top-6 w-2 h-2 rounded-full ring-4 ring-zinc-950 z-10
                            ${isCompleted
                                ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                : isStarted
                                    ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                    : 'bg-zinc-700'
                            }
                        `} />

                        <Link
                            href={isLocked ? '#' : `/academy/${module.id}`}
                            className={`block ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            onClick={(e) => isLocked && e.preventDefault()}
                        >
                            <div className={`
                                relative overflow-hidden rounded-xl border transition-all duration-300 group-hover:-translate-y-1
                                ${isLocked
                                    ? 'bg-zinc-900/30 border-zinc-800 opacity-60'
                                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 hover:border-amber-500/30 hover:shadow-lg'
                                }
                            `}>
                                {/* Completion Strip */}
                                {isCompleted && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}

                                <div className="p-5 flex items-center gap-5">

                                    {/* Number / Status Box */}
                                    <div className={`
                                        w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg border
                                        ${isCompleted
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : isLocked
                                                ? 'bg-zinc-950 text-zinc-700 border-zinc-800'
                                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                        }
                                    `}>
                                        {isLocked ? <Lock size={18} /> : (index + 1)}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isCompleted && (
                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-500 tracking-wider">
                                                    <CheckCircle size={10} /> Completed
                                                </span>
                                            )}
                                            {isStarted && !isCompleted && (
                                                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-500 tracking-wider">
                                                    <Clock size={10} /> In Progress
                                                </span>
                                            )}
                                        </div>

                                        <h3 className={`text-lg font-bold mb-1 font-display tracking-tight ${isLocked ? 'text-zinc-500' : 'text-white'}`}>
                                            {module.title}
                                        </h3>

                                        {!isLocked && (
                                            <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase tracking-wide mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <FileText size={12} className={progress?.totalLessons > 0 ? "text-indigo-400" : ""} />
                                                    {progress?.totalLessons || 0} Lessons
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Brain size={12} className="text-amber-500/70" />
                                                    Exercises
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Chevron */}
                                    {!isLocked && (
                                        <div className="text-zinc-600 group-hover:text-white transition-colors">
                                            <ChevronRight size={24} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
