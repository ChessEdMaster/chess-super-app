'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, ArrowRight } from 'lucide-react';
import { ShinyButton } from '@/components/ui/design-system/ShinyButton';
import { playSound } from '@/lib/sounds';

interface GamificationPanelProps {
    data: {
        badge_name: string;
        badge_emoji: string;
        badge_description: string;
    };
    onFinish: () => void;
}

export const GamificationPanel: React.FC<GamificationPanelProps> = ({ data, onFinish }) => {

    React.useEffect(() => {
        playSound('game_end');
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto">
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="mb-8 relative"
            >
                <div className="text-[120px] filter drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce-slow">
                    {data.badge_emoji}
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-4 -right-4 text-yellow-300 animate-pulse"
                >
                    <Star fill="currentColor" size={48} />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-3xl font-black text-white mb-2 font-display uppercase tracking-wide bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                    {data.badge_name}
                </h2>
                <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full mb-6" />

                <p className="text-lg text-zinc-300 font-medium mb-12 leading-relaxed">
                    {data.badge_description}
                </p>

                <ShinyButton
                    variant="primary"
                    onClick={onFinish}
                    className="px-12 py-4 text-lg font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                    Continuar <ArrowRight size={20} className="ml-2" />
                </ShinyButton>
            </motion.div>
        </div>
    );
};
