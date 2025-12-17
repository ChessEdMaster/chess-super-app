import React from 'react';
import { SyzygyResult } from '@/lib/syzygy';
import { Trophy, Ban, Minus, Move } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SyzygyTableProps {
    data: SyzygyResult | null;
    onPlayMove: (uci: string) => void;
}

export const SyzygyTable = ({ data, onPlayMove }: SyzygyTableProps) => {
    if (!data) return (
        <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
            No hi ha dades de taula disponibles o la posició té massa peces ({'>'}7).
        </div>
    );

    const getWdlBadge = (wdl: number) => {
        if (wdl > 0) return <Badge className="bg-emerald-500 hover:bg-emerald-600">Guanya</Badge>;
        if (wdl < 0) return <Badge variant="destructive">Perd</Badge>;
        return <Badge variant="secondary">Taules</Badge>;
    };

    const getWdlColor = (wdl: number) => {
        if (wdl > 0) return "text-emerald-400";
        if (wdl < 0) return "text-red-400";
        return "text-zinc-400";
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/30 rounded-lg overflow-hidden border border-white/5">
            <div className="p-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-zinc-200">Finals (Syzygy)</span>
                </div>
                <div className="text-xs font-mono text-zinc-400">
                    {data.evaluation}
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 px-3 py-2 text-[10px] uppercase font-bold text-zinc-500 border-b border-white/5 bg-zinc-900/50">
                <div className="col-span-1">Moviment</div>
                <div className="col-span-1 text-center">Resultat</div>
                <div className="col-span-1 text-center" title="Distance to Zero (Pawn move or Capture)">DTZ</div>
                <div className="col-span-1 text-center" title="Distance to Mate">DTM</div>
            </div>

            <ScrollArea className="flex-1">
                <div className="divide-y divide-white/5">
                    {data.moves.map((move) => (
                        <div
                            key={move.uci}
                            onClick={() => onPlayMove(move.uci)}
                            className="grid grid-cols-4 gap-2 px-3 py-2 text-sm hover:bg-white/5 cursor-pointer transition-colors items-center group"
                        >
                            <div className="col-span-1 font-bold text-zinc-300 group-hover:text-white flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${move.wdl > 0 ? 'bg-emerald-500' : move.wdl < 0 ? 'bg-red-500' : 'bg-zinc-500'}`}></span>
                                {move.san || move.uci}
                            </div>
                            <div className="col-span-1 flex justify-center">
                                {getWdlBadge(move.wdl)}
                            </div>
                            <div className={`col-span-1 text-center font-mono font-medium ${getWdlColor(move.wdl)}`}>
                                {Math.abs(move.dtz)}
                            </div>
                            <div className="col-span-1 text-center font-mono text-zinc-500">
                                {move.dtm !== undefined ? Math.abs(move.dtm) : '-'}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
