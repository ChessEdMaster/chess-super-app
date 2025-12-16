'use client';

import React from 'react';

import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Play, Pause, Cpu } from 'lucide-react';

interface AnalysisControlsProps {
    isAnalyzing: boolean;
    setIsAnalyzing: (value: boolean) => void;
    depth: number;
    setDepth: (value: number) => void;
    multipv: number;
    setMultipv: (value: number) => void;
}

export function AnalysisControls({
    isAnalyzing,
    setIsAnalyzing,
    depth,
    setDepth,
    multipv,
    setMultipv
}: AnalysisControlsProps) {
    return (
        <div className="flex items-center gap-2 p-1 bg-zinc-900/50 rounded-lg border border-white/5">
            {/* Play/Pause Button */}
            <Button
                variant={isAnalyzing ? "destructive" : "default"}
                size="icon"
                onClick={() => setIsAnalyzing(!isAnalyzing)}
                className={`h-8 w-8 shrink-0 ${isAnalyzing ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                title={isAnalyzing ? "Aturar anàlisi" : "Iniciar anàlisi"}
            >
                {isAnalyzing ? <Pause size={16} /> : <Play size={16} />}
            </Button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* PV Lines Control */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Lines</span>
                <input
                    type="number"
                    min={1}
                    max={5}
                    value={multipv > 20 ? 1 : multipv}
                    onChange={(e) => setMultipv(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                    className="w-8 h-6 bg-zinc-950 border border-white/10 rounded text-center text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
                />
            </div>

            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* Depth Control */}
            <div className="flex items-center gap-2 flex-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Depth</span>
                <div className="flex-1 max-w-[120px]">
                    <Slider
                        value={[depth]}
                        min={10}
                        max={30}
                        step={1}
                        onValueChange={(vals) => setDepth(vals[0])}
                        className="cursor-pointer"
                    />
                </div>
                <span className="text-xs font-mono text-zinc-400 w-5 text-right">{depth}</span>
            </div>

            <div className="ml-auto text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                <Cpu size={12} />
                <span>SF16</span>
            </div>
        </div>
    );
}
