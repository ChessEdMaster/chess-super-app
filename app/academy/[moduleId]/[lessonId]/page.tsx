'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyLesson } from '@/types/academy';
import { LessonViewer } from '@/components/lesson-viewer';

export default function LessonPage() {
    const { moduleId, lessonId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [lesson, setLesson] = useState<AcademyLesson | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user && lessonId) {
            loadLesson();
        }
    }, [user, lessonId]);

    const loadLesson = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_lessons')
                .select('*')
                .eq('id', lessonId)
                .single();

            if (error) throw error;
            setLesson(data);
        } catch (error) {
            console.error('Error loading lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (score: number) => {
        if (!user || !lesson) return;

        try {
            // Check if progress exists
            const { data: existing } = await supabase
                .from('user_lesson_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('lesson_id', lesson.id)
                .single();

            if (existing) {
                // Update existing progress
                await supabase
                    .from('user_lesson_progress')
                    .update({
                        completed: true,
                        score,
                        attempts: existing.attempts + 1,
                        last_attempt_at: new Date().toISOString(),
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
            } else {
                // Insert new progress
                await supabase
                    .from('user_lesson_progress')
                    .insert({
                        user_id: user.id,
                        lesson_id: lesson.id,
                        completed: true,
                        score,
                        attempts: 1,
                        last_attempt_at: new Date().toISOString(),
                        completed_at: new Date().toISOString()
                    });
            }

            // Check for achievements
            await checkAchievements();

            // Redirect after a delay
            setTimeout(() => {
                router.push(`/academy/${moduleId}`);
            }, 3000);

        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    const checkAchievements = async () => {
        if (!user) return;

        try {
            // Get total completed lessons
            const { count } = await supabase
                .from('user_lesson_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('completed', true);

            // Check for "First Lesson" achievement
            if (count === 1) {
                const { data: achievement } = await supabase
                    .from('academy_achievements')
                    .select('id')
                    .eq('requirement->type', 'lessons_completed')
                    .eq('requirement->count', 1)
                    .single();

                if (achievement) {
                    await supabase
                        .from('user_achievements')
                        .upsert({
                            user_id: user.id,
                            achievement_id: achievement.id
                        }, {
                            onConflict: 'user_id,achievement_id',
                            ignoreDuplicates: true
                        });
                }
            }

            // Check for other lesson count achievements
            const { data: achievements } = await supabase
                .from('academy_achievements')
                .select('*')
                .eq('requirement->type', 'lessons_completed');

            for (const achievement of achievements || []) {
                const requiredCount = achievement.requirement.count;
                if (count && count >= requiredCount) {
                    await supabase
                        .from('user_achievements')
                        .upsert({
                            user_id: user.id,
                            achievement_id: achievement.id
                        }, {
                            onConflict: 'user_id,achievement_id',
                            ignoreDuplicates: true
                        });
                }
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
        }
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Lliçó no trobada</h1>
                    <Link href={`/academy/${moduleId}`} className="text-indigo-400 hover:underline">
                        Tornar al mòdul
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto px-4 mb-6">
                <Link
                    href={`/academy/${moduleId}`}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft size={20} />
                    Tornar al mòdul
                </Link>
            </div>

            <LessonViewer
                content={lesson.content}
                lessonTitle={lesson.title}
                onComplete={handleComplete}
            />
        </div>
    );
}
