'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Swords, Zap, Timer, Turtle } from 'lucide-react';
import { Challenge } from '@/types/lobby';
import { useAuth } from '@/components/auth-provider';
import { cn } from '@/lib/utils';

interface LobbyMapProps {
    challenges: Challenge[];
    onJoin: (challenge: Challenge) => void;
    onEnterOwnChallenge: (challenge: Challenge) => void;
}

export function LobbyMap({ challenges, onJoin, onEnterOwnChallenge }: LobbyMapProps) {
    const { user } = useAuth();

    return (
        <div className="w-full h-[400px] relative overflow-hidden rounded-3xl bg-slate-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group/map">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(30,41,59,1)_0%,_rgba(2,6,23,1)_100%)] opacity-50" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

            {/* Animated Glows */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-amber-600/10 blur-[100px] rounded-full animate-pulse-slow" />

            {/* Grid for "Map" feeling */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative w-full h-full p-8">
                <AnimatePresence>
                    {challenges.map((challenge) => {
                        const isMyChallenge = challenge.host_id === user?.id;

                        let Icon = Timer;
                        let colorClass = "text-amber-400";
                        let bgClass = "bg-amber-500/10 border-amber-500/50";
                        let shadowClass = "shadow-amber-500/40";

                        if (challenge.time_control_type === 'bullet') {
                            Icon = Zap;
                            colorClass = "text-orange-400";
                            bgClass = "bg-orange-500/10 border-orange-500/50";
                            shadowClass = "shadow-orange-500/40";
                        } else if (challenge.time_control_type === 'rapid') {
                            Icon = Turtle;
                            colorClass = "text-emerald-400";
                            bgClass = "bg-emerald-500/10 border-emerald-500/50";
                            shadowClass = "shadow-emerald-500/40";
                        }

                        return (
                            <motion.div
                                key={challenge.id}
                                initial={{ scale: 0, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${challenge.map_x || 50}%`,
                                    top: `${challenge.map_y || 50}%`
                                }}
                            >
                                <div className="group/item relative">
                                    {/* Waves effect */}
                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${challenge.rated ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                                    {/* Node */}
                                    <button
                                        onClick={() => isMyChallenge ? onEnterOwnChallenge(challenge) : onJoin(challenge)}
                                        className={cn(
                                            "relative z-10 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300",
                                            "hover:scale-125 hover:rotate-6 active:scale-95 shadow-lg",
                                            bgClass, shadowClass,
                                            isMyChallenge ? "ring-2 ring-white animate-bounce" : ""
                                        )}
                                    >
                                        <Icon className={cn("w-6 h-6", colorClass)} />

                                        {/* Color Badge */}
                                        <div className={cn(
                                            "absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black",
                                            challenge.player_color === 'white' ? "bg-white" : challenge.player_color === 'black' ? "bg-black" : "bg-gradient-to-r from-white to-black"
                                        )} />
                                    </button>

                                    {/* Tooltip Card - More Premium */}
                                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 pointer-events-none z-50 min-w-[200px] translate-y-2 group-hover/item:translate-y-0">
                                        <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl relative">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-zinc-800 overflow-hidden border border-white/10 shadow-inner">
                                                    {challenge.host?.avatar_url ? (
                                                        <Image src={challenge.host.avatar_url} alt="Ava" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-black text-zinc-600 bg-zinc-900">?</div>
                                                    )}
                                                </div>
                                                <div className="text-left leading-tight">
                                                    <div className="font-black text-white text-sm tracking-tight">{challenge.host?.username || 'Guerrier'}</div>
                                                    <div className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                                        {challenge.rated ? 'Competitiu' : 'Casual'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between gap-2 bg-black/40 rounded-lg p-2 mb-3 border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <Icon size={14} className={colorClass} />
                                                    <span className="text-[10px] font-black font-mono text-zinc-300 uppercase">{challenge.time_control}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-amber-500">1200 ELO</span>
                                            </div>

                                            <div className={cn(
                                                "w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg",
                                                !isMyChallenge ? "bg-amber-500 text-black" : "bg-indigo-600 text-white"
                                            )}>
                                                {!isMyChallenge ? <><Swords size={12} /> LLUITAR</> : "EL TEU REPTE"}
                                            </div>

                                            {/* Arrow down */}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45 transform" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {challenges.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                        <Swords size={60} className="text-zinc-600 mb-4 animate-pulse" />
                        <p className="text-zinc-500 font-black text-xs uppercase tracking-[0.3em]">Sense reptes actius</p>
                    </div>
                )}
            </div>

            {/* Bottom Bar for the "Scene" */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur border border-white/10 flex gap-4 pointer-events-none">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Bullet</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Blitz</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Rapid</span></div>
            </div>
        </div>
    );
}

