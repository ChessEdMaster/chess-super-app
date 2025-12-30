'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import { Panel } from '@/components/ui/design-system/Panel';

interface VideoPanelProps {
    script: {
        intro: string;
        key_concepts: string[];
        outro: string;
    };
    onComplete: () => void;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({ script, onComplete }) => {
    return (
        <div className="flex flex-col gap-6 h-full max-w-2xl mx-auto">
            {/* Story / Intro Section */}
            <Panel className="bg-gradient-to-br from-indigo-950/50 to-indigo-900/20 border-indigo-500/30 p-6 md:p-8 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen size={120} className="text-indigo-400" />
                </div>

                <h2 className="text-2xl font-black text-white mb-4 font-display uppercase tracking-wide flex items-center gap-3">
                    <span className="text-indigo-400">01.</span> La Història
                </h2>

                <p className="text-indigo-100 text-lg leading-relaxed font-medium relative z-10">
                    &quot;{script.intro}&quot;
                </p>
            </Panel>

            {/* Key Concepts */}
            <div className="grid gap-4">
                {script.key_concepts.map((concept, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-start gap-3 hover:border-amber-500/30 transition-colors"
                    >
                        <div className="mt-1 p-1 bg-amber-500/10 rounded-full text-amber-500">
                            <CheckCircle2 size={16} />
                        </div>
                        <p className="text-zinc-300 text-sm leading-relaxed">{concept}</p>
                    </motion.div>
                ))}
            </div>

            {/* Outro / Call to Action */}
            <div className="mt-auto pt-6 text-center">
                <button
                    onClick={onComplete}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                >
                    <PlayCircle size={24} className="group-hover:rotate-12 transition-transform" />
                    Començar Lliçó
                </button>
            </div>
        </div>
    );
};
