'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyLesson } from '@/types/academy';
import { UniversalLessonViewer } from '@/components/academy/UniversalLessonViewer';
import { AcademyLessonNewContent } from '@/types/lesson_content';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/lib/store/player-store';
import { toast } from 'sonner';
import { useArenaStore } from '@/lib/store/arena-store';

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
                .select('*, module:academy_modules(course_id)')
                .eq('id', lessonId)
                .single();

            if (error) throw error;
            setLesson(data as any);
        } catch (error) {
            console.error('Error loading lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
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
                        score: 100, // Implies full completion in GDD Universal Viewer
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
                        score: 100,
                        attempts: 1,
                        last_attempt_at: new Date().toISOString(),
                        completed_at: new Date().toISOString()
                    });
            }

            // Award Achievements if any
            await checkAchievements();

            // --- CROSS-PROGRESSION REWARDS (GDD MESTRE) ---
            const { addXp, addGold } = usePlayerStore.getState();
            addXp(50);
            addGold(25);

            // Award MANA to Kingdom
            const { data: resData } = await supabase
                .from('kingdom_resources')
                .select('mana')
                .eq('user_id', user.id)
                .single();

            if (resData) {
                await supabase
                    .from('kingdom_resources')
                    .update({ mana: (resData.mana || 0) + 25 })
                    .eq('user_id', user.id);
                toast.success("Has guanyat 25 de Manà pel Regne! ✨");
            }

            toast.success("Lliçó completada! +50 XP");

            // Redirect after a delay
            setTimeout(() => {
                const courseId = (lesson as any).module?.course_id;
                if (courseId) {
                    router.push(`/academy/course/${courseId}`);
                } else {
                    router.push('/academy');
                }
            }, 1500);

        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    const checkAchievements = async () => {
        if (!user) return;

        try {
            const { count } = await supabase
                .from('user_lesson_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('completed', true);

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
        } catch (error) {
            console.error('Error checking achievements:', error);
        }
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={48} />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Lliçó no trobada</h1>
                    <Link href="/academy" className="text-amber-500 hover:underline">
                        Tornar a l'Acadèmia
                    </Link>
                </div>
            </div>
        );
    }

    // Cast content to our new type, handling potential legacy structure
    let contentTyped: AcademyLessonNewContent;

    // Legacy fallback: if content has 'steps' but not 'sections', convert it on the fly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawContent = lesson.content as any;

    if (rawContent && rawContent.sections) {
        contentTyped = rawContent as AcademyLessonNewContent;
    } else if (rawContent && rawContent.steps) {
        // Fallback for old content: Convert 'steps' to 'ChessboardSection'
        contentTyped = {
            sections: rawContent.steps.map((step: any, idx: number) => ({
                id: `legacy-step-${idx}`,
                type: 'chessboard',
                title: `Exercici ${idx + 1}`,
                fen: step.fen,
                interactive: true,
                solution: [step.correctMove], // Assumes single move solution
                hints: [step.comment || 'Troba el millor moviment.']
            }))
        };
    } else {
        // Empty or unknown
        contentTyped = { sections: [] };
    }

    return (
        <div className="min-h-screen bg-zinc-950 font-sans text-white flex flex-col">
            <UniversalLessonViewer
                content={contentTyped}
                lessonTitle={lesson.title}
                onCompleteLesson={handleComplete}
                onExit={() => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const courseId = (lesson as any).module?.course_id;
                    if (courseId) {
                        router.push(`/academy/course/${courseId}`);
                    } else {
                        router.push('/academy');
                    }
                }}
            />
        </div>
    );
}
