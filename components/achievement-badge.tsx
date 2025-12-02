'use client';

import React from 'react';
import { Trophy, Lock, Unlock } from 'lucide-react';
import { UserAchievement, AcademyAchievement, AchievementRequirement } from '@/lib/academy-types';

interface AchievementBadgeProps {
    achievement: AcademyAchievement;
    unlocked?: boolean;
    unlockedAt?: string;
    size?: 'small' | 'medium' | 'large';
}

export function AchievementBadge({
    achievement,
    unlocked = false,
    unlockedAt,
    size = 'medium'
}: AchievementBadgeProps) {

    const sizeClasses = {
        small: 'w-16 h-16 text-2xl',
        medium: 'w-20 h-20 text-3xl',
        large: 'w-24 h-24 text-4xl'
    };

    const iconSize = {
        small: 32,
        medium: 40,
        large: 48
    };

    return (
        <div className={`relative group ${unlocked ? '' : 'opacity-50 grayscale'}`}>
            <div className={`
        ${sizeClasses[size]}
        rounded-xl border-2 
        ${unlocked
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50'
                    : 'bg-slate-800 border-slate-700'
                }
        flex items-center justify-center
        transition-all duration-300
        ${unlocked ? 'hover:scale-110 hover:shadow-lg hover:shadow-amber-500/20' : ''}
      `}>
                {unlocked ? (
                    <Trophy className="text-amber-400" size={iconSize[size]} />
                ) : (
                    <Lock className="text-slate-500" size={iconSize[size]} />
                )}
            </div>

            {/* TOOLTIP */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl min-w-[200px]">
                    <div className="flex items-start gap-2 mb-2">
                        {unlocked ? (
                            <Unlock className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                        ) : (
                            <Lock className="text-slate-500 flex-shrink-0 mt-0.5" size={16} />
                        )}
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white mb-1">
                                {achievement.title}
                            </h4>
                            <p className="text-xs text-slate-400">
                                {achievement.description}
                            </p>
                        </div>
                    </div>

                    {unlocked && unlockedAt && (
                        <div className="text-xs text-emerald-400 mt-2 pt-2 border-t border-slate-700">
                            Desbloquejat: {new Date(unlockedAt).toLocaleDateString('ca-ES')}
                        </div>
                    )}

                    {!unlocked && (
                        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-700">
                            {getRequirementText(achievement.requirement)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getRequirementText(requirement: AchievementRequirement): string {
    switch (requirement.type) {
        case 'lessons_completed':
            return `Completa ${requirement.count} lliçons`;
        case 'exercises_solved':
            return `Resol ${requirement.count} exercicis`;
        case 'streak_days':
            return `Estudia ${requirement.count} dies seguits`;
        case 'perfect_lesson':
            return 'Completa una lliçó amb puntuació perfecta';
        case 'module_completed':
            return 'Completa tot el mòdul';
        default:
            return 'Requisit desconegut';
    }
}

interface AchievementGridProps {
    achievements: AcademyAchievement[];
    userAchievements: UserAchievement[];
}

export function AchievementGrid({ achievements, userAchievements }: AchievementGridProps) {
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
                <Trophy className="text-amber-400" size={24} />
                <h2 className="text-xl font-bold text-white">
                    Assoliments
                </h2>
                <span className="ml-auto text-sm text-slate-400">
                    {userAchievements.length} / {achievements.length}
                </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {achievements.map((achievement) => {
                    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
                    return (
                        <AchievementBadge
                            key={achievement.id}
                            achievement={achievement}
                            unlocked={unlockedIds.has(achievement.id)}
                            unlockedAt={userAchievement?.unlocked_at}
                            size="medium"
                        />
                    );
                })}
            </div>
        </div>
    );
}
