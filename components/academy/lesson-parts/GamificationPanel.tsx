'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, ArrowRight, Sparkles } from 'lucide-react';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { playSound } from '@/lib/sounds';
import confetti from 'canvas-confetti';

interface GamificationPanelProps {
    data: {
        badge_name: string;
        badge_emoji: string;
        badge_description: string;
    };
    onFinish: () => void;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ data, onFinish }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        playSound('game_end');

        // Burst of confetti
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#F59E0B', '#FCD34D', '#FFFFFF']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#F59E0B', '#FCD34D', '#FFFFFF']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-center w-full max-w-4xl mx-auto perspective-1000">
            <motion.div
                initial={{ opacity: 0, scale: 0.5, rotateX: 45 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
                className="relative z-10"
            >
                {/* Glowing Background behind Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full animate-pulse-slow pointer-events-none" />

                {/* Badge Container with 3D Float */}
                <motion.div
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative mb-12"
                >
                    <div className="text-[140px] md:text-[180px] filter drop-shadow-[0_20px_50px_rgba(245,158,11,0.4)] transform hover:scale-110 transition-transform cursor-pointer">
                        {data.badge_emoji}
                    </div>

                    {/* Floating Stars */}
                    <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-4 -right-8 text-yellow-300 drop-shadow-lg"
                    >
                        <Star fill="currentColor" size={64} />
                    </motion.div>
                    <motion.div
                        animate={{ rotate: -360, scale: [1, 1.5, 1] }}
                        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                        className="absolute bottom-4 -left-8 text-amber-400 drop-shadow-lg"
                    >
                        <Sparkles fill="currentColor" size={48} />
                    </motion.div>
                </motion.div>

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative z-20"
                >
                    <div className="inline-block px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase tracking-widest text-xs mb-4">
                        Recompensa Desbloquejada
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-display uppercase tracking-tight leading-none bg-gradient-to-br from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">
                        {data.badge_name}
                    </h2>

                    <p className="text-xl text-zinc-300 font-medium mb-12 leading-relaxed max-w-lg mx-auto">
                        {data.badge_description}
                    </p>

                    <ShinyButton
                        variant="primary"
                        onClick={onFinish}
                        className="px-16 py-6 text-xl font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(245,158,11,0.3)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.5)] hover:bg-amber-500 border-amber-400/50 hover:scale-105 transition-all group"
                    >
                        Continuar <ArrowRight size={24} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </ShinyButton>
                </motion.div>
            </motion.div>
        </div>
    );
};
