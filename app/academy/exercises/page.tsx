'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Filter, Trophy, Tag } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyExercise } from '@/types/academy';
import { PuzzleSolver } from '@/components/puzzle-solver';

const COMMON_TAGS = [
    'fork', 'pin', 'skewer', 'discoveredAttack', 'endgame',
    'mateIn1', 'mateIn2', 'mateIn3', 'opening', 'middlegame'
];

export default function ExercisesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [currentExercise, setCurrentExercise] = useState<AcademyExercise | null>(null);
    const [solvedCount, setSolvedCount] = useState(0);
    const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('medium');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchNextExercise();
            updateSolvedCount();
        }
    }, [user, difficulty, selectedTags]);

    const updateSolvedCount = async () => {
        if (!user) return;
        const { count } = await supabase
            .from('user_exercise_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('solved', true);
        setSolvedCount(count || 0);
    };

    const fetchNextExercise = async () => {
        setLoading(true);
        try {
            let exercise: AcademyExercise | null = null;

            // 1. Si tenim tags seleccionats, fem query normal (ja que el RPC no suporta tags)
            if (selectedTags.length > 0) {
                // Obtenir IDs resolts
                const { data: solved } = await supabase
                    .from('user_exercise_progress')
                    .select('exercise_id')
                    .eq('user_id', user!.id)
                    .eq('solved', true);

                const solvedIds = solved?.map(s => s.exercise_id) || [];

                let query = supabase
                    .from('academy_exercises')
                    .select('*')
                    .eq('difficulty', difficulty)
                    .contains('tags', selectedTags);

                if (solvedIds.length > 0) {
                    // Nota: Això pot fallar si hi ha milers d'IDs. Per ara serveix.
                    query = query.not('id', 'in', `(${solvedIds.join(',')})`);
                }

                // Agafem un batch aleatori (simulat)
                // Com que no podem fer random() natiu fàcil sense RPC, agafem els primers 50 i triem un
                const { data } = await query.limit(50);

                if (data && data.length > 0) {
                    exercise = data[Math.floor(Math.random() * data.length)];
                }

            } else {
                // 2. Si no hi ha tags, intentem usar RPC per eficiència
                const { data, error } = await supabase.rpc('get_random_exercise', {
                    p_user_id: user!.id,
                    p_difficulty: difficulty
                });

                if (!error && data && data.length > 0) {
                    exercise = data[0];
                } else {
                    // Fallback si el RPC no existeix o falla
                    console.warn("RPC get_random_exercise failed or returned no data, using fallback");

                    const { data: solved } = await supabase
                        .from('user_exercise_progress')
                        .select('exercise_id')
                        .eq('user_id', user!.id)
                        .eq('solved', true);

                    const solvedIds = solved?.map(s => s.exercise_id) || [];

                    let query = supabase
                        .from('academy_exercises')
                        .select('*')
                        .eq('difficulty', difficulty);

                    if (solvedIds.length > 0) {
                        query = query.not('id', 'in', `(${solvedIds.join(',')})`);
                    }

                    const { data: fallbackData } = await query.limit(20);
                    if (fallbackData && fallbackData.length > 0) {
                        exercise = fallbackData[Math.floor(Math.random() * fallbackData.length)];
                    }
                }
            }

            setCurrentExercise(exercise);

        } catch (error) {
            console.error('Error loading exercise:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSolved = async (timeSpent: number, attempts: number, hintsUsed: number) => {
        if (!user || !currentExercise) return;

        try {
            // Check if progress exists
            const { data: existing } = await supabase
                .from('user_exercise_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('exercise_id', currentExercise.id)
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
                        exercise_id: currentExercise.id,
                        solved: true,
                        attempts,
                        time_spent: timeSpent,
                        hints_used: hintsUsed,
                        solved_at: new Date().toISOString()
                    });
            }

            setSolvedCount(prev => prev + 1);

            // Check for achievements
            await checkAchievements();

            // Move to next exercise after a delay
            setTimeout(() => {
                fetchNextExercise();
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

    const handleSkip = () => {
        fetchNextExercise();
    };

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    if (!currentExercise && !loading) {
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
                        <p className="text-slate-400">Prova de canviar els filtres o torna més tard.</p>
                        <button
                            onClick={fetchNextExercise}
                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition"
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 py-6 font-sans text-slate-200">
            <div className="max-w-5xl mx-auto px-4 mb-6">
                <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                    <Link
                        href="/academy"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                        <ArrowLeft size={20} />
                        Tornar a l'acadèmia
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 justify-center">
                        <div className="flex items-center gap-2 text-sm bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <Trophy className="text-amber-400" size={20} />
                            <span className="text-white font-bold">{solvedCount}</span>
                            <span className="text-slate-400">resolts</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-slate-400" />
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as any)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">Tots</option>
                                <option value="easy">Fàcil</option>
                                <option value="medium">Mitjà</option>
                                <option value="hard">Difícil</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Tag size={20} className="text-slate-400" />
                            <select
                                onChange={(e) => {
                                    const tag = e.target.value;
                                    if (tag && !selectedTags.includes(tag)) {
                                        setSelectedTags([...selectedTags, tag]);
                                    }
                                }}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                value=""
                            >
                                <option value="">Afegir Tema...</option>
                                {COMMON_TAGS.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        {selectedTags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 rounded text-xs flex items-center gap-1">
                                {tag}
                                <button
                                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                                    className="hover:text-white"
                                >
                                    &times;
                                </button>
                            </span>
                        ))}
                        <button
                            onClick={() => setSelectedTags([])}
                            className="text-xs text-slate-500 hover:text-slate-300 underline"
                        >
                            Netejar
                        </button>
                    </div>
                )}

                <div className="text-center mb-4">
                    <span className="text-sm text-slate-400">
                        Exercici Aleatori {difficulty !== 'all' ? `(${difficulty})` : ''}
                    </span>
                </div>
            </div>

            {currentExercise && (
                <PuzzleSolver
                    exercise={currentExercise}
                    onSolved={handleSolved}
                    onSkip={handleSkip}
                />
            )}
        </div>
    );
}

