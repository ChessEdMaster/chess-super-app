'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Gamepad2, ArrowLeft, Crown, Layers,
    RefreshCcw, Hexagon, Trophy, Users, Dices,
    MonitorCheck, Goal,
    Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameCard } from '@/components/ui/design-system/GameCard';
import { Panel } from '@/components/ui/design-system/Panel';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';

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
        <div className="min-h-screen p-6 overflow-hidden relative flex flex-col gap-8 bg-[var(--background)]">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

            {/* Header */}
            <Panel className="flex flex-col md:flex-row items-center justify-between p-6 bg-[var(--header-bg)] border-[var(--border)] relative z-10">
                <div className="flex items-center gap-6">
                    <Link href="/">
                        <Button variant="ghost" className="hover:bg-[var(--color-muted)] text-[var(--color-secondary)] hover:text-[var(--foreground)] rounded-xl h-12 w-12 p-0 flex items-center justify-center border border-[var(--border)]">
                            <ArrowLeft size={24} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black italic flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-indigo-100 to-indigo-400 uppercase tracking-tighter text-stroke drop-shadow-lg font-display">
                            <Gamepad2 className="text-indigo-400 fill-indigo-900 stroke-[1.5]" size={48} />
                            Arcade Zone
                        </h1>
                        <p className="text-[var(--color-secondary)] font-bold uppercase tracking-widest text-xs mt-2 ml-1">
                            Minigames & Variants Collection
                        </p>
                    </div>
                </div>
            </Panel>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto w-full relative z-10">
                {GAMES.map((game, i) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Link href={game.href || '#'} className={`block h-full ${!game.href ? 'cursor-not-allowed opacity-60' : ''}`} onClick={e => !game.href && e.preventDefault()}>
                            <GameCard variant="default" className="h-full bg-[var(--card-bg)] hover:bg-[var(--panel-bg)] transition-all group relative overflow-hidden flex flex-col border-[var(--border)] hover:border-indigo-500/50">

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4 p-4 pb-0 z-10">
                                    <div className={`p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] shadow-inner group-hover:scale-110 transition-transform duration-300 ${game.color}`}>
                                        <game.icon size={28} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {game.tags.map(tag => (
                                            <span key={tag} className={`
                                                    text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider shadow-sm
                                                    ${tag === 'Multiplayer' ? 'bg-blue-950/50 text-blue-400 border-blue-500/30' : ''}
                                                    ${tag === 'Solo' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30' : ''}
                                                    ${tag === 'Nou' ? 'bg-amber-950/50 text-amber-400 border-amber-500/30 animate-pulse' : ''}
                                               `}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 pt-0 flex-1 flex flex-col z-10">
                                    <h3 className="text-xl font-black mb-2 text-[var(--foreground)] group-hover:text-indigo-400 transition-colors font-display uppercase tracking-wide">
                                        {game.title}
                                    </h3>
                                    <p className="text-xs font-medium text-[var(--color-secondary)] leading-relaxed">
                                        {game.description}
                                    </p>
                                </div>

                                {/* Decorative Background Icon */}
                                <div className={`absolute -right-4 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 group-hover:rotate-[-10deg] duration-500 ${game.color}`}>
                                    <game.icon size={160} />
                                </div>

                                {!game.href && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <div className="transform rotate-[-10deg] border-2 border-[var(--color-secondary)] text-[var(--color-secondary)] px-4 py-1 font-black text-xl uppercase tracking-widest bg-black">
                                            Coming Soon
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 pt-0 mt-auto z-10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <ShinyButton variant={game.href ? 'primary' : 'neutral'} disabled={!game.href} className="w-full text-xs h-9">
                                        Detailed Info
                                    </ShinyButton>
                                </div>
                            </GameCard>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
