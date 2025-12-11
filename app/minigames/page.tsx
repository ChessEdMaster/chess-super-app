'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Gamepad2, ArrowLeft, Crown, Layers,
    RefreshCcw, Hexagon, Trophy, Users, Dices,
    MonitorCheck, Goal
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameItem {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    comingSoon?: boolean;
    href?: string;
    tags: ('Solo' | 'Multiplayer' | 'Nou')[];
}

const GAMES: GameItem[] = [
    {
        id: 'futchess',
        title: 'FutChess',
        description: 'La fusió definitiva entre escacs i futbol. Marca gols capturant peces!',
        icon: Goal,
        color: 'text-emerald-400',
        tags: ['Multiplayer', 'Nou'],
        href: '/minigames/futchess'
    },
    {
        id: 'king-hll',
        title: 'Rei de la Muntanya',
        description: 'Porta el teu rei al centre del tauler (e4, d4, e5, d5) per guanyar.',
        icon: Crown,
        color: 'text-amber-400',
        tags: ['Multiplayer']
    },
    {
        id: 'passapeces',
        title: 'Passapeces',
        description: 'Les peces capturades passen a la teva reserva per ser col·locades de nou.',
        icon: Layers,
        color: 'text-blue-400',
        tags: ['Multiplayer']
    },
    {
        id: 'menjapeces',
        title: 'Menjapeces',
        description: 'Antichess. Estàs obligat a capturar. Guanya qui es queda sense peces.',
        icon: RefreshCcw,
        color: 'text-red-400',
        tags: ['Multiplayer']
    },
    {
        id: '960',
        title: 'Escacs 960',
        description: 'Posició inicial aleatòria de les peces majors. Adéu a la teoria d\'obertures.',
        icon: Dices,
        color: 'text-purple-400',
        tags: ['Multiplayer']
    },
    {
        id: '8-queens',
        title: 'Repte 8 Dames',
        description: 'Col·loca 8 dames al tauler sense que s\'amenacin entre elles.',
        icon: Trophy,
        color: 'text-pink-400',
        tags: ['Solo'],
        href: '/minigames/8-queens'
    },
    {
        id: 'guarini',
        title: 'Problema de Guarini',
        description: 'Intercanvia la posició dels cavalls blancs i negres al mini tauler.',
        icon: Hexagon,
        color: 'text-cyan-400',
        tags: ['Solo']
    },
    {
        id: 'knight-runner',
        title: 'Knight Runner',
        description: 'Captura tots els punts amb el cavall el més ràpid possible.',
        icon: MonitorCheck,
        color: 'text-orange-400',
        tags: ['Solo']
    }
];

export default function MinigamesPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <header className="flex items-center gap-4 mb-12">
                    <Link href="/">
                        <Button variant="ghost" className="hover:bg-zinc-800 text-zinc-400 hover:text-white">
                            <ArrowLeft className="mr-2" size={20} /> Tornar
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black italic flex items-center gap-3">
                            <Gamepad2 className="text-indigo-500" size={32} />
                            ARCADE CHESS
                        </h1>
                        <p className="text-zinc-400 mt-1">Col·lecció de minijocs i variants per desconnectar.</p>
                    </div>
                </header>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {GAMES.map((game, i) => (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={game.href || '#'} className={`block h-full ${!game.href ? 'cursor-not-allowed opacity-60' : ''}`} onClick={e => !game.href && e.preventDefault()}>
                                <div className="h-full bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-5 hover:bg-zinc-800/80 hover:border-indigo-500/50 transition-all group relative overflow-hidden">

                                    {/* Icon Background */}
                                    <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 ${game.color}`}>
                                        <game.icon size={120} />
                                    </div>

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors ${game.color}`}>
                                            <game.icon size={24} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {game.tags.map(tag => (
                                                <span key={tag} className={`
                                                    text-[10px] font-bold px-2 py-0.5 rounded uppercase
                                                    ${tag === 'Multiplayer' ? 'bg-blue-500/10 text-blue-400' : ''}
                                                    ${tag === 'Solo' ? 'bg-emerald-500/10 text-emerald-400' : ''}
                                                    ${tag === 'Nou' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                                               `}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-300 transition-colors">{game.title}</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        {game.description}
                                    </p>

                                    {!game.href && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="font-bold text-xs uppercase tracking-widest border border-white/20 px-3 py-1 rounded-full bg-black/50">
                                                Coming Soon
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
