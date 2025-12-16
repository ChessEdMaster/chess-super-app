'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AcademyConcept } from '@/types/academy';
import { Loader2, Zap, BookOpen, Target, Sword, Shield, BrainCircuit, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConceptsPage() {
    const [concepts, setConcepts] = useState<AcademyConcept[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadConcepts();
    }, []);

    const loadConcepts = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_concepts')
                .select('*')
                .order('puzzle_count', { ascending: false });

            if (error) throw error;
            if (data) setConcepts(data);
        } catch (error) {
            console.error('Error loading concepts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    // Assign icons/colors based on category or name if missing
    // Since the table might be fresh, we might not have categories/icons set yet.
    // We can use a deterministic fallback or randomizer for visual flair if empty.

    return (
        <div className="h-full w-full p-6 overflow-y-auto scrollbar-subtle max-w-7xl mx-auto pb-24">

            {/* Header */}
            <div className="mb-8">
                <Link href="/academy" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft size={16} /> Tornar a l'Acadèmia
                </Link>
                <div className="flex flex-col md:flex-row items-baseline justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-widest italic font-display drop-shadow-lg mb-2">
                            Conceptes Tàctics
                        </h1>
                        <p className="text-zinc-400 font-light flex items-center gap-2 text-sm">
                            <BrainCircuit size={18} className="text-purple-500" />
                            Domina els patrons clau dels escacs
                        </p>
                    </div>
                    <div className="glass-panel px-4 py-2 rounded-lg bg-zinc-900/60 border-purple-500/20">
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider mr-2">Total Conceptes:</span>
                        <span className="text-white font-black font-display text-lg">{concepts.length}</span>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {concepts.map((concept) => (
                    <Link
                        key={concept.id}
                        href={`/academy/concepts/${concept.name}`}
                        className="group"
                    >
                        <div className="glass-panel p-5 h-full rounded-xl hover:border-purple-500/40 hover:bg-zinc-900/80 transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-purple-900/20">

                            {/* Decorative Background Gradient */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${concept.color ? `from-${concept.color}-500/10` : 'from-purple-500/10'} to-transparent rounded-bl-full -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100`} />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${concept.color ? `bg-${concept.color}-500/10 text-${concept.color}-400` : 'bg-zinc-800 text-purple-400'} border border-white/5`}>
                                        <IconForConcept name={concept.name} />
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-600 bg-zinc-950/50 px-2 py-1 rounded">
                                        {formatCount(concept.puzzle_count)}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 font-display tracking-wide group-hover:text-purple-400 transition-colors capitalize">
                                    {concept.display_name || formatName(concept.name)}
                                </h3>
                                <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">
                                    {concept.description || 'Master this key chess concept to improve your tactical vision.'}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function formatName(name: string) {
    return name.split(/(?=[A-Z])|_|-/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatCount(count: number) {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(count);
}

function IconForConcept({ name }: { name: string }) {
    // Simple heuristic for icons
    if (name.includes('mate')) return <Target size={20} />;
    if (name.includes('pin') || name.includes('skewer')) return <Sword size={20} />;
    if (name.includes('defense') || name.includes('shield')) return <Shield size={20} />;
    if (name.includes('fork')) return <Zap size={20} />;
    return <BookOpen size={20} />;
}
