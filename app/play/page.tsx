'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Chess } from 'chess.js';
import { Loader2, RefreshCw, Trophy } from 'lucide-react';

// Càrrega dinàmica del tauler
const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 rounded-lg animate-pulse" />
});

export default function PlayPage() {
  // 1. ESTAT: Lazy initialization per rendiment
  const [game, setGame] = useState(() => new Chess());

  // 2. LÒGICA DE MOVIMENT: Separada i neta
  function makeMove(source: string, target: string) {
    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: source,
        to: target,
        promotion: 'q', // Sempre reina per simplificar
      });
      
      if (move) {
        setGame(gameCopy);
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  // 3. HANDLER DEL TAULER (Adaptat EXACTAMENT al teu error de TypeScript)
  // L'error deia que esperava: (args: { sourceSquare: string; targetSquare: string | null; })
  function onDrop(args: { sourceSquare: string; targetSquare: string | null }): boolean {
    const { sourceSquare, targetSquare } = args;

    // Si no hi ha target (s'ha deixat anar fora del tauler), cancel·lem
    if (!targetSquare) return false;

    // Executem el moviment
    return makeMove(sourceSquare, targetSquare);
  }

  function resetGame() {
    setGame(new Chess());
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans gap-8">
      
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <Trophy className="text-amber-500" /> Tauler Funcionant
        </h1>
        <p className="text-slate-400">Versió neta i corregida (v5 Compatible)</p>
      </div>

      {/* TAULER */}
      <div className="w-full max-w-[500px] aspect-square border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-900">
        <Chessboard 
          id="CleanChessboard"
          position={game.fen()} 
          onPieceDrop={onDrop}
          boardOrientation="white"
          animationDurationInMs={200}
          customDarkSquareStyle={{ backgroundColor: '#779954' }}
          customLightSquareStyle={{ backgroundColor: '#e9edcc' }}
        />
      </div>

      {/* CONTROLS */}
      <div className="w-full max-w-[500px] flex flex-col gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
          <p className="text-slate-500 text-xs mb-1">FEN ACTUAL</p>
          <p className="text-white font-mono text-xs break-all opacity-70">
            {game.fen()}
          </p>
          <div className="mt-4 text-lg font-bold">
            {game.isCheckmate() ? (
              <span className="text-red-500">🏆 ESCAC I MAT!</span>
            ) : game.isCheck() ? (
              <span className="text-amber-500">⚠️ ESCAC!</span>
            ) : (
              <span className="text-emerald-400">
                Torn: {game.turn() === 'w' ? 'Blanques' : 'Negres'}
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={resetGame}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/20"
        >
          <RefreshCw size={20} /> Reiniciar Partida
        </button>
      </div>

    </div>
  );
}