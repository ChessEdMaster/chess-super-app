'use client';

import { ArenaProgress, ArenaVariant } from '@/types/arena';
import { Trophy, Zap, Clock, Hourglass } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ArenaCardProps {
    variant: ArenaVariant;
    progress: ArenaProgress | null;
    onClick?: () => void;
}

export function ArenaCard({ variant, progress, onClick }: ArenaCardProps) {
    const config = {
        bullet: {
            title: 'Bullet Arena',
            icon: Zap,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            hover: 'hover:border-yellow-500/50',
            desc: 'Fast-paced chaos (1 min)'
        },
        blitz: {
            title: 'Blitz Arena',
            icon: Clock,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            hover: 'hover:border-blue-500/50',
            desc: 'Standard speed battle (3|2)'
        },
        rapid: {
            title: 'Rapid Arena',
            icon: Hourglass,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20',
            hover: 'hover:border-green-500/50',
            desc: 'Strategic thinking (10 min)'
        }
    }[variant];

    const Icon = config.icon;
    const cups = progress?.current_cups || 0;
    const progressPercent = Math.min(100, (cups / 1000) * 100);

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative group cursor-pointer p-4 rounded-xl border transition-all duration-300",
                "bg-slate-900/50 backdrop-blur-sm",
                config.border,
                config.hover
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                        <Icon className={cn("w-6 h-6", config.color)} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white group-hover:text-indigo-300 transition">{config.title}</h3>
                        <p className="text-xs text-slate-400">{config.desc}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-1 rounded-full border border-slate-800">
                    <Trophy size={14} className="text-yellow-500" />
                    <span className="text-sm font-bold text-white">{cups}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-500", config.bg.replace('/10', ''))}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-mono uppercase">
                <span>Arena Path</span>
                <span>{cups}/1000 Cups</span>
            </div>
        </div>
    );
}
