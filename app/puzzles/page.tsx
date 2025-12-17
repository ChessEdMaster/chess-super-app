'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AcademyExercise } from '@/types/academy';
import { PuzzleSolver } from '@/components/puzzle-solver';
import { Loader2, Filter, RefreshCw, Trophy, Flame } from 'lucide-react';
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
import { GameCard } from '@/components/ui/design-system/GameCard';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { Panel } from '@/components/ui/design-system/Panel';

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
            query = query.gte('rating', filters.minRating).lte('rating', filters.maxRating);

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
        <div className="h-full w-full p-4 flex flex-col md:flex-row gap-6">

            {/* Sidebar Filters */}
            <div className="w-full md:w-80 flex flex-col gap-6 shrink-0">
                <div className="flex items-center gap-2 text-2xl font-black text-amber-400 uppercase italic font-display tracking-widest text-stroke">
                    <Trophy className="fill-amber-500 stroke-amber-700" size={32} />
                    <h1>Mina de Puzzles</h1>
                </div>

                <GameCard variant="default" className="p-4 space-y-6 bg-zinc-900/90 border-zinc-700">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 flex items-center gap-2 uppercase tracking-widest">
                            <Filter size={14} className="text-indigo-400" /> Temàtica
                        </label>
                        <Select
                            value={filters.theme}
                            onValueChange={(val) => setFilters(prev => ({ ...prev, theme: val }))}
                        >
                            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white font-bold h-10">
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
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                            <label>Dificultat (ELO)</label>
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

                    <ShinyButton
                        onClick={fetchPuzzle}
                        className="w-full"
                        variant="primary"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <RefreshCw className="mr-2" size={16} />}
                        Següent Puzzle
                    </ShinyButton>
                </GameCard>

                <Panel className={`p-4 flex items-center justify-between border-2 transition-all ${streak > 0 ? 'border-orange-500/50 bg-orange-950/20 shadow-[0_0_20px_rgba(249,115,22,0.2)]' : 'border-zinc-800 bg-zinc-900/50'}`}>
                    <span className="font-bold text-zinc-400 uppercase tracking-widest text-xs flex items-center gap-2">
                        <Flame size={16} className={streak > 0 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-zinc-600"} />
                        Ratxa Actual
                    </span>
                    <span className={`text-3xl font-black font-display italic ${streak > 0 ? 'text-orange-400 drop-shadow-md' : 'text-zinc-700'}`}>
                        {streak}
                    </span>
                </Panel>
            </div>

            {/* Main Board Area */}
            <div className="flex-1 flex justify-center items-start min-h-[500px]">
                {loading && !exercise ? (
                    <div className="flex flex-col items-center justify-center h-full w-full opacity-50 space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-indigo-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="animate-pulse text-indigo-500" size={24} />
                            </div>
                        </div>
                        <p className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Buscant puzzle...</p>
                    </div>
                ) : exercise ? (
                    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GameCard variant="default" className="bg-zinc-900/80 p-6 border-zinc-700">
                            <PuzzleSolver
                                key={exercise.id}
                                exercise={exercise}
                                onSolved={handleSolved}
                                onSkip={fetchPuzzle}
                            />
                        </GameCard>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border-2 border-dashed border-zinc-800">
                            <Filter size={32} />
                        </div>
                        <p className="font-bold uppercase tracking-widest text-xs">Selecciona filtres i prem "Següent Puzzle"</p>
                    </div>
                )}
            </div>
        </div>
    );
}
