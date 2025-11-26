'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js'; // Assegura't que tens chess.js v1.0.0-beta o superior
import { Trophy, RefreshCw, Cpu, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { playSound } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';

// Import dinàmic del tauler
const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg" />
});

const ENGINE_DEPTH = 10;

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Settings
  const { boardTheme } = useSettings();
  const theme = BOARD_THEMES[boardTheme];

  // 🔥 FIX 1: Inicialització mandrosa (Lazy). 
  // Això evita que es creïn partides noves cada cop que React renderitza (que és molt sovint).
  const [game, setGame] = useState(() => new Chess());

  // 🔥 FIX 2: Estat separat per al FEN visual. 
  // react-chessboard necessita això per actualitzar-se ràpidament.
  const [fen, setFen] = useState(game.fen());

  const [moveStatus, setMoveStatus] = useState("El teu torn (Blanques)");
  const [isClient, setIsClient] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);

  // Ref per al motor (Worker)
  const engine = useRef<Worker | null>(null);

  useEffect(() => {
    setIsClient(true);
    // ... aquí aniria la càrrega del worker (Stockfish) ...
    // Deixem-ho simple per ara perquè funcioni el tauler primer
  }, []);

  // 🔥 FIX 3: Funció de moviment "Immuta i Actualitza"
  // Aquesta és la funció màgica que has de fer servir a TOTES les pàgines.
  function safeGameMutate(modify: (gameCopy: Chess) => void) {
    setGame((prevGame) => {
      // 1. Creem una còpia EXACTA de l'estat actual
      const gameCopy = new Chess(prevGame.fen());

      // 2. Apliquem el canvi
      modify(gameCopy);

      // 3. Actualitzem el FEN visual IMMEDIATAMENT
      setFen(gameCopy.fen());

      // 4. Retornem la nova instància per a l'estat del joc
      return gameCopy;
    });
  }

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    // Si la màquina pensa, no deixem moure
    if (isEngineThinking) return false;

    let move = null;

    // Usem el patró segur
    safeGameMutate((gameCopy) => {
      try {
        move = gameCopy.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // Sempre reina per simplificar
        });

        // Efectes secundaris (només si el moviment és vàlid)
        if (move) {
          if (gameCopy.isCheckmate()) playSound('game_end');
          else if (gameCopy.isCheck()) playSound('check');
          else if (move.captured) playSound('capture');
          else playSound('move');
        }
      } catch (e) {
        // Moviment il·legal, no fem res (move serà null)
      }
    });

    // Retornem true si move existeix, false si no.
    // Això li diu al tauler visual si ha de mantenir la peça o fer "snapback"
    return move !== null;
  }

  // Reiniciar partida
  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setMoveStatus("El teu torn (Blanques)");
    playSound('game_start');
  }

  if (loading || !isClient) return <div className="p-10 text-white"><Loader2 className="animate-spin" /> Carregant...</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center justify-center">

        {/* TAULER */}
        <div className="relative w-full max-w-[500px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
          <Chessboard
            id="BasicBoard"
            position={fen} // IMPORTANT: Usem l'estat FEN, no game.fen() directament
            onPieceDrop={onDrop as any}
            boardOrientation="white"
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            animationDurationInMs={200}
          />
        </div>

        {/* PANELL LATERAL */}
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
