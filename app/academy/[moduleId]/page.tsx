'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, BookOpen, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyModule, AcademyLesson } from '@/lib/academy-types';

export default function ModulePage() {
    const { moduleId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [module, setModule] = useState<AcademyModule | null>(null);
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

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
            const { data: progressData } = await supabase
                .from('user_lesson_progress')
                .select('lesson_id')
                .eq('user_id', user!.id)
                .eq('completed', true)
                .in('lesson_id', (lessonsData || []).map(l => l.id));

            const completed = new Set(progressData?.map(p => p.lesson_id) || []);
            setCompletedLessons(completed);

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

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-4xl mx-auto">

                <Link
                    href="/academy"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
                >
                    <ArrowLeft size={20} />
                    Tornar a l'acadèmia
                </Link>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">{module.title}</h1>
                            <p className="text-slate-400">{module.description}</p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${module.level === 'Principiant' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' :
                                module.level === 'Intermedi' ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' :
                                    module.level === 'Avançat' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' :
                                        'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                            {module.level}
                        </span>
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">
                                Progrés: {completedCount} / {lessons.length} lliçons
                            </span>
                            <span className="text-sm text-slate-400">
                                {progressPercentage.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <BookOpen size={24} className="text-indigo-400" />
                        Lliçons
                    </h2>

                    {lessons.map((lesson, idx) => {
                        const isCompleted = completedLessons.has(lesson.id);
                        const isLocked = idx > 0 && !completedLessons.has(lessons[idx - 1].id);

                        return (
                            <Link
                                key={lesson.id}
                                href={isLocked ? '#' : `/academy/${moduleId}/${lesson.id}`}
                                className={`block ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                onClick={(e) => isLocked && e.preventDefault()}
                            >
                                <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 transition ${isLocked ? '' : 'hover:border-indigo-500/50 cursor-pointer'
                                    }`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-sm font-bold text-slate-500">
                                                    Lliçó {lesson.order}
                                                </span>
                                                {isCompleted && (
                                                    <CheckCircle className="text-emerald-400" size={20} />
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">
                                                {lesson.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm">
                                                {lesson.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {Array.from({ length: lesson.difficulty }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-2 h-6 bg-indigo-500 rounded"
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
