'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    GraduationCap,
    Puzzle,
    Target,
    ArrowRight,
    Loader2,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyModule, ModuleProgress, UserAcademyStats } from '@/types/academy';
import { ProgressTracker } from '@/components/progress-tracker';
import { AchievementGrid } from '@/components/achievement-badge';

const ICON_MAP: Record<string, any> = {
    BookOpen,
    Puzzle,
    GraduationCap,
    Target
};

export default function AcademyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
    const [stats, setStats] = useState<UserAcademyStats>({
        totalLessonsCompleted: 0,
        totalExercisesSolved: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        achievementsUnlocked: 0
    });
    const [achievements, setAchievements] = useState<any[]>([]);
    const [userAchievements, setUserAchievements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadAcademyData();
        }
    }, [user]);

    const loadAcademyData = async () => {
        try {
            // Load modules
            const { data: modulesData, error: modulesError } = await supabase
                .from('academy_modules')
                .select('*')
                .order('order', { ascending: true });

            if (modulesError) throw modulesError;
            setModules(modulesData || []);

            // Load module progress
            const progressData: ModuleProgress[] = [];
            for (const module of modulesData || []) {
                // Count total lessons in module
                const { count: totalLessons } = await supabase
                    .from('academy_lessons')
                    .select('*', { count: 'exact', head: true })
                    .eq('module_id', module.id);

                // Count completed lessons by user
                const { data: completedLessons } = await supabase
                    .from('user_lesson_progress')
                    .select('lesson_id')
                    .eq('user_id', user!.id)
                    .eq('completed', true)
                    .in('lesson_id',
                        (await supabase
                            .from('academy_lessons')
                            .select('id')
                            .eq('module_id', module.id)
                        ).data?.map(l => l.id) || []
                    );

                const completed = completedLessons?.length || 0;
                const total = totalLessons || 0;

                progressData.push({
                    module,
                    totalLessons: total,
                    completedLessons: completed,
                    progressPercentage: total > 0 ? (completed / total) * 100 : 0
                });
            }
            setModuleProgress(progressData);

            // Load user stats
            const { data: lessonsProgress } = await supabase
                .from('user_lesson_progress')
                .select('*')
                .eq('user_id', user!.id)
                .eq('completed', true);

            const { data: exercisesProgress } = await supabase
                .from('user_exercise_progress')
                .select('*')
                .eq('user_id', user!.id)
                .eq('solved', true);

            const { data: userAchievementsData } = await supabase
                .from('user_achievements')
                .select('*')
                .eq('user_id', user!.id);

            const avgScore = lessonsProgress && lessonsProgress.length > 0
                ? lessonsProgress.reduce((sum, p) => sum + p.score, 0) / lessonsProgress.length
                : 0;

            setStats({
                totalLessonsCompleted: lessonsProgress?.length || 0,
                totalExercisesSolved: exercisesProgress?.length || 0,
                currentStreak: 0, // TODO: Calculate streak
                longestStreak: 0,
                totalTimeSpent: exercisesProgress?.reduce((sum, e) => sum + (e.time_spent || 0), 0) || 0,
                averageScore: avgScore,
                achievementsUnlocked: userAchievementsData?.length || 0
            });

            // Load achievements
            const { data: achievementsData } = await supabase
                .from('academy_achievements')
                .select('*');

            setAchievements(achievementsData || []);
            setUserAchievements(userAchievementsData || []);

        } catch (error) {
            console.error('Error loading academy data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                        <GraduationCap size={40} className="text-indigo-500" /> Acadèmia ChessHub
                    </h1>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        Millora el teu joc amb les nostres lliçons interactives. Des dels moviments bàsics fins a estratègies de Gran Mestre.
                    </p>
                </div>

                {/* PROGRESS OVERVIEW */}
                {stats.totalLessonsCompleted > 0 && (
                    <div className="mb-8">
                        <ProgressTracker moduleProgress={moduleProgress} stats={stats} />
                    </div>
                )}

                {/* MODULES GRID */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp className="text-indigo-400" size={24} />
                        <h2 className="text-2xl font-bold text-white">Mòduls d'Aprenentatge</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {modules.map((module) => {
                            const Icon = ICON_MAP[module.icon] || BookOpen;
                            const progress = moduleProgress.find(p => p.module.id === module.id);

                            return (
                                <Link
                                    key={module.id}
                                    href={`/academy/${module.id}`}
                                    className="block"
                                >
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition group cursor-pointer shadow-lg hover:shadow-indigo-900/20 h-full">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 group-hover:scale-110 transition-transform">
                                                <Icon className="text-indigo-400" size={32} />
                                            </div>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${module.level === 'Principiant' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                                    module.level === 'Intermedi' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' :
                                                        module.level === 'Avançat' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' :
                                                            'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                {module.level}
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                            {module.title}
                                        </h3>
                                        <p className="text-slate-400 mb-6 text-sm">{module.description}</p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="text-xs text-slate-500 font-bold flex items-center gap-1">
                                                <BookOpen size={14} /> {progress?.totalLessons || 0} Lliçons
                                            </div>
                                            <div className="text-indigo-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                {progress && progress.completedLessons > 0 ? 'Continuar' : 'Començar'}
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full transition-all duration-500"
                                                style={{ width: `${progress?.progressPercentage || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* QUICK ACCESS TO EXERCISES */}
                <Link href="/academy/exercises" className="block mb-8">
                    <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-2xl p-8 hover:border-amber-500/50 transition group cursor-pointer">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <Puzzle className="text-amber-400" size={32} />
                                    <h2 className="text-2xl font-bold text-white">Exercicis Tàctics</h2>
                                </div>
                                <p className="text-amber-200 mb-2">
                                    Practica tàctiques amb puzzles interactius
                                </p>
                                <p className="text-sm text-slate-400">
                                    {stats.totalExercisesSolved} exercicis resolts
                                </p>
                            </div>
                            <ArrowRight className="text-amber-400 group-hover:translate-x-2 transition-transform" size={32} />
                        </div>
                    </div>
                </Link>

                {/* ACHIEVEMENTS */}
                {achievements.length > 0 && (
                    <div className="mb-8">
                        <AchievementGrid
                            achievements={achievements}
                            userAchievements={userAchievements}
                        />
                    </div>
                )}

                {/* AI ANALYSIS CTA */}
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Vols entrenament personalitzat?</h2>
                    <p className="text-indigo-200 mb-6">
                        La nostra IA analitza les teves partides i et recomana exercicis específics.
                    </p>
                    <Link href="/profile">
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-900/50">
                            Analitzar les meves partides
                        </button>
                    </Link>
                </div>

            </div>
        </div>
    );
}

