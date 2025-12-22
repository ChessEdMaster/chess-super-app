'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Chest } from '@/types/rpg';
import { Lock, Clock, Gift } from 'lucide-react';

interface IsoChestProps {
    chest: Chest | null;
    onClick?: () => void;
}

export function IsoChest({ chest, onClick }: IsoChestProps) {
    if (!chest) {
        return (
            <div className="w-24 h-24 flex items-center justify-center relative opacity-30">
                <div className="w-16 h-8 bg-black/20 rounded-full blur-md absolute bottom-2" />
                <div className="w-16 h-16 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center transform rotate-0 hover:rotate-6 transition-transform">
                    <span className="text-xs font-bold text-white/50">SLOT</span>
                </div>
            </div>
        );
    }

    const isReady = chest.status === 'READY';
    const isUnlocking = chest.status === 'UNLOCKING';

    const color =
        chest.type === 'GOLDEN' ? 'from-amber-300 to-yellow-600 border-amber-200' :
            chest.type === 'SILVER' ? 'from-slate-300 to-slate-500 border-slate-200' :
                chest.type === 'LEGENDARY' ? 'from-purple-400 to-indigo-600 border-purple-200 shadow-purple-500/50' :
                    'from-orange-800 to-orange-950 border-orange-700'; // Wooden

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="group relative w-32 h-32 flex flex-col items-center justify-end cursor-pointer"
        >
            {/* Glow if Ready */}
            {isReady && (
                <div className="absolute inset-0 bg-yellow-400/30 blur-2xl animate-pulse z-0" />
            )}

            {/* Chest Body (CSS Approximation of Isometric Box) */}
            <div className={`
                relative z-10 w-20 h-20 rounded-2xl 
                bg-gradient-to-br ${color} 
                border-b-4 border-r-4 shadow-2xl flex items-center justify-center
                transform transition-transform
            `}>
                {/* Icon Overlay */}
                {isReady && <Gift size={32} className="text-white animate-bounce drop-shadow-md" />}
                {!isReady && !isUnlocking && <Lock size={24} className="text-white/50 drop-shadow-md" />}
                {isUnlocking && (
                    <div className="flex flex-col items-center">
                        <Clock size={20} className="text-white animate-spin-slow mb-1" />
                        <span className="text-[10px] font-bold text-white font-mono bg-black/40 px-1 rounded">
                            {chest.unlockStartedAt && Math.ceil((chest.unlockTime - ((Date.now() - chest.unlockStartedAt) / 1000)) / 60)}m
                        </span>
                    </div>
                )}
            </div>

            {/* Label */}
            <div className={`
                absolute -bottom-4 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest
                ${isReady ? 'bg-green-500 text-white' : 'bg-black/60 text-white/80'}
                backdrop-blur-sm border border-white/10 shadow-lg z-20 group-hover:scale-110 transition-transform
            `}>
                {isReady ? 'OPEN!' : chest.type}
            </div>
        </motion.div>
    );
}
