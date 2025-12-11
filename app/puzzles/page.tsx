'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AcademyExercise } from '@/types/academy';
import { PuzzleSolver } from '@/components/puzzle-solver';
import { Loader2, Filter, RefreshCw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';

// Themes matching our Card definitions for consistency
const THEMES = [
    { value: 'fork', label: 'La Forquilla' },
    { value: 'pin', label: 'La Clavada' },
    { value: 'skewer', label: "L'Enfilada" },
    { value: 'discoveredAttack', label: 'Escac a la Descoberta' },
    { value: 'xRayAttack', label: 'Raigs X' },
    { value: 'sacrifice', label: 'Sacrifici' },
    { value: 'deflection', label: 'Desviació' },
    { value: 'interference', label: 'Intercepció' },
    { value: 'zugzwang', label: 'Zugzwang' },
    { value: 'advancedPawn', label: 'Peó Passat' },
    { value: 'backRankMate', label: 'Mate del Passadís' },
    { value: 'smotheredMate', label: "Mate de l'Ofegat" },
    { value: 'italian', label: 'Obertura Italiana' },
    { value: 'sicilian', label: 'Defensa Siciliana' },
    { value: 'queensGambit', label: 'Gambit de Dama' },
    { value: 'ruyLopez', label: 'Ruy Lopez' },
    { value: 'french', label: 'Defensa Francesa' },
    { value: 'caroKann', label: 'Defensa Caro-Kann' },
    { value: 'kingsIndian', label: 'Atac Indi de Rei' },
    { value: 'london', label: 'Sistema Londres' },
    { value: 'mateIn1', label: 'Mate en 1' },
    { value: 'mateIn2', label: 'Mate en 2' },
    { value: 'mateIn3', label: 'Mate en 3' },
    { value: 'opening', label: 'Obertures (General)' },
    { value: 'endgame', label: 'Finals' },
];

export default function PuzzlesPage() {
    const [exercise, setExercise] = useState<AcademyExercise | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        theme: 'all',
        minRating: 600,
        maxRating: 3000
    });
    const [streak, setStreak] = useState(0);

    const fetchPuzzle = async () => {
        setLoading(true);
        try {
            let query = supabase.from('academy_exercises').select('*');

            // Filter by Theme
            if (filters.theme !== 'all') {
                query = query.contains('tags', [filters.theme]);
            }

            // Filter by Rating
            // Note: We use a range to avoid strict equality which might return few results
            query = query.gte('rating', filters.minRating).lte('rating', filters.maxRating);

            // Get a random batch
            // Using a random offset is slow on large tables, so we'll fetch a small batch 
            // potentially using a random sort if the table isn't too huge or just limit
            // For 5M rows, ORDER BY RANDOM() is expensive.
            // Better approach: Get a random ID or use a numeric ID range?
            // UUIDs are hard to range.
            // Let's rely on .limit(20) and maybe some randomness if we can.
            // Supabase/Postgres "order by random()" is easy to write but heavy.
            // Let's try it for now, optimization later if needed.
            // Actually, querying 5M rows with "contains" on tags can be slow without GIN index.
            // Assuming index exists.

            // Limit to 1 to get just one, but maybe fetch 5 and pick 1 to reduce "same puzzle" chance if caching happens
            const { data, error } = await query.limit(20);

            if (error) throw error;

            if (data && data.length > 0) {
                const random = data[Math.floor(Math.random() * data.length)];
                setExercise(random);
            } else {
                toast.error('No s\'han trobat puzzles amb aquests filtres.');
                setExercise(null);
            }

        } catch (error) {
            console.error('Error fetching puzzle:', error);
            toast.error('Error carregant puzzle.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPuzzle();
    }, []);

    const handleSolved = (time: number, attempts: number) => {
        toast.success(`Puzzle completat! Temps: ${time}s`);
        setStreak(s => s + 1);
        setTimeout(fetchPuzzle, 2000); // Auto next
    };

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-20 md:pb-4 flex flex-col md:flex-row gap-6">

            {/* Sidebar Filters */}
            <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
                <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400">
                    <Trophy className="fill-current" />
                    <h1>Mina de Puzzles</h1>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                            <Filter size={14} /> Temàtica
                        </label>
                        <Select
                            value={filters.theme}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, theme: val }))}
                        >
                            <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                <SelectValue placeholder="Qualsevol" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="all">Qualsevol</SelectItem>
                                {THEMES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <label className="font-medium text-zinc-400">Rating</label>
                            <span className="text-indigo-400 font-mono">{filters.minRating} - {filters.maxRating}</span>
                        </div>
                        <Slider
                            defaultValue={[600, 3000]}
                            max={3500}
                            min={0}
                            step={100}
                            value={[filters.minRating, filters.maxRating]}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, minRating: val[0], maxRating: val[1] }))}
                            className="py-4"
                        />
                    </div>

                    <Button
                        onClick={fetchPuzzle}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw className="mr-2" size={16} />}
                        Següent Puzzle
                    </Button>
                </div>

                {streak > 0 && (
                    <div className="bg-emerald-900/20 border border-emerald-500/50 p-4 rounded-xl flex items-center justify-between">
                        <span className="font-bold text-emerald-400">Ratxa Actual</span>
                        <span className="text-2xl font-black text-white">{streak} 🔥</span>
                    </div>
                )}
            </div>

            {/* Main Board Area */}
            <div className="flex-1 flex justify-center items-start min-h-[500px]">
                {loading && !exercise ? (
                    <div className="flex flex-col items-center justify-center h-full w-full opacity-50">
                        <Loader2 className="animate-spin text-indigo-500" size={48} />
                        <p className="mt-4 text-zinc-400">Buscant puzzle...</p>
                    </div>
                ) : exercise ? (
                    <div className="w-full max-w-4xl animate-in fade-in duration-500">
                        <PuzzleSolver
                            key={exercise.id}
                            exercise={exercise}
                            onSolved={handleSolved}
                            onSkip={fetchPuzzle}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        Selecciona filtres i prem "Següent Puzzle"
                    </div>
                )}
            </div>
        </div>
    );
}
