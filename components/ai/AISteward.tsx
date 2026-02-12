'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, BarChart3, Users, Zap, MessageSquare, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';

interface Insight {
    id: string;
    type: 'performance' | 'engagement' | 'optimization';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
}

interface AIStewardProps {
    context?: 'school' | 'club' | 'global';
    data?: any;
}

export function AISteward({ context = 'global', data }: AIStewardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);

    const analyzeData = () => {
        setIsAnalyzing(true);
        // Simulate AI analysis delay
        setTimeout(() => {
            const mockInsights: Insight[] = [
                {
                    id: '1',
                    type: 'performance',
                    title: 'Ritme d\'Aprenentatge Elevat',
                    description: 'Els teus alumnes han completat un 25% més de lliçons aquesta setmana. Considera afegir contingut de nivell Intermediate.',
                    impact: 'high'
                },
                {
                    id: '2',
                    type: 'engagement',
                    title: 'Pico d\'Activitat a l\'Arena',
                    description: 'El Blitz és la variant preferida. Podries organitzar un torneig de divendres per maximitzar la participació.',
                    impact: 'medium'
                },
                {
                    id: '3',
                    type: 'optimization',
                    title: 'Eficiència del Regne',
                    description: 'Tens reserves de Manà acumulades. Recomano construir un segon "Nexus de Manà" per accelerar la producció d\'Or.',
                    impact: 'low'
                }
            ];
            setInsights(mockInsights);
            setIsAnalyzing(false);
        }, 2000);
    };

    useEffect(() => {
        if (isOpen && insights.length === 0) {
            analyzeData();
        }
    }, [isOpen]);

    return (
        <>
            {/* Float Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[60] p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-white/20 hover:scale-110 active:scale-95 transition-all group"
            >
                <Sparkles className="text-white group-hover:rotate-12 transition-transform" size={24} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </button>

            {/* Side Panel Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 z-[80] flex flex-col shadow-2xl"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/5 bg-gradient-to-br from-indigo-600/10 to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                                        <Sparkles className="text-indigo-400" size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">
                                            AI Steward
                                        </h2>
                                        <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">
                                            Assistent de Gestió Intel·ligent
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {isAnalyzing ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
                                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Analitzant dades del Regne...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Activity Summary */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                                <Users size={16} className="text-blue-400 mb-2" />
                                                <div className="text-lg font-black text-white">128</div>
                                                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">Estudiants Actius</div>
                                            </div>
                                            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                                <Zap size={16} className="text-amber-400 mb-2" />
                                                <div className="text-lg font-black text-white">+14%</div>
                                                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">Creixement SEM.</div>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-black uppercase text-zinc-400 tracking-widest pt-4">Insights de l'Steward</h3>

                                        <div className="space-y-4">
                                            {insights.map((insight, idx) => (
                                                <motion.div
                                                    key={insight.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                >
                                                    <GameCard className="p-5 bg-zinc-900/30 border-white/5 hover:border-indigo-500/50 transition-colors group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className={`
                                                                px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest
                                                                ${insight.type === 'performance' ? 'bg-blue-500/20 text-blue-400' :
                                                                    insight.type === 'engagement' ? 'bg-amber-500/20 text-amber-400' :
                                                                        'bg-purple-500/20 text-purple-400'}
                                                            `}>
                                                                {insight.type}
                                                            </div>
                                                            <div className={`h-1.5 w-1.5 rounded-full ${insight.impact === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                                    insight.impact === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                                }`} />
                                                        </div>
                                                        <h4 className="text-white font-black uppercase text-sm mb-1 group-hover:text-indigo-400 transition-colors">
                                                            {insight.title}
                                                        </h4>
                                                        <p className="text-zinc-500 text-xs font-medium leading-relaxed">
                                                            {insight.description}
                                                        </p>
                                                        <button className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors">
                                                            Optimitzar <ChevronRight size={12} />
                                                        </button>
                                                    </GameCard>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chat Input Area */}
                            <div className="p-8 border-t border-white/5 bg-zinc-900/30">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Pregunta qualsevol cosa a l'Steward..."
                                        className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-4 px-6 pr-12 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-zinc-700"
                                    />
                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-xl text-white">
                                        <MessageSquare size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
