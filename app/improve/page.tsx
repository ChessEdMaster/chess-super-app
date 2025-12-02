'use client';

import React from 'react';
import { PlayCircle, BookOpen, Search, Video } from 'lucide-react';
import Link from 'next/link';

export default function ImprovePage() {
    const tools = [
        {
            name: 'Analysis Board',
            icon: Search,
            href: '/analysis',
            color: 'bg-blue-500',
            description: 'Analyze your games with Stockfish'
        },
        {
            name: 'Opening Explorer',
            icon: BookOpen,
            href: '/analysis', // Placeholder
            color: 'bg-emerald-500',
            description: 'Master your favorite openings'
        },
        {
            name: 'Endgames',
            icon: PlayCircle,
            href: '/academy', // Placeholder
            color: 'bg-purple-500',
            description: 'Practice essential endgames'
        },
        {
            name: 'Content Creation',
            icon: Video,
            href: '/studio', // Placeholder
            color: 'bg-pink-500',
            description: 'Create studies and videos'
        }
    ];

    return (
        <div className="h-full w-full bg-zinc-950 p-4 overflow-y-auto pb-32">
            <h1 className="text-2xl font-black text-white mb-6 uppercase tracking-wider italic">
                Improve
            </h1>

            <div className="grid grid-cols-1 gap-4">
                {tools.map((tool) => (
                    <Link
                        key={tool.name}
                        href={tool.href}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 hover:bg-zinc-800 transition-colors group"
                    >
                        <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                            <tool.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{tool.name}</h3>
                            <p className="text-zinc-400 text-sm">{tool.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
