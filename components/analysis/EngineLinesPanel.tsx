import React from 'react';
import { Evaluation } from '@/types/pgn';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cpu, Plus } from 'lucide-react';

interface EvaluationLine {
    id: number;
    evaluation: Evaluation;
    bestMove: string;
    line: string;
}

interface EngineLinesPanelProps {
    lines: EvaluationLine[];
    depth: number;
    isAnalyzing: boolean;
    onLineClick?: (line: string) => void;
}

export const EngineLinesPanel = ({ lines, depth, isAnalyzing, onLineClick }: EngineLinesPanelProps) => {

    const getEvalColor = (ev: Evaluation) => {
        if (ev.type === 'mate') return ev.value > 0 ? "text-emerald-400" : "text-red-400";
        if (ev.value > 100) return "text-emerald-400";
        if (ev.value < -100) return "text-red-400";
        return "text-zinc-300";
    };

    const formatEval = (ev: Evaluation) => {
        if (ev.type === 'mate') return `M${Math.abs(ev.value)}`;
        const val = ev.value / 100;
        return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/30 rounded-lg overflow-hidden border border-white/5">
            <div className="p-3 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Cpu className={`w-4 h-4 ${isAnalyzing ? 'text-blue-500 animate-pulse' : 'text-zinc-500'}`} />
                    <span className="font-bold text-sm text-zinc-200">Stockfish 16 (WASM)</span>
                </div>
                <div className="text-xs font-mono text-zinc-500 bg-black/40 px-2 py-0.5 rounded">
                    Depth {depth}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {lines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-zinc-500 text-sm italic gap-2 opacity-50">
                        {isAnalyzing ? (
                            <>Carregant línies...</>
                        ) : (
                            <>Motor aturat</>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {lines.map((line, idx) => (
                            <div key={idx} className="p-3 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className={`font-mono font-bold text-sm w-12 text-right ${getEvalColor(line.evaluation)}`}>
                                        {formatEval(line.evaluation)}
                                    </div>
                                    <div className="h-4 w-px bg-white/10" />
                                    <span className="text-xs text-zinc-500 font-mono">MVP {line.id}</span>
                                </div>
                                <div className="pl-[3.75rem] text-sm text-zinc-300 font-medium leading-relaxed font-mono break-words opacity-80 group-hover:opacity-100">
                                    {line.line}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
