'use client';

import { Trophy, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LoadingScreen() {
    const [show, setShow] = useState(true);

    // Optional: Logic to hide it if used as a controlled component, 
    // but typically this is mounted/unmounted by the parent.

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
            <div className="relative flex flex-col items-center">
                {/* Glowing Background Effect */}
                <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full w-64 h-64 animate-pulse" />

                {/* Logo Icon */}
                <div className="relative mb-8 p-6 rounded-2xl bg-slate-900/50 border border-white/10 shadow-2xl shadow-amber-900/20 ring-1 ring-white/5">
                    <Trophy className="text-amber-400 w-16 h-16 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-bounce-subtle" />
                </div>

                {/* Text */}
                <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    CHESS CLANS
                </h1>

                <div className="flex items-center gap-3 text-amber-400/80 font-mono text-sm tracking-widest mt-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>INITIALIZING KINGDOM...</span>
                </div>
            </div>
        </div>
    );
}
