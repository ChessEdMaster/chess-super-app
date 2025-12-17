import React, { useEffect } from 'react';
import { useSyzygy } from '@/hooks/use-syzygy';
import { SyzygyTable } from './SyzygyTable';
import { Loader2, Skull } from 'lucide-react';

interface SyzygyContainerProps {
    fen: string;
    onPlayMove: (uci: string) => void;
}

export const SyzygyContainer = ({ fen, onPlayMove }: SyzygyContainerProps) => {
    const { data, loading, isApplicable, error } = useSyzygy(fen);

    if (!isApplicable) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center border border-dashed border-zinc-800 rounded-lg">
                <span className="text-4xl mb-2">🧩</span>
                <p className="font-medium text-zinc-300">Posició massa complexa</p>
                <p className="text-xs mt-1">Les taules de finals (Syzygy) només funcionen amb 7 peces o menys.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-red-400 p-4 text-center border border-red-900/20 bg-red-900/10 rounded-lg">
                <Skull className="w-8 h-8 mb-2" />
                <p className="font-medium">Error de connexió</p>
                <p className="text-xs mt-1 opacity-70">{error}</p>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-500" />
                <p className="text-xs">Consultant l'oracle...</p>
            </div>
        );
    }

    return <SyzygyTable data={data} onPlayMove={onPlayMove} />;
};
