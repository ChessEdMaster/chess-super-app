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
        <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant={isAnalyzing ? "destructive" : "default"}
                        size="sm"
                        onClick={() => setIsAnalyzing(!isAnalyzing)}
                        className="w-32 font-bold"
                    >
                        {isAnalyzing ? (
                            <>
                                <Pause className="mr-2 h-4 w-4" /> Aturar
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" /> Analitzar
                            </>
                        )}
                    </Button>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Cpu size={14} /> Stockfish 16
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="text-xs text-slate-400">Línies:</Label>
                    <Input
                        type="number"
                        min={1}
                        max={5}
                        value={multipv}
                        onChange={(e) => setMultipv(parseInt(e.target.value) || 1)}
                        className="w-16 h-8 bg-slate-800 border-slate-700 text-white text-xs"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                    <span>Profunditat: <strong>{depth}</strong></span>
                    <span>Max: 30</span>
                </div>
                <Slider
                    value={[depth]}
                    min={10}
                    max={30}
                    step={1}
                    onValueChange={(vals) => setDepth(vals[0])}
                    className="cursor-pointer"
                />
            </div>
        </div>
    );
}
