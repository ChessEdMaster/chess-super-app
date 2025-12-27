'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ChessClockProps {
  whiteTime: number; // Segons
  blackTime: number; // Segons
  turn: 'w' | 'b';
  isActive: boolean; // Si la partida està en marxa
  onTimeout: (winner: 'w' | 'b') => void;
  lastMoveAt?: string;
}

export function ChessClock({ whiteTime, blackTime, turn, isActive, onTimeout, lastMoveAt }: ChessClockProps) {
  const [wTime, setWTime] = useState(whiteTime);
  const [bTime, setBTime] = useState(blackTime);

  // Sincronitzar quan canvien les props (ve del servidor)
  useEffect(() => {
    setWTime(whiteTime);
    setBTime(blackTime);
  }, [whiteTime, blackTime]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const lastMove = lastMoveAt ? new Date(lastMoveAt) : now;
      const elapsed = Math.floor((now.getTime() - lastMove.getTime()) / 1000);

      if (turn === 'w') {
        const currentW = Math.max(0, whiteTime - elapsed);
        setWTime(currentW);
        if (currentW <= 0) {
          clearInterval(interval);
          onTimeout('b');
        }
        setBTime(blackTime); // Static black time
      } else {
        const currentB = Math.max(0, blackTime - elapsed);
        setBTime(currentB);
        if (currentB <= 0) {
          clearInterval(interval);
          onTimeout('w');
        }
        setWTime(whiteTime); // Static white time
      }
    }, 100); // Higher frequency for smoother display

    return () => clearInterval(interval);
  }, [turn, isActive, whiteTime, blackTime, lastMoveAt, onTimeout]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-2 w-full">
      <div className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-between border-2 transition-all ${turn === 'w' ? 'bg-slate-100 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-200 border-transparent opacity-60'}`}>
        <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
          <Clock size={14} />
          <span>BLANQUES</span>
        </div>
        <span className="font-mono text-xl font-black text-slate-900">{formatTime(wTime)}</span>
      </div>

      <div className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-between border-2 transition-all ${turn === 'b' ? 'bg-slate-800 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-slate-900 border-transparent opacity-60'}`}>
        <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
          <Clock size={14} />
          <span>NEGRES</span>
        </div>
        <span className="font-mono text-xl font-black text-white">{formatTime(bTime)}</span>
      </div>
    </div>
  );
}
