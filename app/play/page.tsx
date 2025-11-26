'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Trophy, RefreshCw, Cpu, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { playSound } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';

const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg" />
});

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { boardTheme } = useSettings();
  const theme = BOARD_THEMES[boardTheme];

  // 🔥 FIX 1: 'game' ara és una REF, no un estat.
  // Això manté la lògica del joc persistent entre renders sense provocar bucles.
  const game = useRef(new Chess());

  // 🔥 FIX 2: Només 'fen' és estat visual.
  const [fen, setFen] = useState(game.current.fen());
  
  const [moveStatus, setMoveStatus] = useState("El teu torn (Blanques)");
  const [isClient, setIsClient] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (isEngineThinking) return false;

    // 1. Treballem amb una còpia per seguretat (opcional però recomanat)
    const gameCopy = new Chess(game.current.fen());
    let move = null;

    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
    } catch (error) {
       return false;
    }

    // 2. Si el moviment és vàlid, actualitzem la REF i l'ESTAT visual
    if (move) {
      // Actualitzem la referència mestra
      game.current = gameCopy; 
      
      // Actualitzem la vista (això dispara el re-render net)
      setFen(gameCopy.fen());

      // Sons i estats
      if (gameCopy.isCheckmate()) {
        playSound('game_end');
        setMoveStatus("Escac i mat!");
      } else if (gameCopy.isCheck()) {
        playSound('check');
        setMoveStatus("Escac!");
      } else if (move.captured) {
        playSound('capture');
      } else {
        playSound('move');
      }
      
      return true;
    }

    return false;
  }

  function resetGame() {
    const newGame = new Chess();
    game.current = newGame; // Reiniciem la ref
    setFen(newGame.fen());  // Reiniciem la vista
    setMoveStatus("El teu torn (Blanques)");
    playSound('game_start');
  }

  if (loading || !isClient) return <div className="p-10 text-white"><Loader2 className="animate-spin" /> Carregant...</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center">

        <div className="relative w-full max-w-[500px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
          <Chessboard
            id="BasicBoard"
            position={fen} 
            onPieceDrop={onDrop}
            boardOrientation="white"
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            animationDurationInMs={200}
          />
        </div>

        <div className="w-full md:w-64 flex flex-col gap-4 text-white">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h2 className="font-bold flex items-center gap-2"><Cpu size={18} /> Estat</h2>
            <p className="mt-2 text-sm text-slate-300">{moveStatus}</p>
          </div>
          <button onClick={resetGame} className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white">
            <RefreshCw size={18} /> Nova Partida
          </button>
          <button onClick={() => router.push('/')} className="bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-slate-300">
            <ArrowLeft size={18} /> Tornar
          </button>
        </div>

      </div>
    </div>
  );
}