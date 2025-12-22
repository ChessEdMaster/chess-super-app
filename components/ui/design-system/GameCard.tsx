'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'gold' | 'blue';
    children: React.ReactNode;
}

const variants = {
    default: 'border-border bg-secondary/10 shadow-comic hover:shadow-comic-hover',
    gold: 'border-amber-500 bg-secondary/10 shadow-[0_4px_0_var(--color-gold)]',
    blue: 'border-blue-500 bg-secondary/10 shadow-[0_4px_0_var(--color-accent)]',
};

const GameCard = React.forwardRef<HTMLDivElement, GameCardProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'relative rounded-2xl border-[length:var(--card-border-width)] p-4 md:p-5',
                    'transition-transform hover:scale-[1.02] active:scale-[0.98]',
                    variants[variant],
                    className
                )}
                {...props}
            >
                {/* Inner Border/Glow */}
                <div className="absolute inset-0 rounded-[10px] border border-white/10 pointer-events-none" />
                <div className="relative z-10">{children}</div>
            </div>
        );
    }
);

GameCard.displayName = 'GameCard';

export { GameCard };
