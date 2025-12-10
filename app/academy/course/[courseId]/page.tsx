'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BookOpen,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyCourse, AcademyModule, ModuleProgress } from '@/types/academy';
import { GamifiedCourseView } from '@/components/academy/gamified-course-view';
import { AcademicCourseView } from '@/components/academy/academic-course-view';

export default function CoursePage() {
    const { courseId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [course, setCourse] = useState<AcademyCourse | null>(null);
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && courseId) {
            loadCourseData();
        }
    }, [user, courseId]);

    const loadCourseData = async () => {
        try {
            // Load course details
            const { data: courseData, error: courseError } = await supabase
                .from('academy_courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseError) throw courseError;
            setCourse(courseData);

            // Load modules for this course
            const { data: modulesData, error: modulesError } = await supabase
                .from('academy_modules')
                .select('*')
                .eq('course_id', courseId)
                .order('order', { ascending: true });

            if (modulesError) throw modulesError;
            setModules(modulesData || []);

            // Calculate progress for each module
            const progressMap: Record<string, ModuleProgress> = {};

            for (const module of modulesData || []) {
                // Count lessons
                const { count: totalLessons } = await supabase
                    .from('academy_lessons')
                    .select('*', { count: 'exact', head: true })
                    .eq('module_id', module.id);

                // Count completed
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

                progressMap[module.id] = {
                    module,
                    totalLessons: total,
                    completedLessons: completed,
                    progressPercentage: total > 0 ? (completed / total) * 100 : 0
                };
            }
            setModuleProgress(progressMap);

        } catch (error) {
            console.error('Error loading course:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading || !course) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-200">
            <div className="max-w-5xl mx-auto">
                <Link href="/academy" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-8">
                    <ArrowLeft size={20} /> Tornar al Curriculum
                </Link>

                {/* HERO SECTION */}
                <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 mb-12">
                    <div className="absolute inset-0">
                        {course.image_url && (
                            <img src={course.image_url} className="w-full h-full object-cover opacity-20" alt={course.title} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
                    </div>

                    <div className="relative p-10 max-w-2xl">
                        <div className="flex gap-2 mb-4">
                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {course.target_grade}
                            </span>
                            {course.subject_tags?.map(tag => (
                                <span key={tag} className="bg-slate-700/50 text-slate-300 border border-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {course.title}
                        </h1>
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                            {course.description}
                        </p>
                    </div>
                </div>

                {/* MODULES LIST / MAP */}
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <BookOpen className="text-indigo-400" /> Contingut del Curs
                </h2>

                {/* Conditional View Rendering */}
                {isGamifiedGrade(course.target_grade) ? (
                    <GamifiedCourseView modules={modules} progressMap={moduleProgress} />
                ) : (
                    <AcademicCourseView modules={modules} progressMap={moduleProgress} />
                )}

                {modules.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                        <BookOpen size={48} className="text-slate-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-500">Aquest curs encara no té contingut</h3>
                        <p className="text-slate-600">Torna més tard per veure noves lliçons.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to determine if we should show the Gamified Map
function isGamifiedGrade(grade: string): boolean {
    const gamifiedGrades = ['Infantil', 'P3', 'P4', 'P5', '1r Primària', '2n Primària', '3r Primària', '4t Primària'];
    // Check if grade starts with any of the gamified markers or is in the list
    if (!grade) return false;
    return gamifiedGrades.some(g => grade === g || grade.startsWith(g)) || grade.includes('Infantil');
}
