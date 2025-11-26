'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { RefreshCw, Cpu, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { playSound } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';

// Import dinàmic per evitar errors de SSR
const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg" />
});

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { boardTheme } = useSettings();
  const theme = BOARD_THEMES[boardTheme];

  // 1. REF per a la lògica del joc (no provoca re-renders)
  const game = useRef(new Chess());

  // 2. ESTAT només per a la visualització (FEN)
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  
  const [moveStatus, setMoveStatus] = useState("El teu torn (Blanques)");
  const [isClient, setIsClient] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Assegurar que la ref i l'estat estan sincronitzats al muntar
    setFen(game.current.fen());
  }, []);

  // 🔥 FIX CRÍTIC: La signatura de la funció ha d'acceptar un OBJECTE
  function onDrop(args: { sourceSquare: string, targetSquare: string | null }): boolean {
    const { sourceSquare, targetSquare } = args;

    // Validacions
    if (isEngineThinking || !targetSquare) return false;

    // 1. Treballem amb una còpia
    const gameCopy = new Chess(game.current.fen());
    let move = null;

    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Simplificació: sempre reina
      });
    } catch (error) {
       return false;
    }

    // 2. Si el moviment és vàlid
    if (move) {
      // Actualitzem la lògica
      game.current = gameCopy; 
      // Actualitzem la vista
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
    game.current = newGame;
    setFen(newGame.fen());
    setMoveStatus("El teu torn (Blanques)");
    playSound('game_start');
  }

  if (loading || !isClient) return <div className="p-10 text-white flex items-center"><Loader2 className="animate-spin mr-2" /> Carregant...</div>;

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