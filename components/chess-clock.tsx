'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface ChessClockProps {
  whiteTime: number; // Segons
  blackTime: number; // Segons
  turn: 'w' | 'b';
  isActive: boolean; // Si la partida està en marxa
  onTimeout: (winner: 'w' | 'b') => void;
}

export function ChessClock({ whiteTime, blackTime, turn, isActive, onTimeout }: ChessClockProps) {
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
      if (turn === 'w') {
        setWTime((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            onTimeout('b');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBTime((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            onTimeout('w');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turn, isActive, onTimeout]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex gap-4 w-full">
      <div className={`flex-1 p-3 rounded-lg flex items-center justify-between border-2 transition-all ${turn === 'w' ? 'bg-slate-100 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-200 border-transparent opacity-60'}`}>
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Clock size={18} />
          <span>BLANQUES</span>
        </div>
        <span className="font-mono text-2xl font-black text-slate-900">{formatTime(wTime)}</span>
      </div>

      <div className={`flex-1 p-3 rounded-lg flex items-center justify-between border-2 transition-all ${turn === 'b' ? 'bg-slate-800 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-900 border-transparent opacity-60'}`}>
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <Clock size={18} />
          <span>NEGRES</span>
        </div>
        <span className="font-mono text-2xl font-black text-white">{formatTime(bTime)}</span>
      </div>
    </div>
  );
}
