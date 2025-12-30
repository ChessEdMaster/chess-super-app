'use client';

import React, { useState, useEffect } from 'react';
import { VideoPanel } from './academy/lesson-parts/VideoPanel';
import { InteractiveBoard } from './academy/lesson-parts/InteractiveBoard';
import { QuizPanel } from './academy/lesson-parts/QuizPanel';
import { GamificationPanel } from './academy/lesson-parts/GamificationPanel';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Loader2, ArrowRight } from 'lucide-react';
import { AcademyLessonNew } from '@/types/academy_v2';
import { playSound } from '@/lib/sounds';

// Compatible interface for props
interface LessonViewerProps {
    content: any; // We accept any content blob and detect structure
    onComplete: (score: number) => void;
    lessonTitle: string;
    userId?: string;
    lessonId?: string;
}

type LessonPhase = 'intro' | 'examples' | 'exercises' | 'quiz' | 'gamification';

export function LessonViewer({ content, onComplete, lessonTitle, userId, lessonId }: LessonViewerProps) {
    const [phase, setPhase] = useState<LessonPhase>('intro');
    const [subIndex, setSubIndex] = useState(0); // For iterating through examples/exercises
    const [loading, setLoading] = useState(true);

    // Detect if content is V2
    const isV2 = content && (content.video_script || content.online_content?.video_script);

    useEffect(() => {
        // Normalize content structure if it's nested in online_content
        if (content && content.online_content) {
            // It's already the right shape if passed as full lesson, but page passes 'content' column
            // If page passes content column, and content column has online_content inside...
            // Wait, the seed script mapped online_content -> content column.
            // So content = { video_script: ..., pgn_examples: ... }
            // The check 'isV2' above handles this.
        }
        setLoading(false);
    }, [content]);

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-amber-500" /></div>;

    // --- LEGACY FALLBACK (Simplified or Error) ---
    if (!isV2) {
        return (
            <div className="p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800">
                <h2 className="text-xl font-bold text-white mb-2">Format de lliçó no suportat o antic</h2>
                <p className="text-zinc-400">Aquesta lliçó no té el format 2.0. Si us plau, contacta amb l&apos;administrador.</p>
                <div className="mt-4 p-4 bg-zinc-800 rounded font-mono text-xs text-left overflow-auto max-h-40">
                    {JSON.stringify(content, null, 2)}
                </div>
            </div>
        );
    }

    // --- V2 LOGIC ---

    // 1. Intro (Video Script)
    if (phase === 'intro') {
        const script = content.video_script || content.online_content?.video_script;
        if (!script) { setPhase('examples'); return null; }

        return <VideoPanel script={script} onComplete={() => setPhase('examples')} />;
    }

    // 2. Examples (Interactive Board - Read Only / Visuals)
    if (phase === 'examples') {
        const examples = content.pgn_examples || [];
        if (examples.length === 0 || subIndex >= examples.length) {
            // No examples or finished all
            // Move to exercises
            // Reset subIndex in effect? No, safe to just render next phase immediately?
            // Better to set state and return null to trigger re-render
            setTimeout(() => { setPhase('exercises'); setSubIndex(0); }, 0);
            return null;
        }

        const currentExample = examples[subIndex];
        return (
            <div className="h-full flex flex-col">
                <div className="mb-4 flex justify-between items-center px-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Exemple {subIndex + 1} / {examples.length}</span>
                </div>
                <InteractiveBoard
                    data={currentExample}
                    mode="example"
                    onComplete={() => setSubIndex(prev => prev + 1)}
                />
            </div>
        );
    }

    // 3. Exercises (Interactive)
    if (phase === 'exercises') {
        const exercises = content.pgn_exercises_interactive || [];
        if (exercises.length === 0 || subIndex >= exercises.length) {
            setTimeout(() => { setPhase('quiz'); setSubIndex(0); }, 0);
            return null;
        }

        const currentExercise = exercises[subIndex];
        return (
            <div className="h-full flex flex-col">
                <div className="mb-4 flex justify-between items-center px-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Exercici {subIndex + 1} / {exercises.length}</span>
                </div>
                <InteractiveBoard
                    data={currentExercise}
                    mode="exercise"
                    onComplete={() => setSubIndex(prev => prev + 1)}
                />
            </div>
        );
    }

    // 4. Quiz
    if (phase === 'quiz') {
        const quiz = content.quiz || [];
        if (quiz.length === 0) {
            setTimeout(() => setPhase('gamification'), 0);
            return null;
        }

        return (
            <QuizPanel
                questions={quiz}
                onComplete={(score) => {
                    // Maybe save intermediate score?
                    setPhase('gamification');
                }}
            />
        );
    }

    // 5. Gamification (End)
    if (phase === 'gamification') {
        const badge = content.gamification;
        // Construct a safe badge object if missing
        const badgeData = badge || {
            badge_name: 'Lliçó Completada',
            badge_emoji: '🎓',
            badge_description: 'Has finalitzat aquesta lliçó.'
        };

        return (
            <GamificationPanel
                data={badgeData}
                onFinish={() => onComplete(100)}
            />
        );
    }

    return null;
}
