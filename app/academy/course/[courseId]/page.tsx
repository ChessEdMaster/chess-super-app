'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
import { Panel } from '@/components/ui/design-system/Panel';
import { Button } from '@/components/ui/button';

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
        const loadCourseData = async () => {
            if (!user || !courseId) return;

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

                for (const courseModule of modulesData || []) {
                    // Count lessons
                    const { count: totalLessons } = await supabase
                        .from('academy_lessons')
                        .select('*', { count: 'exact', head: true })
                        .eq('module_id', courseModule.id);

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
                                .eq('module_id', courseModule.id)
                            ).data?.map(l => l.id) || []
                        );

                    const completed = completedLessons?.length || 0;
                    const total = totalLessons || 0;

                    progressMap[courseModule.id] = {
                        module: courseModule,
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

        loadCourseData();
    }, [user, courseId]);

    if (authLoading || loading || !course) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 p-6 font-sans text-slate-200">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">

                {/* Back Button */}
                <Link href="/academy">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-white/5 gap-2 pl-0">
                        <ArrowLeft size={20} /> <span className="uppercase font-bold tracking-wider text-xs">Back to Curriculum</span>
                    </Button>
                </Link>

                {/* HERO SECTION */}
                <Panel className="relative rounded-3xl overflow-hidden bg-zinc-900 border-zinc-700 min-h-[300px] flex flex-col justify-end">
                    <div className="absolute inset-0">
                        {course.image_url && (
                            <Image
                                src={course.image_url}
                                className="object-cover opacity-40"
                                alt={course.title}
                                fill
                                unoptimized
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-transparent" />
                    </div>

                    <div className="relative p-8 max-w-3xl z-10">
                        <div className="flex gap-3 mb-4">
                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                                {course.target_grade}
                            </span>
                            {course.subject_tags?.map(tag => (
                                <span key={tag} className="bg-zinc-800/80 text-zinc-300 border border-zinc-600/50 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-none font-display text-stroke uppercase tracking-wide drop-shadow-xl">
                            {course.title}
                        </h1>
                        <p className="text-sm md:text-base text-zinc-300 mb-2 leading-relaxed font-medium max-w-2xl text-shadow">
                            {course.description}
                        </p>
                    </div>
                </Panel>

                {/* MODULES LIST / MAP */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <BookOpen className="text-amber-500" size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display">
                        Course Content
                    </h2>
                </div>

                {/* Conditional View Rendering */}
                {isGamifiedGrade(course.target_grade) ? (
                    <GamifiedCourseView modules={modules} progressMap={moduleProgress} />
                ) : (
                    <AcademicCourseView modules={modules} progressMap={moduleProgress} />
                )}

                {modules.length === 0 && (
                    <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-zinc-800 border-dashed animate-in fade-in zoom-in">
                        <BookOpen size={64} className="text-zinc-800 mx-auto mb-6" />
                        <h3 className="text-xl font-black text-zinc-500 uppercase tracking-wide mb-2">Coming Soon</h3>
                        <p className="text-zinc-600 font-bold text-sm">This course is currently being built.</p>
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
