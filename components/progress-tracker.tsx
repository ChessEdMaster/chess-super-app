'use client';

import React from 'react';
import { Trophy, Target, Flame, Star, TrendingUp } from 'lucide-react';
import { ModuleProgress, UserAcademyStats } from '@/lib/academy-types';

interface ProgressTrackerProps {
    moduleProgress: ModuleProgress[];
    stats: UserAcademyStats;
}

export function ProgressTracker({ moduleProgress, stats }: ProgressTrackerProps) {
    return (
        <div className="w-full space-y-6">

            {/* OVERALL STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={<Trophy className="text-amber-400" size={24} />}
                    label="Lliçons"
                    value={stats.totalLessonsCompleted}
                    color="bg-amber-900/20 border-amber-500/30"
                />
                <StatCard
                    icon={<Target className="text-indigo-400" size={24} />}
                    label="Exercicis"
                    value={stats.totalExercisesSolved}
                    color="bg-indigo-900/20 border-indigo-500/30"
                />
                <StatCard
                    icon={<Flame className="text-orange-400" size={24} />}
                    label="Ratxa"
                    value={`${stats.currentStreak} dies`}
                    color="bg-orange-900/20 border-orange-500/30"
                />
                <StatCard
                    icon={<Star className="text-emerald-400" size={24} />}
                    label="Assoliments"
                    value={stats.achievementsUnlocked}
                    color="bg-emerald-900/20 border-emerald-500/30"
                />
            </div>

            {/* MODULE PROGRESS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-indigo-400" size={20} />
                    <h3 className="text-lg font-bold text-white">Progrés per Mòdul</h3>
                </div>

                <div className="space-y-4">
                    {moduleProgress.map((progress, idx) => (
                        <div key={idx}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white">
                                    {progress.module.title}
                                </span>
                                <span className="text-sm text-slate-400">
                                    {progress.completedLessons} / {progress.totalLessons}
                                </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-indigo-500 h-full transition-all duration-500"
                                    style={{ width: `${progress.progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AVERAGE SCORE */}
            {stats.averageScore > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Puntuació Mitjana
                            </h3>
                            <div className="text-3xl font-bold text-white">
                                {stats.averageScore.toFixed(1)}%
                            </div>
                        </div>
                        <div className={`text-6xl ${stats.averageScore >= 90 ? 'text-emerald-400' :
                                stats.averageScore >= 75 ? 'text-amber-400' :
                                    'text-slate-400'
                            }`}>
                            {stats.averageScore >= 90 ? '🏆' :
                                stats.averageScore >= 75 ? '⭐' :
                                    '📚'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    return (
        <div className={`border rounded-xl p-4 ${color}`}>
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-400 mb-1">{label}</div>
                    <div className="text-xl font-bold text-white truncate">{value}</div>
                </div>
            </div>
        </div>
    );
}
