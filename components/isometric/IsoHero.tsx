'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export function IsoHero() {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Shadow/Base */}
            <div className="absolute bottom-10 w-32 h-16 bg-black/40 blur-xl rounded-[100%] transform scale-y-50" />

            {/* Character Container - Floating Animation */}
            <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 filter drop-shadow-2xl"
            >
                {/* Placeholder for 2.5D Image */}
                {/* 
                   Ideally, the user provides "hero-iso.png".
                   For now, we use a div constructing a simple shape or a placeholder image.
                */}
                <div className="relative w-40 h-40">
                    {/* If user puts hero.png in public/assets/ */}
                    <Image
                        src="/assets/hero-iso.png"
                        alt="Hero"
                        fill
                        className="object-contain"
                        onError={(e) => {
                            // Fallback if image missing
                            e.currentTarget.style.display = 'none';
                        }}
                    />

                    {/* Fallback Visual (CSS construct) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl transform rotate-45 border-4 border-white/20 shadow-xl flex items-center justify-center">
                            <span className="transform -rotate-45 text-4xl">👑</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
