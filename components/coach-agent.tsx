'use client';

import React, { useEffect, useState } from 'react';
import { Brain, TrendingDown, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface CoachAgentProps {
    evaluation: { type: 'cp' | 'mate', value: number } | null;
    previousEval: { type: 'cp' | 'mate', value: number } | null;
    currentMove: string | null;
    turn: 'w' | 'b';
}

export function CoachAgent({ evaluation, previousEval, currentMove, turn }: CoachAgentProps) {
    const [message, setMessage] = useState<string>('');
    const [severity, setSeverity] = useState<'good' | 'neutral' | 'mistake' | 'blunder'>('neutral');

    useEffect(() => {
        if (!evaluation || !previousEval || !currentMove) {
            setMessage("Fes un moviment per començar l'anàlisi...");
            setSeverity('neutral');
            return;
        }

        // Calcular diferència d'avaluació (des del punt de vista del jugador que acaba de moure)
        const prevScore = previousEval.type === 'mate' ? (previousEval.value > 0 ? 10000 : -10000) : previousEval.value;
        const currScore = evaluation.type === 'mate' ? (evaluation.value > 0 ? 10000 : -10000) : evaluation.value;

        // Ajustar segons qui ha mogut (si negres han mogut, invertim)
        const actualPrev = turn === 'b' ? -prevScore : prevScore;
        const actualCurr = turn === 'b' ? -currScore : currScore;

        const evalDrop = actualPrev - actualCurr; // Positiu = has perdut avantatge

        // Classificar el moviment
        if (evalDrop < -50) {
            setMessage(`💎 Excel·lent! Has guanyat ${Math.abs(evalDrop / 100).toFixed(1)} punts d'avantatge.`);
            setSeverity('good');
        } else if (evalDrop < 50) {
            setMessage(`✓ Moviment correcte. La posició es manté equilibrada.`);
            setSeverity('neutral');
        } else if (evalDrop < 150) {
            setMessage(`⚠️ Petit error. Has perdut ${(evalDrop / 100).toFixed(1)} punts. Revisa les alternatives.`);
            setSeverity('mistake');
        } else {
            setMessage(`❌ Blunder! Has perdut ${(evalDrop / 100).toFixed(1)} punts. Això pot costar la partida.`);
            setSeverity('blunder');
        }
    }, [evaluation, previousEval, currentMove, turn]);

    const bgColor = {
        good: 'bg-emerald-900/30 border-emerald-500/50',
        neutral: 'bg-slate-800 border-slate-700',
        mistake: 'bg-amber-900/30 border-amber-500/50',
        blunder: 'bg-red-900/30 border-red-500/50'
    }[severity];

    const icon = {
        good: <CheckCircle size={18} className="text-emerald-400" />,
        neutral: <Brain size={18} className="text-slate-400" />,
        mistake: <AlertCircle size={18} className="text-amber-400" />,
        blunder: <TrendingDown size={18} className="text-red-400" />
    }[severity];

    return (
        <div className={`${bgColor} border p-4 rounded-xl transition-all duration-300`}>
            <div className="flex items-start gap-3">
                <div className="mt-0.5">{icon}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Lightbulb size={14} className="text-indigo-400" />
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrenador IA</h3>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">{message}</p>
                </div>
            </div>
        </div>
    );
}
