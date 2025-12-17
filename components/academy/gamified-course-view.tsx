'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Lock, Play, Check, Map as MapIcon, GraduationCap } from 'lucide-react';
import { AcademyModule, ModuleProgress } from '@/types/academy';

interface GamifiedCourseViewProps {
    modules: AcademyModule[];
    progressMap: Record<string, ModuleProgress>;
}

export function GamifiedCourseView({ modules, progressMap }: GamifiedCourseViewProps) {
    return (
        <div className="relative max-w-2xl mx-auto py-12">

            {/* Background Path (Simulated with dashed line) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-3 bg-zinc-900 border-x border-zinc-700/50 -translate-x-1/2 hidden md:block rounded-full" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-dashed border-l-2 border-emerald-500/20 -translate-x-1/2 hidden md:block" />

            <div className="space-y-24 relative">
                {modules.map((module, index) => {
                    const progress = progressMap[module.id];
                    const isCompleted = progress?.progressPercentage === 100;
                    const isLocked = index > 0 && !(progressMap[modules[index - 1].id]?.progressPercentage === 100);
                    const isCurrent = !isCompleted && !isLocked;

                    // Alternate left/right alignment for visual interest
                    const isLeft = index % 2 === 0;

                    return (
                        <div key={module.id} className={`flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col gap-8 md:gap-16`}>

                            {/* The Node/Circle */}
                            <div className="relative z-10 group">
                                <Link
                                    href={isLocked ? '#' : `/academy/${module.id}`}
                                    className={`
                                        w-24 h-24 rounded-3xl flex items-center justify-center border-b-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all transform hover:scale-105 active:scale-95 active:border-b-0 active:translate-y-2
                                        ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-700 text-white'
                                            : isLocked
                                                ? 'bg-zinc-800 border-zinc-950 text-zinc-600 cursor-not-allowed'
                                                : 'bg-amber-400 border-amber-600 text-white animate-pulse-subtle shadow-amber-500/20'
                                        }
                                    `}
                                    onClick={(e) => isLocked && e.preventDefault()}
                                >
                                    {isCompleted ? (
                                        <div className="stack relative z-10 drop-shadow-md">
                                            <Star size={40} fill="currentColor" className="text-emerald-100" />
                                        </div>
                                    ) : isLocked ? (
                                        <Lock size={32} />
                                    ) : (
                                        <Play size={40} fill="currentColor" className="ml-1 text-amber-100 drop-shadow-md" />
                                    )}

                                    {/* Ripple Effect for Current */}
                                    {isCurrent && (
                                        <span className="absolute inset-0 rounded-3xl bg-amber-400 opacity-20 animate-ping -z-10" />
                                    )}

                                    {/* Level Badge */}
                                    <div className={`
                                        absolute -bottom-4 bg-zinc-950 text-[10px] font-black px-3 py-1 rounded-full border-2 whitespace-nowrap shadow-xl z-20
                                        ${isCurrent ? 'border-amber-500 text-amber-400' : 'border-zinc-700 text-zinc-500'}
                                    `}>
                                        LEVEL {index + 1}
                                    </div>
                                </Link>
                            </div>

                            {/* The Card/Content */}
                            <div className={`flex-1 ${isLeft ? 'md:text-left' : 'md:text-right'} text-center md:items-start items-center flex flex-col`}>
                                <div className={`
                                    p-5 rounded-2xl border backdrop-blur-md transition-all relative overflow-hidden group
                                    ${isCurrent
                                        ? 'bg-amber-950/30 border-amber-500/30 shadow-lg shadow-amber-500/10'
                                        : 'bg-zinc-900/80 border-zinc-800'
                                    }
                                    ${isLocked ? 'opacity-50 grayscale' : 'opacity-100'}
                                `}>
                                    <h3 className="text-xl font-black text-white mb-2 font-display tracking-wide uppercase leading-none text-stroke-sm">
                                        {module.title}
                                    </h3>
                                    <p className="text-zinc-400 text-xs font-bold mb-4 max-w-xs mx-auto md:mx-0">
                                        {module.description}
                                    </p>

                                    {!isLocked && (
                                        <div className="flex items-center gap-3 justify-center md:justify-start bg-black/20 p-2 rounded-lg border border-white/5 inline-flex">
                                            <div className="h-2 w-24 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress?.progressPercentage || 0}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-emerald-500"
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-emerald-400">
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
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-16 flex flex-col items-center opacity-40">
                <MapIcon size={48} className="text-zinc-600 mb-2" />
                <span className="text-xs uppercase font-black text-zinc-600 tracking-widest bg-zinc-900/80 px-4 py-1 rounded-full">Start Adventure</span>
            </div>
        </div>
    );
}
