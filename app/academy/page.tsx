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
    History,
    Lock
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyCourse, AcademyModule, UserAcademyStats } from '@/types/academy';

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

export default function AcademyPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<AcademyCourse[]>([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<UserAcademyStats>({
        totalLessonsCompleted: 0,
        totalExercisesSolved: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        achievementsUnlocked: 0
    });
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
            // 1. Load All Public Courses
            const { data: coursesData, error: coursesError } = await supabase
                .from('academy_courses')
                .select('*')
                .eq('published', true)
                .order('target_grade');

            if (coursesData) setCourses(coursesData);

            // 2. Load Enrollments
            const { data: enrollData } = await supabase
                .from('academy_enrollments')
                .select('course_id')
                .eq('user_id', user!.id);

            const enrolledSet = new Set(enrollData?.map(e => e.course_id) || []);
            setEnrolledCourseIds(enrolledSet);

            // 3. Load Stats
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

            setStats({
                totalLessonsCompleted: lessonsProgress?.length || 0,
                totalExercisesSolved: exercisesProgress?.length || 0,
                currentStreak: 0,
                longestStreak: 0,
                totalTimeSpent: exercisesProgress?.reduce((sum, e) => sum + (e.time_spent || 0), 0) || 0,
                averageScore: 0,
                achievementsUnlocked: userAchievementsData?.length || 0
            });

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

    // Filter courses: Only show enrolled ones
    const visibleCourses = courses.filter(c => enrolledCourseIds.has(c.id));

    // Group courses by track
    const tracks = ['academic', 'pedagogical', 'sport', 'vocational'];
    const groupedCourses = tracks.reduce((acc, track) => {
        acc[track] = visibleCourses.filter(c => (c.track || 'academic') === track);
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

                {/* EMPTY STATE */}
                {visibleCourses.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 mb-20">
                        <Lock className="mx-auto text-slate-700 mb-6" size={64} />
                        <h2 className="text-2xl font-bold text-white mb-4">No tens cursos actius</h2>
                        <p className="text-slate-400 max-w-lg mx-auto mb-8">
                            Actualment no estàs inscrit a cap curs oficial.
                            Demana al teu professor o administrador del club que t'assigni un curs.
                        </p>
                        <Link href="/clubs" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition">
                            <School size={20} /> Anar al meu Club/Escola
                        </Link>
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
            </div>
        </div>
    );
}

function CourseCard({ course }: { course: AcademyCourse }) {
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
