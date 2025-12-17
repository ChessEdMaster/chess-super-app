'use client';

import React from 'react';
import { PlayCircle, BookOpen, Search, Video, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Panel } from '@/components/ui/design-system/Panel';
import { GameCard } from '@/components/ui/design-system/GameCard';

export default function ImprovePage() {
    const tools = [
        {
            name: 'Analysis Board',
            icon: Search,
            href: '/analysis',
            color: 'from-blue-500 to-cyan-500',
            iconColor: 'text-blue-100',
            borderColor: 'border-blue-500/30',
            description: 'Analyze your games with Deep Stockfish'
        },
        {
            name: 'Opening Explorer',
            icon: BookOpen,
            href: '/openings',
            color: 'from-emerald-500 to-green-600',
            iconColor: 'text-emerald-100',
            borderColor: 'border-emerald-500/30',
            description: 'Master your favorite openings and lines'
        },
        {
            name: 'Endgames',
            icon: PlayCircle,
            href: '/academy',
            color: 'from-purple-500 to-violet-600',
            iconColor: 'text-purple-100',
            borderColor: 'border-purple-500/30',
            description: 'Practice essential endgames to win'
        },
        {
            name: 'Content Creation',
            icon: Video,
            href: '/studio',
            color: 'from-pink-500 to-rose-600',
            iconColor: 'text-pink-100',
            borderColor: 'border-pink-500/30',
            description: 'Create studies, videos and share them'
        }
    ];

    return (
        <div className="h-full w-full p-4 md:p-6 overflow-y-auto custom-scrollbar pb-24 max-w-5xl mx-auto">
            {/* Header */}
            <Panel className="mb-8 p-8 flex items-center justify-between border-b-4 border-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-5"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white uppercase tracking-wider font-display text-stroke shadow-black drop-shadow-md mb-2">
                        Improve Your Game
                    </h1>
                    <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest max-w-lg">
                        Access powerful tools to analyze, learn, and master every phase of the game.
                    </p>
                </div>
                <div className="hidden md:block">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-xl opacity-80 rotate-12">
                        <Search size={40} className="text-white/50" />
                    </div>
                </div>
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                    <Link
                        key={tool.name}
                        href={tool.href}
                        className="group block"
                    >
                        <GameCard
                            variant="default"
                            className={`p-6 flex items-center gap-6 hover:bg-zinc-800 transition-all duration-300 border-2 ${tool.borderColor} group-hover:scale-[1.02]`}
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform border-2 border-white/20`}>
                                <tool.icon size={32} className={`${tool.iconColor} drop-shadow-md`} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-white text-lg uppercase tracking-wide mb-1 group-hover:text-amber-400 transition-colors">
                                    {tool.name}
                                </h3>
                                <p className="text-zinc-400 text-sm font-medium leading-relaxed">
                                    {tool.description}
                                </p>
                            </div>
                            <div className="p-2 rounded-full bg-zinc-900 text-zinc-600 group-hover:bg-amber-500 group-hover:text-amber-950 transition-colors">
                                <ArrowRight size={20} />
                            </div>
                        </GameCard>
                    </Link>
                ))}
            </div>

            <div className="mt-12 p-8 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800 text-center">
                <p className="text-zinc-500 font-bold uppercase tracking-wider text-xs mb-2">Coming Soon</p>
                <h3 className="text-white font-black text-xl mb-4">More Training Tools</h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                    We are working on advanced drills, tactical trainers, and personalized coaching AI. Stay tuned for updates!
                </p>
            </div>
        </div>
    );
}
