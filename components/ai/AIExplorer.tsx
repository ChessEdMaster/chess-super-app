'use client';

import React, { useState, useEffect } from 'react';
import { useChess } from '@/components/chess/chess-context';
import { useExplorer, ExplorerMove } from '@/hooks/use-explorer';
import { useOpeningRecognitionByMoves } from '@/components/analysis/useOpeningRecognition';
import { Brain, Lightbulb, Sparkles, BookOpen, Crown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

export function AIExplorer() {
    const { fen, mainLine, makeMove } = useChess();
    const [source, setSource] = useState<'masters' | 'lichess'>('masters');
    const { moves, loading, stats } = useExplorer({ fen, source });

    // Convert mainLine nodes to move SANs
    const movesHistory = mainLine.map(m => m.move);
    const identifiedOpening = useOpeningRecognitionByMoves(movesHistory);

    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const getAIInsight = async () => {
        if (!identifiedOpening) return;
        setIsThinking(true);
        // Simulate "AI Deep Thinking"
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real scenario, this could be a call to an LLM or a lookup in a rich database
        // For the MVP, we generate concepts based on the identification
        const concepts: Record<string, string> = {
            'Ruy Lopez': "L'obertura espanyola busca pressionar el centre i l'alfil de b5 ataca el defensor del peó de e5. És una de les obertures més teòriques i estratègiques.",
            'Sicilian Defense': "La Siciliana és l'extensió asimètrica més agressiva contra 1.e4. El negre busca un desequilibri immediat i control del centre amb el peó de c.",
            'Italian Game': "L'Italiana és clàssica i pedagògica. Desenvolupament ràpid cap al centre i pressió sobre f7. Molt recomanada per a jugadors en progressió.",
            'Queens Gambit': "El blanc sacrifica un peó lateral per guanyar control total del centre. Si s'accepta, el blanc domina; si es rebutja, s'arriba a una lluita posicional intensa."
        };

        const defaultInsight = identifiedOpening
            ? `Estàs jugant ${identifiedOpening.name}. Les blanques solen buscar el control central mentre les negres preparen el seu contrajoc segons l'estructura de peons.`
            : "No hem identificat una obertura coneguda encara. Centra't en el desenvolupament de peces clau i el control del centre.";

        setAiInsight(concepts[identifiedOpening.name] || defaultInsight);
        setIsThinking(false);
    };

    const getBarWidth = (val: number, total: number) => {
        if (total === 0) return 0;
        return (val / total) * 100;
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-280px)] gap-4 overflow-hidden">
            {/* Opening Identification Header */}
            <Panel className="bg-indigo-950/30 border-indigo-500/20 p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <BookOpen className="text-indigo-400" size={20} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 leading-none mb-1">
                            Obertura Identificada
                        </h4>
                        <h3 className="text-lg font-black text-white italic tracking-tighter uppercase truncate leading-none">
                            {identifiedOpening?.name || "Posició Desconeguda"}
                        </h3>
                    </div>
                    {identifiedOpening && (
                        <div className="ml-auto bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-300">
                            {identifiedOpening.eco}
                        </div>
                    )}
                </div>
            </Panel>

            {/* AI Insight Section */}
            <Panel className="bg-emerald-950/20 border-emerald-500/10 p-4 relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />

                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Brain className="text-emerald-400" size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">AI Explorer Insight</span>
                    </div>
                    <ShinyButton
                        onClick={getAIInsight}
                        disabled={isThinking || !identifiedOpening}
                        className="px-2 py-1 text-[8px]"
                        variant="primary"
                    >
                        {isThinking ? <Sparkles className="animate-spin" size={10} /> : "DEMANAR ANÀLISI"}
                    </ShinyButton>
                </div>

                <AnimatePresence mode="wait">
                    {aiInsight ? (
                        <motion.p
                            key="insight"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-emerald-100/70 italic leading-relaxed"
                        >
                            "{aiInsight}"
                        </motion.p>
                    ) : (
                        <p className="text-xs text-zinc-500 italic">Prems el botó per obtenir una explicació conceptual d'aquesta línia.</p>
                    )}
                </AnimatePresence>
            </Panel>

            {/* Move Statistics Table */}
            <div className="flex-1 bg-zinc-950/40 border border-white/5 rounded-xl overflow-hidden flex flex-col min-h-0">
                <div className="flex border-b border-white/5">
                    <button
                        onClick={() => setSource('masters')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${source === 'masters' ? 'text-amber-500 bg-amber-500/5' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Mestres
                    </button>
                    <button
                        onClick={() => setSource('lichess')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${source === 'lichess' ? 'text-indigo-500 bg-indigo-500/5' : 'text-zinc-500 hover:text-white'}`}
                    >
                        Lichess
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-zinc-900 text-zinc-500 font-bold uppercase text-[9px]">
                            <tr>
                                <th className="px-3 py-2">Moviment</th>
                                <th className="px-3 py-2 text-center">Partides</th>
                                <th className="px-3 py-2 text-right">Winrate %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {!loading && moves.length === 0 && (
                                <tr><td colSpan={3} className="p-8 text-center text-zinc-600">No hi ha dades disponibles per aquesta posició.</td></tr>
                            )}
                            {loading ? (
                                <tr><td colSpan={3} className="p-8 text-center text-zinc-600 animate-pulse">Consultant Big Data...</td></tr>
                            ) : moves.map((move: ExplorerMove) => {
                                const total = move.white + move.draws + move.black;
                                const whitePct = Math.round(getBarWidth(move.white, total));
                                const drawPct = Math.round(getBarWidth(move.draws, total));
                                const blackPct = Math.round(getBarWidth(move.black, total));

                                return (
                                    <tr
                                        key={move.uci}
                                        onClick={() => makeMove(move.uci.substring(0, 2), move.uci.substring(2, 4))}
                                        className="hover:bg-white/5 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-3 py-3 font-mono font-bold text-white group-hover:text-amber-400">
                                            {move.san}
                                        </td>
                                        <td className="px-3 py-3 text-center text-zinc-500 text-[10px]">
                                            {total.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-zinc-800 min-w-[80px]">
                                                <div style={{ width: `${whitePct}%` }} className="bg-zinc-200" />
                                                <div style={{ width: `${drawPct}%` }} className="bg-zinc-500" />
                                                <div style={{ width: `${blackPct}%` }} className="bg-zinc-900" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
