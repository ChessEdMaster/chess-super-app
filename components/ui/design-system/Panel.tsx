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
                    'glass-panel relative',
                    'p-4 md:p-6',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Panel.displayName = 'Panel';

export { Panel };
