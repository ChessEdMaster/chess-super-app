'use client';

import React, { useState } from 'react';
import { BotEngine } from '@/lib/game/bot-engine';
import { Brain, Lightbulb, Sparkles, MessageCircle, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

interface AICoachProps {
    fen: string;
    onSuggestMove?: (move: { from: string; to: string; promotion?: string }) => void;
}

export function AICoach({ fen, onSuggestMove }: AICoachProps) {
    const [hint, setHint] = useState<{ move: string; explanation: string } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const getHint = async () => {
        setIsAnalyzing(true);
        // Simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const engine = new BotEngine(fen, 'HARD');
        const move = engine.makeMove();

        if (move) {
            const moveStr = `${move.from}  ${move.to}`;

            // Pedagogical explanations based on random themes (Mocked for MVP)
            const themes = [
                "Aquest moviment controla el centre i limita les opcions de l'oponent.",
                "Estem millorant la posició d'una peça poc activa per preparar un atac.",
                "Aquesta jugada posa pressió sobre una debilitat en l'estructura de peons rival.",
                "Defensem una peça clau mentre mantenim la tensió al flanc de dama.",
                "És una jugada profilàctica que evita el contrajoc que l'oponent estava planejant."
            ];

            const explanation = themes[Math.floor(Math.random() * themes.length)];

            setHint({ move: moveStr, explanation });
        }
        setIsAnalyzing(false);
    };

    return (
        <Panel className="bg-indigo-950/40 border-indigo-500/20 backdrop-blur-xl p-6 relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />

            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
                    <Brain className="text-indigo-400" size={28} />
                </div>
                <div>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-1 leading-none">
                        Mestre Coach
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-indigo-300/60 text-[10px] font-bold uppercase tracking-widest leading-none">
                            IA Pedagògica Activa
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative min-h-[120px]">
                <AnimatePresence mode="wait">
                    {!hint ? (
                        <motion.div
                            key="ask"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <p className="text-xs text-indigo-300/80 leading-relaxed font-medium">
                                "Puc analitzar la teva posició i donar-te consells estratègics. No facis trampes en partides PVP!"
                            </p>
                            <ShinyButton
                                onClick={getHint}
                                disabled={isAnalyzing}
                                className={`w-full py-3 text-[10px] font-black tracking-widest transition-all ${isAnalyzing ? 'opacity-50 grayscale' : ''}`}
                                variant="primary"
                            >
                                {isAnalyzing ? (
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="animate-spin" size={12} />
                                        ANALITZANT...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <MessageCircle size={12} />
                                        DEMANAR PISTA
                                    </div>
                                )}
                            </ShinyButton>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="hint"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 shadow-inner"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2 text-indigo-400">
                                    <Lightbulb size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Sugerència</span>
                                </div>
                                <button
                                    onClick={() => setHint(null)}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X size={12} className="text-indigo-400" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl font-black text-white font-mono tracking-tighter bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                                    {hint.move}
                                </span>
                                <ChevronRight className="text-indigo-500/50" />
                            </div>

                            <p className="text-xs text-indigo-100/90 italic leading-relaxed font-medium">
                                "{hint.explanation}"
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Panel>
    );
}
