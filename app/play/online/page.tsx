'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Swords, User } from 'lucide-react';
import { motion } from 'framer-motion';

function MatchmakingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const mode = searchParams.get('mode') || 'blitz';
    const [status, setStatus] = useState('searching'); // searching, found, starting

    useEffect(() => {
        // Mock Matchmaking
        const timer1 = setTimeout(() => {
            setStatus('found');
        }, 2000);

        const timer2 = setTimeout(() => {
            setStatus('starting');
            // Mock Game ID
            const gameId = Math.random().toString(36).substring(7);
            router.push(`/play/online/${gameId}`);
        }, 3500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [router]);

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

            <div className="z-10 flex flex-col items-center gap-8">
                <div className="text-center">
                    <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
                        {mode} Arena
                    </h1>
                    <p className="text-zinc-400 animate-pulse">
                        {status === 'searching' && "Searching for opponent..."}
                        {status === 'found' && "Opponent Found!"}
                        {status === 'starting' && "Starting Game..."}
                    </p>
                </div>

                <div className="flex items-center gap-8">
                    {/* Player */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full border-4 border-blue-500 flex items-center justify-center">
                            <User size={40} className="text-blue-500" />
                        </div>
                        <span className="font-bold text-white">You</span>
                    </div>

                    <div className="text-zinc-600">
                        <Swords size={48} />
                    </div>

                    {/* Opponent */}
                    <div className="flex flex-col items-center gap-2">
                        <div className={`w-20 h-20 bg-zinc-800 rounded-full border-4 flex items-center justify-center transition-colors ${status !== 'searching' ? 'border-red-500 bg-zinc-800' : 'border-zinc-700 border-dashed'}`}>
                            {status !== 'searching' ? (
                                <User size={40} className="text-red-500" />
                            ) : (
                                <Loader2 size={32} className="text-zinc-600 animate-spin" />
                            )}
                        </div>
                        <span className="font-bold text-zinc-500">
                            {status !== 'searching' ? "Opponent" : "Searching..."}
                        </span>
                    </div>
                </div>
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
