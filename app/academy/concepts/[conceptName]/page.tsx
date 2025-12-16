'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Trophy, Flag, BookOpen } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { AcademyExercise, AcademyConcept } from '@/types/academy';
import { PuzzleSolver } from '@/components/puzzle-solver';

export default function ConceptTrainingPage() {
    const { conceptName } = useParams();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [concept, setConcept] = useState<AcademyConcept | null>(null);
    const [currentExercise, setCurrentExercise] = useState<AcademyExercise | null>(null);
    const [solvedCount, setSolvedCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Decode the concept name from URL
    const decodedName = typeof conceptName === 'string' ? decodeURIComponent(conceptName) : '';

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load Concept Details
    useEffect(() => {
        const fetchConcept = async () => {
            if (!decodedName) return;
            const { data } = await supabase
                .from('academy_concepts')
                .select('*')
                .eq('name', decodedName)
                .single();
            if (data) setConcept(data);
        };
        fetchConcept();
    }, [decodedName]);

    const updateSolvedCount = useCallback(async () => {
        if (!user || !decodedName) return;
        // Count exercises solved with this tag
        // Ideally we join table or check tags. 
        // For simplicity, we just count session solved for now or general solved count
        // but getting exact "count of solved exercises with THIS tag" requires a join or a complex query.
        // We will just show "Session Solved" for now.
        // setSolvedCount(prev => prev);
    }, [user, decodedName]);


    const fetchNextExercise = useCallback(async () => {
        setLoading(true);
        try {
            if (!user || !decodedName) return;

            // Fetch IDs of exercises already solved by user
            const { data: solved } = await supabase
                .from('user_exercise_progress')
                .select('exercise_id')
                .eq('user_id', user.id)
                .eq('solved', true);

            const solvedIds = solved?.map(s => s.exercise_id) || [];

            let query = supabase
                .from('academy_exercises')
                .select('*')
                .contains('tags', [decodedName]);

            if (solvedIds.length > 0) {
                query = query.not('id', 'in', `(${solvedIds.join(',')})`);
            }

            // Get a batch (e.g. 20) and pick random
            const { data } = await query.limit(20);

            if (data && data.length > 0) {
                const randomExercise = data[Math.floor(Math.random() * data.length)];
                setCurrentExercise(randomExercise);
            } else {
                setCurrentExercise(null);
            }

        } catch (error) {
            console.error('Error loading exercise:', error);
        } finally {
            setLoading(false);
        }
    }, [user, decodedName]);

    useEffect(() => {
        if (user && decodedName) {
            fetchNextExercise();
        }
    }, [user, decodedName, fetchNextExercise]);

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

            // Move to next exercise after a delay
            setTimeout(() => {
                fetchNextExercise();
            }, 1000);

        } catch (error) {
            console.error('Error saving exercise progress:', error);
        }
    };

    if (authLoading || (loading && !currentExercise)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={48} />
            </div>
        );
    }

    if (!currentExercise && !loading) {
        return (
            <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
                <Flag size={64} className="text-zinc-700 mb-6" />
                <h2 className="text-2xl font-bold text-white mb-2">No hi ha més exercicis</h2>
                <p className="text-zinc-400 mb-8">Has completat tots els exercicis disponibles per a aquest concepte!</p>
                <Link href="/academy/concepts" className="bg-zinc-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-700 transition">
                    Tornar a Conceptes
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 font-sans text-slate-200">
            <div className="max-w-5xl mx-auto px-4 mb-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/academy/concepts" className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest italic font-display">
                                {concept?.display_name || formatName(decodedName)}
                            </h1>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Entrenament Temàtic</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-zinc-900/80 px-4 py-2 rounded-lg border border-purple-500/20 flex items-center gap-3">
                            <Trophy size={16} className="text-yellow-500" />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Resolt Sessió</span>
                                <span className="text-lg font-black text-white leading-none font-display">{solvedCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Concept Description (Collapsible or small) */}
                {concept?.description && (
                    <div className="mb-6 p-4 bg-purple-900/10 border border-purple-500/20 rounded-xl flex gap-3 text-sm text-purple-200/80">
                        <BookOpen size={18} className="text-purple-400 shrink-0 mt-0.5" />
                        <p>{concept.description}</p>
                    </div>
                )}
            </div>

            {/* Solver */}
            {currentExercise && (
                <PuzzleSolver
                    exercise={currentExercise}
                    onSolved={handleSolved}
                    onSkip={() => fetchNextExercise()}
                />
            )}
        </div>
    );
}

function formatName(name: string) {
    if (!name) return '';
    return name.split(/(?=[A-Z])|_|-/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
