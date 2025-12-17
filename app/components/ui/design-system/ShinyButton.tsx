'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

type ShinyButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'neutral';

interface ShinyButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    variant?: ShinyButtonVariant;
    children: React.ReactNode;
    className?: string;
}

const variants: Record<ShinyButtonVariant, string> = {
    primary: 'from-amber-400 via-amber-300 to-amber-500 shadow-[0_6px_0_#d97706] hover:shadow-[0_4px_0_#d97706] active:shadow-none border-t-amber-200',
    secondary: 'from-blue-500 via-blue-400 to-blue-600 shadow-[0_6px_0_#1e40af] hover:shadow-[0_4px_0_#1e40af] active:shadow-none border-t-blue-300',
    success: 'from-green-500 via-green-400 to-green-600 shadow-[0_6px_0_#15803d] hover:shadow-[0_4px_0_#15803d] active:shadow-none border-t-green-300',
    danger: 'from-red-500 via-red-400 to-red-600 shadow-[0_6px_0_#b91c1c] hover:shadow-[0_4px_0_#b91c1c] active:shadow-none border-t-red-300',
    neutral: 'from-zinc-500 via-zinc-400 to-zinc-600 shadow-[0_6px_0_#3f3f46] hover:shadow-[0_4px_0_#3f3f46] active:shadow-none border-t-zinc-300',
};

const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
    ({ className, variant = 'primary', children, ...props }, ref) => {
        return (
            <motion.button
                ref={ref}
                whileHover={{ filter: 'brightness(1.1)', translateY: 2 }}
                whileTap={{ translateY: 6 }}
                className={cn(
                    'relative px-6 py-3 rounded-xl font-display font-bold text-white uppercase tracking-wider',
                    'bg-gradient-to-b border-t-4 border-b border-x border-black/20',
                    'transition-all duration-100 ease-out select-none',
                    'flex items-center justify-center gap-2',
                    variants[variant],
                    className
                )}
                {...props}
            >
                <span className="drop-shadow-md text-stroke z-10">{children}</span>
                {/* Gloss overlay */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/40 to-transparent opacity-50 pointer-events-none" />
            </motion.button>
        );
    }
);

ShinyButton.displayName = 'ShinyButton';

export { ShinyButton };
