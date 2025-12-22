'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useSettings } from '@/lib/settings';

export function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const { backgroundImage } = useSettings(); // Optional: to match background if needed, but we'll use a glass overlay

    useEffect(() => {
        // Enforce minimum display time for the "process" feel
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-slate-950/80 backdrop-blur-md"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                >
                     {/* Background Glow Effect - subtle reinforcement of theme */}
                    <div className="absolute inset-0 z-0">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] opacity-50 animate-pulse" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* Logo Animation */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="mb-8 relative"
                        >
                            <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center border-t-2 border-amber-300 shadow-[0_8px_0_#b45309,0_20px_40px_rgba(0,0,0,0.5)] transform rotate-3">
                                <Trophy size={64} className="text-white drop-shadow-lg" />
                            </div>
                            {/* Shine effect on logo */}
                             <motion.div
                                className="absolute inset-0 bg-white/20 rounded-3xl"
                                initial={{ x: '-100%', opacity: 0 }}
                                animate={{ x: '100%', opacity: [0, 0.5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 1 }}
                            />
                        </motion.div>

                        {/* Title Animation */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-5xl font-black text-white mb-2 font-display uppercase tracking-widest text-stroke drop-shadow-2xl"
                        >
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
                                Chess
                            </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 ml-4">
                                Clans
                            </span>
                        </motion.h1>

                        {/* Subtitle/Loading Text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            className="flex flex-col items-center mt-8 space-y-4"
                        >
                            <p className="text-amber-100/70 font-display tracking-widest text-sm uppercase">Carregant Aplicació...</p>
                            
                            {/* Loading Bar */}
                            <div className="w-64 h-1 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
                                <motion.div
                                    className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2.2, ease: "easeInOut" }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
