'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Swords, User } from 'lucide-react';
import { motion } from 'framer-motion';

function MatchmakingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = searchParams.get('mode') || 'blitz';
    const [status, setStatus] = useState<'searching' | 'found' | 'starting' | 'bot_offer'>('searching');
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (status === 'searching') {
            interval = setInterval(() => {
                setElapsedTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= 15) {
                        setStatus('bot_offer');
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [status]);

    const handlePlayBot = (difficulty: number) => {
        setStatus('starting');
        // In a real app, we would create a game with a bot ID
        const gameId = `bot-${difficulty}-${Math.random().toString(36).substring(7)}`;
        setTimeout(() => {
            router.push(`/play/online/${gameId}`);
        }, 1000);
    };

    const handleKeepSearching = () => {
        setStatus('searching');
        setElapsedTime(0);
    };

    return (
        <div className="h-full w-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-96 h-96 bg-blue-500 rounded-full blur-3xl"
                />
            </div>

            <div className="z-10 flex flex-col items-center gap-8 w-full max-w-md px-4">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
                        {mode} Arena
                    </h1>
                    <p className="text-zinc-400 animate-pulse font-mono">
                        {status === 'searching' && `Searching for opponent... (${elapsedTime}s)`}
                        {status === 'found' && "Opponent Found!"}
                        {status === 'starting' && "Starting Game..."}
                        {status === 'bot_offer' && "No players found nearby."}
                    </p>
                </div>

                {status === 'bot_offer' ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/90 backdrop-blur-md border border-zinc-700 rounded-2xl p-6 w-full shadow-2xl"
                    >
                        <h3 className="text-xl font-bold text-white mb-4 text-center">Play vs Bot?</h3>
                        <div className="grid grid-cols-1 gap-3 mb-4">
                            <button
                                onClick={() => handlePlayBot(1)}
                                className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition-transform active:scale-95"
                            >
                                Easy Bot (800)
                            </button>
                            <button
                                onClick={() => handlePlayBot(2)}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-xl font-bold transition-transform active:scale-95"
                            >
                                Medium Bot (1200)
                            </button>
                            <button
                                onClick={() => handlePlayBot(3)}
                                className="bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-transform active:scale-95"
                            >
                                Hard Bot (1600)
                            </button>
                        </div>
                        <button
                            onClick={handleKeepSearching}
                            className="w-full text-zinc-400 hover:text-white text-sm py-2"
                        >
                            Keep Searching...
                        </button>
                    </motion.div>
                ) : (
                    <div className="flex items-center gap-8">
                        {/* Player */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-20 bg-zinc-800 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                                <User size={40} className="text-blue-500" />
                            </div>
                            <span className="font-bold text-white">You</span>
                        </div>

                        <div className="text-zinc-600">
                            <Swords size={48} />
                        </div>

                        {/* Opponent */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-20 h-20 bg-zinc-800 rounded-full border-4 flex items-center justify-center transition-all ${status === 'found' || status === 'starting' ? 'border-red-500 bg-zinc-800 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-zinc-700 border-dashed'}`}>
                                {status === 'found' || status === 'starting' ? (
                                    <User size={40} className="text-red-500" />
                                ) : (
                                    <Loader2 size={32} className="text-zinc-600 animate-spin" />
                                )}
                            </div>
                            <span className="font-bold text-zinc-500">
                                {status === 'found' || status === 'starting' ? "Opponent" : "Searching..."}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MatchmakingPage() {
    return (
        <Suspense fallback={<div className="h-full w-full bg-zinc-950 flex items-center justify-center text-zinc-500">Loading Arena...</div>}>
            <MatchmakingContent />
        </Suspense>
    );
}
