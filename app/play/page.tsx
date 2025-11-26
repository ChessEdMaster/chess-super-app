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

// Import dinàmic per evitar errors de SSR (Server Side Rendering)
const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg" />
});

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { boardTheme } = useSettings();
  const theme = BOARD_THEMES[boardTheme];

  // 1. REF: Manté la lògica del joc. No provoca re-renders.
  // Això és crucial perquè 'chess.js' mantingui l'estat intern correctament.
  const game = useRef(new Chess());

  // 2. STATE: Només per a la visualització (FEN string).
  // Inicialitzem amb el FEN de la ref.
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  
  const [moveStatus, setMoveStatus] = useState("El teu torn (Blanques)");
  const [isClient, setIsClient] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Sincronització inicial
    setFen(game.current.fen());
  }, []);

  /**
   * Funció onDrop blindada per a qualsevol versió de react-chessboard.
   * Gestiona tant si rep (source, target) com si rep ({sourceSquare, targetSquare}).
   */
  function onDrop(arg1: any, arg2?: any): boolean {
    // Si la màquina pensa, bloquegem
    if (isEngineThinking) return false;

    let sourceSquare: string;
    let targetSquare: string | null;

    // A. Detecció d'arguments (Versió Nova v5 vs Vella)
    if (typeof arg1 === 'object' && arg1 !== null && 'sourceSquare' in arg1) {
       // Cas v5: onDrop({ sourceSquare, targetSquare })
       sourceSquare = arg1.sourceSquare;
       targetSquare = arg1.targetSquare;
    } else {
       // Cas v4 o estàndard: onDrop(source, target)
       sourceSquare = arg1;
       targetSquare = arg2;
    }

    // Validació bàsica
    if (!sourceSquare || !targetSquare) return false;

    // 1. Creem una CÒPIA del joc per provar el moviment
    // (Important: usar game.current.fen() per tenir l'últim estat)
    const gameCopy = new Chess(game.current.fen());
    let move = null;

    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Simplificació: sempre coronem dama per evitar popups ara mateix
      });
    } catch (error) {
       // Moviment il·legal
       return false;
    }

    // 2. Si el moviment és vàlid
    if (move) {
      // A. Actualitzem la REFERÈNCIA (Lògica)
      game.current = gameCopy; 
      
      // B. Actualitzem l'ESTAT (Visual)
      // Això dispara el re-render de React
      setFen(gameCopy.fen());

      // C. Feedback (Sons i Text)
      updateGameStatus(gameCopy, move);
      
      // D. Retornem TRUE perquè la peça es quedi al lloc
      return true;
    }

    // Si arribem aquí, el moviment no és vàlid -> Snapback
    return false;
  }

  // Helper per actualitzar textos i sons
  function updateGameStatus(gameInstance: Chess, move: any) {
    if (gameInstance.isCheckmate()) {
      playSound('game_end');
      setMoveStatus("🏆 FINAL: Escac i mat!");
    } else if (gameInstance.isCheck()) {
      playSound('check');
      setMoveStatus("⚠️ ATENCIÓ: Escac!");
    } else if (move.captured) {
      playSound('capture');
      setMoveStatus("El teu torn");
    } else {
      playSound('move');
      setMoveStatus("El teu torn");
    }
  }

  function resetGame() {
    const newGame = new Chess();
    game.current = newGame;
    setFen(newGame.fen());
    setMoveStatus("El teu torn (Blanques)");
    playSound('game_start');
  }

  // Renderitzat condicional de càrrega
  if (loading || !isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mr-2" /> Carregant tauler...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center">

        {/* CONTENIDOR DEL TAULER */}
        <div className="relative w-full max-w-[500px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
          <Chessboard
            id="PlayVsCPU"
            position={fen} 
            onPieceDrop={onDrop}
            boardOrientation="white"
            // Estils
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            animationDurationInMs={200}
            // Opcions extra per millorar UX
            arePiecesDraggable={!isEngineThinking} 
          />
        </div>

        {/* PANELL LATERAL */}
        <div className="w-full md:w-64 flex flex-col gap-4 text-white">
          
          {/* Caixa d'Estat */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="font-bold flex items-center gap-2 text-amber-400 mb-2">
              <Cpu size={18} /> Estat del Joc
            </h2>
            <p className="text-sm text-slate-200 font-medium">{moveStatus}</p>
          </div>

          {/* Botons d'Acció */}
          <button 
            onClick={resetGame} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition shadow-lg shadow-indigo-900/20"
          >
            <RefreshCw size={18} /> Nova Partida
          </button>
          
          <button 
            onClick={() => router.push('/')} 
            className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-slate-300 transition border border-slate-700 hover:border-slate-600"
          >
            <ArrowLeft size={18} /> Tornar al Menú
          </button>
        </div>

      </div>
    </div>
  );
}