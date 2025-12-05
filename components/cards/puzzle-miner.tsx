'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AcademyExercise } from '@/types/academy';
import { PuzzleSolver } from '@/components/puzzle-solver';
import { Loader2, X, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface PuzzleMinerProps {
    puzzleId: string;
    onSuccess: () => void;
    onClose: () => void;
}

// Map Card Puzzle IDs to DB Tags
const PUZZLE_TAG_MAP: Record<string, string[]> = {
    'puzzle-fork': ['fork'],
    'puzzle-pin': ['pin'],
    'puzzle-skewer': ['skewer'],
    'puzzle-discovered': ['discoveredAttack'],
    'puzzle-xray': ['xRayAttack', 'xRay'],
    'puzzle-sacrifice': ['sacrifice'],
    'puzzle-deflection': ['deflection'],
    'puzzle-interception': ['interference'],
    'puzzle-zugzwang': ['zugzwang'],
    'puzzle-passed-pawn': ['passedPawn'],
    'puzzle-back-rank': ['backRankMate'],
    'puzzle-smothered': ['smotheredMate'],
    'puzzle-italian': ['opening', 'italian'],
    'puzzle-sicilian': ['opening', 'sicilian'],
    'puzzle-queens-gambit': ['opening', 'queensGambit'],
    'puzzle-ruy-lopez': ['opening', 'ruyLopez'],
    'puzzle-french': ['opening', 'french'],
    'puzzle-caro-kann': ['opening', 'caroKann'],
    'puzzle-kings-indian': ['opening', 'kingsIndian'],
    'puzzle-london': ['opening', 'london'],
};

export function PuzzleMiner({ puzzleId, onSuccess, onClose }: PuzzleMinerProps) {
    const [exercise, setExercise] = useState<AcademyExercise | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [streak, setStreak] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        fetchPuzzle();
    }, [puzzleId]);

    const fetchPuzzle = async () => {
        setLoading(true);
        setError(null);
        try {
            const tags = PUZZLE_TAG_MAP[puzzleId] || [];

            let query = supabase
                .from('academy_exercises')
                .select('*');

            if (tags.length > 0) {
                // We want exercises that contain at least one of the tags
                // Postgres array overlap operator is &&
                // Supabase filter for array overlap: .overlaps('tags', tags)
                // But let's try .contains for now if we want ALL tags, or just rely on the first one
                // Actually, let's just search for the first tag to be safe
                query = query.contains('tags', [tags[0]]);
            }

            // Get a random one (limit 20 then pick random)
            const { data, error: dbError } = await query.limit(20);

            if (dbError) throw dbError;

            if (data && data.length > 0) {
                const randomExercise = data[Math.floor(Math.random() * data.length)];
                setExercise(randomExercise);
            } else {
                // Fallback if no specific exercise found
                console.warn(`No exercises found for tags: ${tags.join(', ')}. Fetching random.`);
                const { data: fallback } = await supabase
                    .from('academy_exercises')
                    .select('*')
                    .limit(20);

                if (fallback && fallback.length > 0) {
                    setExercise(fallback[Math.floor(Math.random() * fallback.length)]);
                } else {
                    setError("No exercises available.");
                }
            }

        } catch (err) {
            console.error('Error fetching puzzle:', err);
            setError("Failed to load puzzle.");
        } finally {
            setLoading(false);
        }
    };

    const handleSolved = (timeSpent: number, attempts: number, hintsUsed: number) => {
        // Success!
        setIsTransitioning(true);
        onSuccess();
        setStreak(prev => prev + 1);

        setTimeout(() => {
            setIsTransitioning(false);
            fetchPuzzle();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-2xl bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="bg-zinc-900 p-4 flex justify-between items-center border-b border-zinc-800">
                    <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        Mining Resources... {streak > 0 && <span className="text-emerald-400 text-xs bg-emerald-900/30 px-2 py-0.5 rounded-full">Streak: {streak}</span>}
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition bg-zinc-800 hover:bg-zinc-700 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 bg-slate-950/50 relative">
                    {/* Transition Overlay */}
                    {isTransitioning && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-emerald-900/20 backdrop-blur-[2px]">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2"
                            >
                                <CheckCircle size={20} />
                                +1 Card Extracted!
                            </motion.div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <p className="text-zinc-400 animate-pulse">Locating deposit...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center p-8">
                            <p className="text-red-400">{error}</p>
                            <button
                                onClick={fetchPuzzle}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-white"
                            >
                                Retry
                            </button>
                        </div>
                    ) : exercise ? (
                        <PuzzleSolver
                            key={exercise.id} // Force re-mount on new exercise
                            exercise={exercise}
                            onSolved={handleSolved}
                            compact={true}
                        />
                    ) : null}
                </div>
            </motion.div>
        </div>
    );
}

