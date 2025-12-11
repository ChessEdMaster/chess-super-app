'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    GraduationCap,
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

const TRACK_ICONS: Record<string, React.ElementType> = {
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
    const [selectedSubject, setSelectedSubject] = useState('chess');

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
            // We fetch ALL courses and filter client side for better UX when switching tabs
            const { data: coursesData, error: coursesError } = await supabase
                .from('academy_courses')
                .select('*')
                .eq('published', true)
                .order('target_grade'); // Sort by grade naturally P3 -> ...

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

    // Filter courses by subject
    const visibleCourses = courses.filter(c => (c.subject || 'chess') === selectedSubject);

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
                <div className="flex flex-col items-center justify-center mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                        <GraduationCap size={32} className="text-indigo-500" /> Acadèmia ChessHub
                    </h1>
                    <p className="text-slate-400 max-w-2xl text-base">
                        El primer currículum d&apos;escacs adaptat al Disseny Universal per l&apos;Aprenentatge (DUA).
                        Des de P3 fins al Doctorat.
                    </p>
                </div>

                {/* PROGRESS OVERVIEW */}
                {stats.totalLessonsCompleted > 0 && (
                    <div className="mb-8">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <TrendingUp className="text-indigo-400" size={18} /> El teu Progrés Global
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Lliçons</div>
                                    <div className="text-xl font-bold text-white">{stats.totalLessonsCompleted}</div>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Exercicis</div>
                                    <div className="text-xl font-bold text-white">{stats.totalExercisesSolved}</div>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Temps</div>
                                    <div className="text-xl font-bold text-white">{Math.round(stats.totalTimeSpent / 60)} min</div>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-3">
                                    <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Assoliments</div>
                                    <div className="text-xl font-bold text-white">{stats.achievementsUnlocked}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUBJECT SELECTOR */}
                <SubjectSelector selected={selectedSubject} onSelect={setSelectedSubject} />

                {/* EMPTY STATE */}
                {visibleCourses.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 mb-20 animate-in fade-in zoom-in duration-500">
                        <Lock className="mx-auto text-slate-700 mb-6" size={64} />
                        <h2 className="text-2xl font-bold text-white mb-4">No hi ha cursos disponibles de {SUBJECTS[selectedSubject]?.label}</h2>
                        <p className="text-slate-400 max-w-lg mx-auto mb-8">
                            Encara no hem publicat el currículum per aquesta assignatura.
                            Estem treballant en els continguts de {SUBJECTS[selectedSubject]?.label}.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/" className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition">
                                Tornar a l&apos;Inici
                            </Link>
                        </div>
                    </div>
                )}

                {/* TRACK SECTIONS (Only for Chess or if tracks exist) */}
                {visibleCourses.length > 0 && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                        {selectedSubject === 'chess' ? (
                            tracks.map(track => {
                                const trackCourses = groupedCourses[track];
                                if (!trackCourses || trackCourses.length === 0) return null;
                                const TrackIcon = TRACK_ICONS[track] || BookOpen;
                                return (
                                    <section key={track} className="relative">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <TrackIcon className="text-indigo-400" size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-white">{TRACK_TITLES[track]}</h2>
                                                <p className="text-slate-400 text-xs">Target: {track === 'sport' ? 'Clubs i Federacions' : 'Escoles i Instituts'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {trackCourses.map(course => (
                                                <CourseCard key={course.id} course={course} />
                                            ))}
                                        </div>
                                    </section>
                                );
                            })
                        ) : (
                            <section className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <GraduationCap className="text-indigo-400" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Currículum de {SUBJECTS[selectedSubject]?.label}</h2>
                                        <p className="text-slate-400 text-xs">Des de P3 fins al Doctorat</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {visibleCourses.map(course => (
                                        <CourseCard key={course.id} course={course} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const SUBJECTS: Record<string, { label: string, icon: React.ElementType, color: string }> = {
    chess: { label: 'Escacs', icon: Target, color: 'text-indigo-400' },
    language: { label: 'Llengua', icon: BookOpen, color: 'text-emerald-400' },
    math: { label: 'Matemàtiques', icon: Calculator, color: 'text-blue-400' },
    history: { label: 'Història', icon: History, color: 'text-amber-400' },
    art: { label: 'Art', icon: Palette, color: 'text-pink-400' },
    football: { label: 'Futbol', icon: Trophy, color: 'text-green-400' },
};

function SubjectSelector({ selected, onSelect }: { selected: string, onSelect: (s: string) => void }) {
    return (
        <div className="flex overflow-x-auto gap-2 pb-6 mb-2 no-scrollbar">
            {Object.entries(SUBJECTS).map(([key, data]) => {
                const Icon = data.icon;
                const isSelected = selected === key;
                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all border
                            ${isSelected
                                ? 'bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                        `}
                    >
                        <Icon size={16} className={isSelected ? data.color : 'opacity-50'} />
                        <span className={`text-sm font-bold ${isSelected ? '' : 'font-medium'}`}>{data.label}</span>
                    </button>
                )
            })}
        </div>
    )
}


function CourseCard({ course }: { course: AcademyCourse }) {
    return (
        <Link href={`/academy/course/${course.id}`} className="block h-full">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/20 flex flex-col h-full group">
                {/* Cover Image */}
                <div className="h-28 bg-slate-800 relative overflow-hidden">
                    {course.image_url ? (
                        <Image
                            src={course.image_url}
                            alt={course.title}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <School className="text-slate-700" size={32} />
                        </div>
                    )}

                    {/* Grade Badge */}
                    <div className="absolute top-2 left-2">
                        <span className="bg-black/60 backdrop-blur border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {course.target_grade}
                        </span>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-white mb-1 leading-tight group-hover:text-indigo-400 transition-colors">
                        {course.title}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-3 mb-3 flex-1">
                        {course.description}
                    </p>

                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                            <Target size={12} /> {course.difficulty_level === 'beginner' ? 'Principiant' : course.difficulty_level === 'intermediate' ? 'Intermedi' : 'Expert'}
                        </span>
                        <span className="text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Veure curs <ArrowRight size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
