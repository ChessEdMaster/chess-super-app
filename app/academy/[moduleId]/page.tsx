'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyModule, AcademyLesson } from '@/types/academy';
import { LearningSituationDashboard } from '@/components/academy/sa-view/learning-situation-dashboard';

export default function ModulePage() {
    const { moduleId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [module, setModule] = useState<AcademyModule | null>(null);
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [userModuleProgress, setUserModuleProgress] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setStudentId(params.get('studentId'));
    }, []);


    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && moduleId) {
            loadModuleData();
        }
    }, [user, moduleId]);

    const loadModuleData = async () => {
        try {
            // Load module
            const { data: moduleData, error: moduleError } = await supabase
                .from('academy_modules')
                .select('*')
                .eq('id', moduleId)
                .single();

            if (moduleError) throw moduleError;
            setModule(moduleData);

            // Load lessons
            const { data: lessonsData, error: lessonsError } = await supabase
                .from('academy_lessons')
                .select('*')
                .eq('module_id', moduleId)
                .order('order', { ascending: true });

            if (lessonsError) throw lessonsError;
            setLessons(lessonsData || []);

            // Load user progress
            let progressQuery = supabase
                .from('user_lesson_progress')
                .select('lesson_id')
                .eq('completed', true);

            if (studentId) {
                progressQuery = progressQuery.eq('student_id', studentId);
            } else {
                progressQuery = progressQuery.eq('user_id', user!.id);
            }

            const { data: progressData } = await progressQuery.in('lesson_id', (lessonsData || []).map(l => l.id));

            const completed = new Set(progressData?.map(p => p.lesson_id) || []);

            setCompletedLessons(completed);

            // Load module overall progress (SA self-evaluation)
            let modProgressQuery = supabase.from('user_module_progress').select('*').eq('module_id', moduleId);

            if (studentId) {
                modProgressQuery = modProgressQuery.eq('student_id', studentId);
            } else {
                modProgressQuery = modProgressQuery.eq('user_id', user!.id);
            }

            const { data: moduleProgressData } = await modProgressQuery.maybeSingle();


            setUserModuleProgress(moduleProgressData);

        } catch (error) {
            console.error('Error loading module data:', error);
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

    if (!module) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Mòdul no trobat</h1>
                    <Link href="/academy" className="text-indigo-400 hover:underline">
                        Tornar a l'acadèmia
                    </Link>
                </div>
            </div>
        );
    }

    const completedCount = lessons.filter(l => completedLessons.has(l.id)).length;
    const progressPercentage = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

    // SA MODE (Learning Situation)
    if (module.challenge_description) {
        return (
            <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
                <Link
                    href={`/academy${studentId ? `?studentId=${studentId}` : ''}`}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
                >
                    <ArrowLeft size={20} />
                    Tornar a l'acadèmia
                </Link>


                <LearningSituationDashboard
                    module={module}
                    lessons={lessons}
                    completedLessons={completedLessons}
                    userId={user.id}
                    userModuleProgress={userModuleProgress}
                />
            </div>
        );
    }

    // LEGACY / SIMPLE MODE
    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-4xl mx-auto space-y-6">

                <Link
                    href={`/academy${studentId ? `?studentId=${studentId}` : ''}`}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft size={20} />
                    Tornar a l'acadèmia
                </Link>


                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2 tracking-tight font-display">{module.title}</h1>
                            <p className="text-zinc-400 leading-relaxed max-w-2xl">{module.description}</p>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${module.level === 'Principiant' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' :
                            module.level === 'Intermedi' ? 'bg-amber-950/50 text-amber-400 border-amber-500/30' :
                                module.level === 'Avançat' ? 'bg-indigo-950/50 text-indigo-400 border-indigo-500/30' :
                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}>
                            {module.level}
                        </span>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                Progrés del Mòdul
                            </span>
                            <span className="text-xs font-mono font-bold text-indigo-400">
                                {progressPercentage.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <p className="text-right text-[10px] text-zinc-600 mt-2 font-medium">
                            {completedCount} de {lessons.length} lliçons completades
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
                        <BookOpen size={24} className="text-indigo-500" />
                        Pla d'Estudis
                    </h2>

                    {lessons.map((lesson, idx) => {
                        const isCompleted = completedLessons.has(lesson.id);
                        const isLocked = idx > 0 && !completedLessons.has(lessons[idx - 1].id);

                        return (
                            <Link
                                key={lesson.id}
                                href={isLocked ? '#' : `/academy/${moduleId}/${lesson.id}${studentId ? `?studentId=${studentId}` : ''}`}

                                className={`block group ${isLocked ? 'cursor-not-allowed' : ''}`}
                                onClick={(e) => isLocked && e.preventDefault()}
                            >
                                <div className={`
                                    relative overflow-hidden rounded-xl border p-5 transition-all duration-300
                                    ${isLocked
                                        ? 'bg-zinc-950/50 border-zinc-900 opacity-60'
                                        : 'bg-zinc-900/40 border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-900/10'
                                    }
                                `}>
                                    <div className="flex items-start gap-4">
                                        <div className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-display font-black text-lg
                                            ${isCompleted
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                : isLocked
                                                    ? 'bg-zinc-800/50 text-zinc-600 border border-zinc-800'
                                                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20'
                                            }
                                        `}>
                                            {isCompleted ? <CheckCircle size={20} /> : lesson.order}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className={`text-lg font-bold mb-1 truncate ${isLocked ? 'text-zinc-500' : 'text-zinc-200 group-hover:text-white'}`}>
                                                {lesson.title}
                                            </h3>
                                            <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                                                {lesson.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 self-center">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-6 rounded-full transform skew-x-12 ${i < lesson.difficulty
                                                        ? (isLocked ? 'bg-zinc-700' : 'bg-indigo-500')
                                                        : 'bg-zinc-800'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
