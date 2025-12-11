import React from 'react';
import Link from 'next/link';
import { Rocket, Hammer, MessageCircle, Lock, CheckCircle, ChevronRight, Play } from 'lucide-react';
import { AcademyLesson, LessonPhase } from '@/types/academy';

interface SATimelineProps {
    moduleId: string;
    lessons: AcademyLesson[];
    completedLessons: Set<string>;
}

const PHASE_CONFIG: Record<LessonPhase, { label: string; icon: any; color: string; bg: string }> = {
    motivation: {
        label: 'Fase 1: Motivació i Exploració',
        icon: Rocket,
        color: 'text-pink-400',
        bg: 'bg-pink-500/10'
    },
    application: {
        label: 'Fase 2: Aplicació i Creació',
        icon: Hammer,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10'
    },
    communication: {
        label: 'Fase 3: Comunicació i Tancament',
        icon: MessageCircle,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10'
    }
};

export function SATimeline({ moduleId, lessons, completedLessons }: SATimelineProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    El Teu Viatge d'Aprenentatge
                </span>
            </h2>

            <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-800" />

                {lessons.map((lesson, index) => {
                    const isCompleted = completedLessons.has(lesson.id);
                    const isLocked = index > 0 && !completedLessons.has(lessons[index - 1].id);
                    const isCurrent = !isLocked && !isCompleted;

                    // Fallback if phase_type is missing, guess by index or default
                    const phaseType = lesson.phase_type ||
                        (index === 0 ? 'motivation' : index === lessons.length - 1 ? 'communication' : 'application');

                    const config = PHASE_CONFIG[phaseType as LessonPhase] || PHASE_CONFIG['application'];
                    const Icon = config.icon;

                    return (
                        <div key={lesson.id} className="relative pl-20 mb-8 last:mb-0 group">
                            {/* Node on the line */}
                            <div className={`absolute left-4 -translate-x-1/2 w-8 h-8 rounded-full border-4 transition-all duration-300 z-10 flex items-center justify-center
                                ${isCompleted
                                    ? 'bg-emerald-500 border-slate-950 scale-110'
                                    : isCurrent
                                        ? 'bg-indigo-500 border-indigo-900 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-125'
                                        : 'bg-slate-800 border-slate-900 group-hover:border-slate-700'
                                }`}>
                                {isCompleted && <CheckCircle size={14} className="text-white" />}
                                {isLocked && <Lock size={12} className="text-slate-500" />}
                                {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                            </div>

                            <Link
                                href={isLocked ? '#' : `/academy/${moduleId}/${lesson.id}`}
                                onClick={(e) => isLocked && e.preventDefault()}
                                className={`block transition-transform duration-300 ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-1'}`}
                            >
                                <div className={`relative bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-hidden
                                    ${!isLocked && 'hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5'}
                                    ${isCurrent && 'ring-1 ring-indigo-500/50 border-indigo-500/30'}
                                `}>

                                    {/* Phase Badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                                            <Icon size={12} />
                                            {config.label}
                                        </div>
                                        {isCurrent && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 animate-pulse">
                                                CONTINUAR <ChevronRight size={12} />
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                        {lesson.title}
                                    </h3>

                                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                        {lesson.description}
                                    </p>

                                    {/* CTA Button */}
                                    {!isLocked && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 py-2 px-4 rounded-lg w-fit transition-colors">
                                            {isCompleted ? 'Repassar Lliçó' : 'Comença la Missió'}
                                            <Play size={14} fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
