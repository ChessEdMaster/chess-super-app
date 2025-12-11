'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Swords, Zap, Timer, Turtle } from 'lucide-react';
import { Challenge } from '@/types/lobby';
import { useAuth } from '@/components/auth-provider';

interface LobbyMapProps {
    challenges: Challenge[];
    onJoin: (challenge: Challenge) => void;
}

export function LobbyMap({ challenges, onJoin }: LobbyMapProps) {
    const { user } = useAuth();

    return (
        <div className="w-full h-full relative overflow-hidden rounded-xl bg-zinc-900/50 backdrop-blur border border-zinc-800 shadow-2xl">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 animate-pulse-slow pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-emerald-900/20 pointer-events-none" />

            {/* Grid Lines for Map effect */}
            <div className="absolute inset-0"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '10% 10%'
                }}
            />

            <div className="relative w-full h-full p-8">
                <AnimatePresence>
                    {challenges.map((challenge) => {
                        const isMyChallenge = challenge.host_id === user?.id;

                        return (
                            <motion.div
                                key={challenge.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{
                                    left: `${challenge.map_x}%`,
                                    top: `${challenge.map_y}%`
                                }}
                            >
                                <div className="group relative">
                                    {/* Pulse Effect */}
                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${challenge.rated ? 'bg-yellow-500' : 'bg-emerald-500'
                                        }`} />

                                    {/* Node */}
                                    <button
                                        onClick={() => onJoin(challenge)}
                                        disabled={isMyChallenge}
                                        className={`
                      relative z-10 w-4 h-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-150
                      ${challenge.rated ? 'bg-yellow-400 shadow-yellow-500/50' : 'bg-emerald-400 shadow-emerald-500/50'}
                      ${isMyChallenge ? 'cursor-default ring-2 ring-white' : 'cursor-pointer hover:ring-4 ring-white/20'}
                    `}
                                    />

                                    {/* Tooltip Card */}
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 min-w-[180px]">
                                        <div className="bg-zinc-900/95 backdrop-blur border border-zinc-700 p-3 rounded-lg shadow-xl text-center relative mt-2">
                                            {/* Arrow */}
                                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-700 rotate-45 transform" />

                                            <div className="flex items-center justify-center gap-2 mb-2">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden border border-zinc-600">
                                                    {challenge.host?.avatar_url ? (
                                                        <img src={challenge.host.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={16} className="text-zinc-400 m-auto mt-1" />
                                                    )}
                                                </div>
                                                <div className="text-left leading-tight">
                                                    <div className="font-bold text-white text-sm">{challenge.host?.username || 'Player'}</div>
                                                    <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                                                        {challenge.rated ? 'Competitiu' : 'Casual'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-center gap-2 bg-zinc-800/50 rounded p-1 mb-2">
                                                {challenge.time_control_type === 'bullet' && <Zap size={14} className="text-orange-400" />}
                                                {challenge.time_control_type === 'blitz' && <Timer size={14} className="text-yellow-400" />}
                                                {challenge.time_control_type === 'rapid' && <Turtle size={14} className="text-emerald-400" />}
                                                <span className="text-xs font-mono font-bold text-zinc-300 uppercase">{challenge.time_control_type}</span>
                                            </div>

                                            {!isMyChallenge ? (
                                                <div className="bg-emerald-600 text-white text-[10px] font-bold py-1 px-2 rounded uppercase tracking-widest flex items-center justify-center gap-1">
                                                    Jugar <Swords size={10} />
                                                </div>
                                            ) : (
                                                <div className="text-zinc-500 text-[10px]">La teva partida</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {challenges.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center opacity-30">
                            <div className="w-64 h-64 border-2 border-dashed border-zinc-600 rounded-full animate-spin-slow m-auto mb-4" />
                            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Esperant senyals...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
