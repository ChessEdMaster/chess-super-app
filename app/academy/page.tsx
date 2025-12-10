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
    TrendingUp,
    School,
    Trophy,
    BrainCircuit,
    Calculator,
    Palette,
    History
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyCourse, AcademyModule, UserAcademyStats } from '@/types/academy';
import { ProgressTracker } from '@/components/progress-tracker';
import { AchievementGrid } from '@/components/achievement-badge';

const TRACK_ICONS: Record<string, any> = {
    academic: GraduationCap,
    pedagogical: BrainCircuit,
    sport: Trophy,
    vocational: Target
};

const TRACK_TITLES: Record<string, string> = {
    academic: '🎓 Currículum Escolar Oficial',
    pedagogical: '📐 Escacs Transversals (Interdisciplinar)',
    sport: '⚽ Alt Rendiment Esportiu (Cross-Training)',
    vocational: '💼 Carrera Professional i Investigació'
};

const SUBJECT_ICONS: Record<string, any> = {
    matemàtiques: Calculator,
    geometria: Calculator,
    història: History,
    art: Palette,
    psicologia: BrainCircuit,
    futbol: Trophy
};

export default function AcademyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<AcademyCourse[]>([]);
    const [modules, setModules] = useState<AcademyModule[]>([]);
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
            // Load courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('academy_courses')
                .select('*')
                .order('target_grade');

            if (coursesError) {
                console.error('Error loading courses:', coursesError);
            }
            setCourses(coursesData || []);

            // Load all modules 
            const { data: modulesData } = await supabase
                .from('academy_modules')
                .select('*');
            setModules(modulesData || []);

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
                currentStreak: 0,
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

    // Group courses by track
    const tracks = ['academic', 'pedagogical', 'sport', 'vocational'];
    const groupedCourses = tracks.reduce((acc, track) => {
        acc[track] = courses.filter(c => (c.track || 'academic') === track);
        return acc;
    }, {} as Record<string, AcademyCourse[]>);

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col items-center justify-center mb-12 text-center">
                    <h1 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
                        <GraduationCap size={40} className="text-indigo-500" /> Acadèmia ChessHub
                    </h1>
                    <p className="text-slate-400 max-w-2xl text-lg">
                        El primer currículum d'escacs adaptat al Disseny Universal per l'Aprenentatge (DUA).
                        Des de P3 fins al Doctorat.
                    </p>
                </div>

                {/* PROGRESS OVERVIEW */}
                {stats.totalLessonsCompleted > 0 && (
                    <div className="mb-12">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="text-indigo-400" /> El teu Progrés Global
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-800 rounded-xl p-4">
                                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">Lliçons</div>
                                    <div className="text-2xl font-bold text-white">{stats.totalLessonsCompleted}</div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4">
                                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">Exercicis</div>
                                    <div className="text-2xl font-bold text-white">{stats.totalExercisesSolved}</div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4">
                                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">Temps</div>
                                    <div className="text-2xl font-bold text-white">{Math.round(stats.totalTimeSpent / 60)} min</div>
                                </div>
                                <div className="bg-slate-800 rounded-xl p-4">
                                    <div className="text-slate-400 text-xs uppercase font-bold mb-1">Assoliments</div>
                                    <div className="text-2xl font-bold text-white">{stats.achievementsUnlocked}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TRACK SECTIONS */}
                <div className="space-y-16">
                    {tracks.map(track => {
                        const trackCourses = groupedCourses[track];
                        if (!trackCourses || trackCourses.length === 0) return null;

                        const TrackIcon = TRACK_ICONS[track] || BookOpen;

                        return (
                            <section key={track} className="relative">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                                        <TrackIcon className="text-indigo-400" size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{TRACK_TITLES[track]}</h2>
                                        <p className="text-slate-400 text-sm">Target: {track === 'sport' ? 'Clubs i Federacions' : 'Escoles i Instituts'}</p>
                                    </div>
                                </div>

                                {/* Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {trackCourses.map(course => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* QUICK ACCESS TO EXERCISES & ANALYTICS */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link href="/academy/exercises" className="block">
                        <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-2xl p-8 hover:border-amber-500/50 transition group cursor-pointer h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Puzzle className="text-amber-400" size={32} />
                                    <h2 className="text-2xl font-bold text-white">Sala d'Entrenament</h2>
                                </div>
                                <ArrowRight className="text-amber-400 group-hover:translate-x-2 transition-transform" />
                            </div>
                            <p className="text-amber-200/80">
                                Accedeix directament als més de 5.000 exercicis tàctics classificats per tema i dificultat.
                            </p>
                        </div>
                    </Link>

                    <Link href="/profile" className="block">
                        <div className="bg-gradient-to-r from-indigo-900/20 to-blue-900/20 border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-500/50 transition group cursor-pointer h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <BrainCircuit className="text-indigo-400" size={32} />
                                    <h2 className="text-2xl font-bold text-white">Anàlisi amb IA</h2>
                                </div>
                                <ArrowRight className="text-indigo-400 group-hover:translate-x-2 transition-transform" />
                            </div>
                            <p className="text-indigo-200/80">
                                Revisa les teves partides i deixa que la IA detecti els teus patrons d'error més comuns.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function CourseCard({ course }: { course: AcademyCourse }) {

    // Get subject icons if any
    const firstSubject = course.subject_tags?.[0]?.toLowerCase();

    return (
        <Link href={`/academy/course/${course.id}`} className="block h-full">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/20 flex flex-col h-full group">
                {/* Cover Image */}
                <div className="h-32 bg-slate-800 relative overflow-hidden">
                    {course.image_url ? (
                        <img src={course.image_url} alt={course.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <School className="text-slate-700" size={48} />
                        </div>
                    )}

                    {/* Grade Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="bg-black/60 backdrop-blur border border-white/10 text-white text-xs font-bold px-2 py-1 rounded-md">
                            {course.target_grade}
                        </span>
                    </div>

                    {/* Subject Tags */}
                    {course.subject_tags && course.subject_tags.length > 0 && (
                        <div className="absolute bottom-3 right-3 flex gap-1">
                            {course.subject_tags.map(tag => (
                                <span key={tag} className="bg-indigo-600/80 backdrop-blur text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors">
                        {course.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-1">
                        {course.description}
                    </p>

                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                            <Target size={14} /> {course.difficulty_level === 'beginner' ? 'Principiant' : course.difficulty_level === 'intermediate' ? 'Intermedi' : 'Expert'}
                        </span>
                        <span className="text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Veure curs <ArrowRight size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
