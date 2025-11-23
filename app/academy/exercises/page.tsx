'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Filter, Trophy } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyExercise } from '@/lib/academy-types';
import { PuzzleSolver } from '@/components/puzzle-solver';

export default function ExercisesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [exercises, setExercises] = useState<AcademyExercise[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [solvedExercises, setSolvedExercises] = useState<Set<string>>(new Set());
    const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadExercises();
        }
    }, [user, difficulty]);

    const loadExercises = async () => {
        try {
            let query = supabase
                .from('academy_exercises')
                .select('*')
                .order('rating', { ascending: true });

            if (difficulty !== 'all') {
                query = query.eq('difficulty', difficulty);
            }

            const { data: exercisesData, error } = await query;

            if (error) throw error;
            setExercises(exercisesData || []);

            // Load solved exercises
            const { data: progressData } = await supabase
                .from('user_exercise_progress')
                .select('exercise_id')
                .eq('user_id', user!.id)
                .eq('solved', true);

            const solved = new Set(progressData?.map(p => p.exercise_id) || []);
            setSolvedExercises(solved);

        } catch (error) {
            console.error('Error loading exercises:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSolved = async (timeSpent: number, attempts: number, hintsUsed: number) => {
        if (!user || !exercises[currentExerciseIndex]) return;

        const exercise = exercises[currentExerciseIndex];

        try {
            // Check if progress exists
            const { data: existing } = await supabase
                .from('user_exercise_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('exercise_id', exercise.id)
                .single();

            if (existing) {
                await supabase
                    .from('user_exercise_progress')
                    .update({
                        solved: true,
                        attempts: existing.attempts + attempts,
                        time_spent: existing.time_spent + timeSpent,
                        hints_used: existing.hints_used + hintsUsed,
                        solved_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('user_exercise_progress')
                    .insert({
                        user_id: user.id,
                        exercise_id: exercise.id,
                        solved: true,
                        attempts,
                        time_spent: timeSpent,
                        hints_used: hintsUsed,
                        solved_at: new Date().toISOString()
                    });
            }

            setSolvedExercises(prev => new Set([...prev, exercise.id]));

            // Check for achievements
            await checkAchievements();

            // Move to next exercise after a delay
            setTimeout(() => {
                if (currentExerciseIndex < exercises.length - 1) {
                    setCurrentExerciseIndex(prev => prev + 1);
                }
            }, 2000);

        } catch (error) {
            console.error('Error saving exercise progress:', error);
        }
    };

    const checkAchievements = async () => {
        if (!user) return;

        try {
            const { count } = await supabase
                .from('user_exercise_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('solved', true);

            const { data: achievements } = await supabase
                .from('academy_achievements')
                .select('*')
                .eq('requirement->type', 'exercises_solved');

            for (const achievement of achievements || []) {
                const requiredCount = achievement.requirement.count;
                if (count && count >= requiredCount) {
                    await supabase
                        .from('user_achievements')
                        .insert({
                            user_id: user.id,
                            achievement_id: achievement.id
                        })
                        .onConflict('user_id,achievement_id')
                        .ignore();
                }
            }
        } catch (error) {
            console.error('Error checking achievements:', error);
        }
    };

    const handleSkip = () => {
        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
        }
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    if (exercises.length === 0) {
        return (
            <div className="min-h-screen bg-slate-950 p-6">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/academy"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-6"
                    >
                        <ArrowLeft size={20} />
                        Tornar a l'acadèmia
                    </Link>
                    <div className="text-center text-white">
                        <h1 className="text-2xl font-bold mb-4">No hi ha exercicis disponibles</h1>
                        <p className="text-slate-400">Torna més tard per nous puzzles!</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentExercise = exercises[currentExerciseIndex];
    const solvedCount = exercises.filter(e => solvedExercises.has(e.id)).length;

    return (
        <div className="min-h-screen bg-slate-950 py-6 font-sans text-slate-200">
            <div className="max-w-6xl mx-auto px-4 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <Link
                        href="/academy"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft size={20} />
                        Tornar a l'acadèmia
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                            <Trophy className="text-amber-400" size={20} />
                            <span className="text-white font-bold">{solvedCount}</span>
                            <span className="text-slate-400">/ {exercises.length} resolts</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-slate-400" />
                            <select
                                value={difficulty}
                                onChange={(e) => {
                                    setDifficulty(e.target.value as any);
                                    setCurrentExerciseIndex(0);
                                }}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">Tots</option>
                                <option value="easy">Fàcil</option>
                                <option value="medium">Mitjà</option>
                                <option value="hard">Difícil</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-4">
                    <span className="text-sm text-slate-400">
                        Exercici {currentExerciseIndex + 1} de {exercises.length}
                    </span>
                </div>
            </div>

            <PuzzleSolver
                exercise={currentExercise}
                onSolved={handleSolved}
                onSkip={handleSkip}
            />
        </div>
    );
}
