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
    Trophy,
    BrainCircuit,
    Calculator,
    Palette,
    History,
    Lock,
    School
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyCourse, UserAcademyStats } from '@/types/academy';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { motion } from 'framer-motion';

const TRACK_ICONS: Record<string, any> = {
    academic: GraduationCap,
    pedagogical: BrainCircuit,
    sport: Trophy,
    vocational: Target
};

const TRACK_TITLES: Record<string, string> = {
    academic: 'Currículum Escolar',
    pedagogical: 'Escacs Transversals',
    sport: 'Alt Rendiment',
    vocational: 'Carrera Professional'
};

export default function AcademyPage() {
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const [courses, setCourses] = useState<AcademyCourse[]>([]);
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
        if (user && !authLoading) {
            loadAcademyData();
        }
    }, [user, authLoading]);

    const loadAcademyData = async () => {
        try {
            let accessibleCourseIds: string[] = [];
            let isSuperAdmin = role === 'SuperAdmin' || user?.email === 'marc@marc.com';

            if (isSuperAdmin) {
                const { data: allCourses } = await supabase
                    .from('academy_courses')
                    .select('*')
                    .eq('published', true)
                    .order('title');

                if (allCourses) setCourses(allCourses);
            } else {
                const { data: clubMemberships } = await supabase
                    .from('club_members')
                    .select(`
                        club:clubs (
                            id,
                            course_id
                        )
                    `)
                    .eq('user_id', user!.id);

                if (clubMemberships) {
                    // @ts-ignore
                    accessibleCourseIds = clubMemberships
                        .map((m: any) => m.club?.course_id)
                        .filter((id: string) => id);
                }

                if (accessibleCourseIds.length > 0) {
                    const { data: userCourses } = await supabase
                        .from('academy_courses')
                        .select('*')
                        .in('id', accessibleCourseIds)
                        .eq('published', true)
                        .order('title');

                    if (userCourses) {
                        setCourses(userCourses);
                        if (userCourses.length === 1) {
                            router.push(`/academy/course/${userCourses[0].id}`);
                            return;
                        }
                    }
                } else {
                    setCourses([]);
                }
            }

            // Stats
            const { data: lessonsProgress } = await supabase.from('user_lesson_progress').select('*').eq('user_id', user!.id).eq('completed', true);
            const { data: exercisesProgress } = await supabase.from('user_exercise_progress').select('*').eq('user_id', user!.id).eq('solved', true);
            const { data: userAchievementsData } = await supabase.from('user_achievements').select('*').eq('user_id', user!.id);

            setStats({
                totalLessonsCompleted: lessonsProgress?.length || 0,
                totalExercisesSolved: exercisesProgress?.length || 0,
                currentStreak: 0,
                longestStreak: 0,
                totalTimeSpent: exercisesProgress?.reduce((sum, e) => sum + (e.time_spent || 0), 0) || 0,
                averageScore: 0,
                achievementsUnlocked: userAchievementsData?.length || 0
            });

            setLoading(false);

        } catch (error) {
            console.error('Error loading academy data:', error);
            setLoading(false);
        }
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    const visibleCourses = courses.filter(c => (c.subject || 'chess') === selectedSubject);
    const tracks = ['academic', 'pedagogical', 'sport', 'vocational'];
    const groupedCourses = tracks.reduce((acc, track) => {
        acc[track] = visibleCourses.filter(c => (c.track || 'academic') === track);
        return acc;
    }, {} as Record<string, AcademyCourse[]>);

    return (
        <div className="h-full w-full p-6 pb-24 max-w-[1600px] mx-auto flex flex-col gap-8">

            {/* HEADER */}
            <Panel className="flex flex-col md:flex-row items-center justify-between p-6 bg-zinc-900/90 border-zinc-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg border border-white/20">
                        <GraduationCap className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-500 uppercase tracking-tight font-display drop-shadow-sm text-stroke">
                            Acadèmia
                        </h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
                            Mestratge i Sabiduria
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <Link href="/academy/concepts">
                        <ShinyButton variant="secondary" className="px-6 h-12 text-xs uppercase tracking-wider">
                            <BrainCircuit size={18} className="mr-2" /> Conceptes
                        </ShinyButton>
                    </Link>

                    {stats.totalLessonsCompleted > 0 && (
                        <GameCard variant="default" className="px-6 py-2 flex items-center gap-6 bg-zinc-900/80 border-zinc-700 h-12">
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Lliçons</span>
                                <span className="text-lg font-black text-white font-display text-shadow">{stats.totalLessonsCompleted}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="flex flex-col items-center leading-none">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider mb-0.5">Exercicis</span>
                                <span className="text-lg font-black text-white font-display text-shadow">{stats.totalExercisesSolved}</span>
                            </div>
                        </GameCard>
                    )}
                </div>
            </Panel>

            {/* SUBJECT SELECTOR */}
            <SubjectSelector selected={selectedSubject} onSelect={setSelectedSubject} />

            {/* EMPTY STATE */}
            {visibleCourses.length === 0 && (
                <GameCard variant="default" className="text-center py-20 bg-zinc-900/50 border-dashed border-zinc-700/50">
                    <Lock className="mx-auto text-zinc-700 mb-6 opacity-50" size={64} />
                    <h2 className="text-2xl font-black text-zinc-400 mb-2 font-display uppercase tracking-wide">No Courses Available</h2>
                    <p className="text-zinc-500 max-w-lg mx-auto mb-8 text-sm font-bold">
                        Subject: <span className="text-emerald-500">{SUBJECTS[selectedSubject]?.label}</span>
                    </p>
                </GameCard>
            )}

            {/* TRACK SECTIONS */}
            {visibleCourses.length > 0 && (
                <div className="space-y-12">
                    {selectedSubject === 'chess' ? (
                        tracks.map(track => {
                            const trackCourses = groupedCourses[track];
                            if (!trackCourses || trackCourses.length === 0) return null;
                            const TrackIcon = TRACK_ICONS[track] || BookOpen;
                            return (
                                <section key={track} className="relative">
                                    <div className="flex items-center gap-3 mb-6 pl-2">
                                        <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700 shadow-inner">
                                            <TrackIcon className="text-emerald-500" size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white font-display uppercase tracking-wide leading-none">{TRACK_TITLES[track]}</h2>
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mt-1">
                                                Target: {track === 'sport' ? 'Clubs i Federacions' : 'Escoles i Instituts'}
                                            </p>
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
                            <div className="flex items-center gap-3 mb-6 pl-2">
                                <div className="p-2 bg-zinc-800 rounded-lg border border-zinc-700 shadow-inner">
                                    <GraduationCap className="text-emerald-500" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white font-display uppercase tracking-wide leading-none">Currículum de {SUBJECTS[selectedSubject]?.label}</h2>
                                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mt-1">Des de P3 fins al Doctorat</p>
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
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide">
            {Object.entries(SUBJECTS).map(([key, data]) => {
                const Icon = data.icon;
                const isSelected = selected === key;
                return (
                    <button
                        key={key}
                        onClick={() => onSelect(key)}
                        className={`
                            relative px-5 py-3 rounded-xl flex items-center gap-3 transition-all min-w-[140px]
                            border-2
                            ${isSelected
                                ? 'bg-zinc-800 border-emerald-500 shadow-lg shadow-emerald-900/20 translate-y-[-2px]'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-300'}
                        `}
                    >
                        <Icon size={18} className={isSelected ? 'text-emerald-400' : 'opacity-50'} />
                        <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-emerald-100' : ''}`}>{data.label}</span>
                    </button>
                )
            })}
        </div>
    )
}


function CourseCard({ course }: { course: AcademyCourse }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
        >
            <Link href={`/academy/course/${course.id}`} className="block h-full cursor-pointer">
                <GameCard variant="default" className="h-full flex flex-col p-0 overflow-hidden group hover:border-emerald-500/50 transition-colors bg-zinc-900/80">
                    {/* Cover Image */}
                    <div className="h-40 bg-zinc-950 relative overflow-hidden border-b border-zinc-800">
                        {course.image_url ? (
                            <Image
                                src={course.image_url}
                                alt={course.title}
                                fill
                                className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-950 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                                <School className="text-zinc-800 group-hover:text-emerald-900/40 transition-colors duration-500" size={64} />
                            </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent" />

                        {/* Grade Badge */}
                        <div className="absolute top-3 left-3">
                            <span className="bg-black/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider font-display shadow-lg">
                                {course.target_grade}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1 relative z-10">
                        <h3 className="text-lg font-black text-white mb-2 leading-tight group-hover:text-emerald-400 transition-colors font-display tracking-wide uppercase">
                            {course.title}
                        </h3>
                        <p className="text-zinc-500 text-xs line-clamp-3 mb-6 flex-1 leading-relaxed font-bold">
                            {course.description}
                        </p>

                        <div className="border-t border-zinc-800 pt-4 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-auto">
                            <span className="flex items-center gap-1.5 bg-zinc-950/50 px-2 py-1 rounded border border-zinc-800">
                                <Target size={12} className="text-amber-500" />
                                {course.difficulty_level === 'beginner' ? 'Novell' : course.difficulty_level === 'intermediate' ? 'Intermedi' : 'Expert'}
                            </span>
                            <ShinyButton variant="neutral" className="h-7 text-[9px] px-3">
                                Entrar
                            </ShinyButton>
                        </div>
                    </div>
                </GameCard>
            </Link>
        </motion.div>
    );
}
