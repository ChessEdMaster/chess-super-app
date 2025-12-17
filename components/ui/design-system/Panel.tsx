'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'relative rounded-3xl border-2 border-white/10',
                    'bg-zinc-900/60 backdrop-blur-xl',
                    'shadow-xl',
                    'p-4 md:p-6',
                    className
                )}
                {...props}
            >
                {/* Top Highlight */}
                <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {children}
            </div>
        );
    }
);

Panel.displayName = 'Panel';

export { Panel };
