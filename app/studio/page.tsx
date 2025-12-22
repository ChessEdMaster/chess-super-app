'use client';

import React from 'react';
import { Video, Mic, Layout, Upload, Settings, PlayCircle, BarChart3, Users } from 'lucide-react';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';

export default function StudioPage() {
    const tools = [
        {
            icon: Mic,
            label: "Record Voiceover",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "group-hover:border-blue-500/50"
        },
        {
            icon: Layout,
            label: "Study Editor",
            color: "text-green-400",
            bg: "bg-green-500/10",
            border: "group-hover:border-green-500/50"
        },
        {
            icon: Upload,
            label: "Upload PGN",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "group-hover:border-purple-500/50"
        },
        {
            icon: Video,
            label: "Go Live",
            color: "text-red-400",
            bg: "bg-red-500/10",
            border: "group-hover:border-red-500/50"
        },
        {
            icon: PlayCircle,
            label: "My Content",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "group-hover:border-amber-500/50"
        },
        {
            icon: BarChart3,
            label: "Analytics",
            color: "text-cyan-400",
            bg: "bg-cyan-500/10",
            border: "group-hover:border-cyan-500/50"
        },
    ];

    return (
        <div className="min-h-screen w-full bg-[var(--background)] p-6 flex flex-col items-center justify-center font-sans overflow-y-auto">
            <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5 pointer-events-none"></div>

            <div className="max-w-4xl w-full relative z-10">
                <Panel className="p-8 md:p-12 flex flex-col items-center text-center mb-8 border-pink-500/20 bg-gradient-to-b from-[var(--card-bg)] via-[var(--card-bg)] to-[var(--background)]">
                    <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-pink-900/20 transform rotate-3 border-4 border-pink-400/50">
                        <Video size={64} className="text-white drop-shadow-md" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-wide font-display text-stroke shadow-black drop-shadow-lg">
                        Content Studio
                    </h1>
                    <p className="text-zinc-400 max-w-lg mb-8 text-lg font-medium leading-relaxed">
                        Create educational content, record analysis videos, and build your own chess courses to share with the community.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
                        {tools.map((tool, i) => (
                            <button key={i} className="group outline-none">
                                <GameCard variant="default" className={`p-6 flex flex-col items-center gap-4 hover:bg-[var(--card-bg)] transition-all duration-300 border-2 border-[var(--border)] ${tool.border} hover:-translate-y-1 hover:shadow-xl`}>
                                    <div className={`w-16 h-16 rounded-2xl ${tool.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                                        <tool.icon size={32} className={`${tool.color} drop-shadow-sm`} />
                                    </div>
                                    <span className="text-sm font-black text-[var(--color-secondary)] group-hover:text-[var(--foreground)] uppercase tracking-wide">
                                        {tool.label}
                                    </span>
                                </GameCard>
                            </button>
                        ))}
                    </div>
                </Panel>

                <p className="text-center text-zinc-600 text-xs font-bold uppercase tracking-widest">
                    Version 2.0.4 • Creator Tools Beta
                </p>
            </div>
        </div>
    );
}
