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
            <div className="min-h-screen flex items-center justify-center">
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
        <div className="h-full w-full p-6 overflow-y-auto scrollbar-subtle max-w-7xl mx-auto pb-24">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 uppercase tracking-widest italic font-display drop-shadow-lg mb-2">
                        Acadèmia
                    </h1>
                    <p className="text-zinc-400 font-light flex items-center gap-2 text-sm">
                        <GraduationCap size={18} className="text-emerald-500" />
                        Mestratge i Sabiduria
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/academy/concepts" className="glass-panel px-4 py-2 rounded-lg bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 transition flex items-center gap-2 group">
                        <BrainCircuit size={20} className="text-purple-400 group-hover:text-purple-300" />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Conceptes</span>
                    </Link>

                    {stats.totalLessonsCompleted > 0 && (
                        <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-4 bg-zinc-900/60">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Lliçons</span>
                                <span className="text-xl font-black text-white font-display">{stats.totalLessonsCompleted}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Exercicis</span>
                                <span className="text-xl font-black text-white font-display">{stats.totalExercisesSolved}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SUBJECT SELECTOR */}
            <SubjectSelector selected={selectedSubject} onSelect={setSelectedSubject} />

            {/* EMPTY STATE */}
            {visibleCourses.length === 0 && (
                <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 mb-20 animate-in fade-in zoom-in duration-500">
                    <Lock className="mx-auto text-zinc-700 mb-6" size={64} />
                    <h2 className="text-2xl font-bold text-white mb-4 font-display uppercase tracking-wide">No hi ha cursos disponibles</h2>
                    <p className="text-zinc-400 max-w-lg mx-auto mb-8 text-sm">
                        De l'assignatura <span className="text-emerald-400 font-bold">{SUBJECTS[selectedSubject]?.label}</span>.
                        Estem treballant en els continguts.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/" className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold transition font-display uppercase text-xs tracking-wider">
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
                                    <div className="flex items-center gap-3 mb-4 pl-1">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                            <TrackIcon className="text-emerald-400" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide">{TRACK_TITLES[track]}</h2>
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Target: {track === 'sport' ? 'Clubs i Federacions' : 'Escoles i Instituts'}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {trackCourses.map(course => (
                                            <CourseCard key={course.id} course={course} />
                                        ))}
                                    </div>
                                </section>
                            );
                        })
                    ) : (
                        <section className="relative">
                            <div className="flex items-center gap-3 mb-4 pl-1">
                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <GraduationCap className="text-emerald-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white font-display uppercase tracking-wide">Currículum de {SUBJECTS[selectedSubject]?.label}</h2>
                                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Des de P3 fins al Doctorat</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {visibleCourses.map(course => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

const SUBJECTS: Record<string, { label: string, icon: any, color: string }> = {
    chess: { label: 'Escacs', icon: Target, color: 'text-indigo-400' },
    language: { label: 'Llengua', icon: BookOpen, color: 'text-emerald-400' },
    math: { label: 'Matemàtiques', icon: Calculator, color: 'text-blue-400' },
    history: { label: 'Història', icon: History, color: 'text-amber-400' },
    art: { label: 'Art', icon: Palette, color: 'text-pink-400' },
    football: { label: 'Futbol', icon: Trophy, color: 'text-green-400' },
};

function SubjectSelector({ selected, onSelect }: { selected: string, onSelect: (s: string) => void }) {
    return (
        <div className="flex overflow-x-auto gap-2 pb-6 mb-2 no-scrollbar pl-1">
            {Object.entries(SUBJECTS).map(([key, data]) => {
                const Icon = data.icon;
                const isSelected = selected === key;
                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`
                            glass-panel px-4 py-2 rounded-lg flex items-center gap-2 transition-all
                            ${isSelected
                                ? 'bg-zinc-800 border-emerald-500/50 text-white shadow-lg'
                                : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-white'}
                        `}
                    >
                        <Icon size={16} className={isSelected ? 'text-emerald-400' : 'opacity-50'} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : ''}`}>{data.label}</span>
                    </button>
                )
            })}
        </div>
    )
}


function CourseCard({ course }: { course: AcademyCourse }) {
    return (
        <Link href={`/academy/course/${course.id}`} className="block h-full group">
            <div className="glass-panel p-0 rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:border-emerald-500/30 group-hover:shadow-lg group-hover:shadow-emerald-900/20 group-hover:-translate-y-1">
                {/* Cover Image */}
                <div className="h-32 bg-zinc-900 relative overflow-hidden">
                    {course.image_url ? (
                        <Image
                            src={course.image_url}
                            alt={course.title}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105"
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                            <School className="text-zinc-800 group-hover:text-emerald-900/50 transition-colors duration-500" size={48} />
                        </div>
                    )}

                    {/* Grade Badge */}
                    <div className="absolute top-2 left-2">
                        <span className="bg-black/40 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider font-display shadow-sm">
                            {course.target_grade}
                        </span>
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-1 bg-zinc-950/20">
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors font-display tracking-wide">
                        {course.title}
                    </h3>
                    <p className="text-zinc-400 text-xs line-clamp-3 mb-4 flex-1 leading-relaxed">
                        {course.description}
                    </p>

                    <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                            <Target size={12} className="text-emerald-500" />
                            {course.difficulty_level === 'beginner' ? 'Novell' : course.difficulty_level === 'intermediate' ? 'Intermedi' : 'Expert'}
                        </span>
                        <span className="text-emerald-500/80 flex items-center gap-1 group-hover:translate-x-1 transition-transform group-hover:text-emerald-400">
                            Entrar <ArrowRight size={12} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
