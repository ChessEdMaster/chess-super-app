'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  RotateCcw, 
  Save,
  Share2
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';

export default function AnalysisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Estat del Joc
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [history, setHistory] = useState<string[]>([]); // Historial de FENs per navegació ràpida
  const [moveHistory, setMoveHistory] = useState<string[]>([]); // Historial de notació (e4, e5...)
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1); // -1 = inici, 0 = primer moviment...

  // Ref per controlar l'scroll de la llista de moviments
  const moveListRef = useRef<HTMLDivElement>(null);

  // Assegurar que estem al client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- PROTECCIÓ DE RUTA (Opcional - pots eliminar si vols que sigui pública) ---
  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, loading, router]);

  // --- LÒGICA DEL TAULER ---
  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (!targetSquare) return false;

    // Clonem el joc actual per intentar el moviment
    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Sempre reina per defecte en anàlisi ràpid
      });
      if (!move) return false;

      // Si fem un moviment i estàvem mirant el passat, hem de "tallar" la història futura
      // (Comportament estàndard: si mous al passat, crees una nova línia principal)
      const newHistory = history.slice(0, currentMoveIndex + 1);
      const newMoveHistory = moveHistory.slice(0, currentMoveIndex + 1);

      // Actualitzem estats
      setGame(gameCopy);
      setFen(gameCopy.fen());
      
      // Afegim el nou estat a la història
      setHistory([...newHistory, gameCopy.fen()]);
      setMoveHistory([...newMoveHistory, move.san]);
      setCurrentMoveIndex(prev => prev + 1);
      return true;
    } catch (error) {
      return false;
    }
  }

  // --- NAVEGACIÓ ---
  const jumpToMove = (index: number) => {
    if (index < -1 || index >= history.length) return;
    const targetFen = index === -1 
      ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' 
      : history[index];
    const newGame = new Chess(targetFen);
    setGame(newGame);
    setFen(targetFen);
    setCurrentMoveIndex(index);
  };

  const resetBoard = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setHistory([]);
    setMoveHistory([]);
    setCurrentMoveIndex(-1);
  };

  // Auto-scroll quan es fan moviments
  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [moveHistory]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Carregant...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-4 font-sans">
      
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 mt-4 h-[85vh]">
        
        {/* 1. TAULER CENTRAL */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-2xl">
          <div className="w-full max-w-[650px] aspect-square">
            <Chessboard 
              options={{
                position: fen,
                onPieceDrop: onDrop,
                boardOrientation: "white", // Futur: permetre flip
                animationDurationInMs: 200,
                darkSquareStyle: { backgroundColor: '#779556' },
                lightSquareStyle: { backgroundColor: '#ebecd0' },
                allowDragging: true,
              }}
            />
          </div>
          
          {/* Controls de Navegació sota el tauler */}
          <div className="flex items-center justify-center gap-2 mt-6 w-full max-w-[650px]">
            <button 
              onClick={() => jumpToMove(-1)} 
              disabled={currentMoveIndex === -1}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Anar al principi"
            >
              <ChevronsLeft size={24} />
            </button>
            <button 
              onClick={() => jumpToMove(currentMoveIndex - 1)} 
              disabled={currentMoveIndex === -1}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Moviment anterior"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => jumpToMove(currentMoveIndex + 1)} 
              disabled={currentMoveIndex === history.length - 1}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Moviment següent"
            >
              <ChevronRight size={24} />
            </button>
            <button 
              onClick={() => jumpToMove(history.length - 1)} 
              disabled={currentMoveIndex === history.length - 1}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-white"
              title="Anar al final"
            >
              <ChevronsRight size={24} />
            </button>
          </div>
        </div>

        {/* 2. PANELL LATERAL (EINES) */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          
          {/* Barra d'Eines Superior */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex gap-2">
            <button 
              onClick={resetBoard} 
              className="flex-1 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition text-white"
            >
              <RotateCcw size={16} /> Reset
            </button>
            <button 
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition text-white"
              title="Guardar estudi (pròximament)"
            >
              <Save size={16} /> Guardar
            </button>
            <button 
              onClick={() => {
                const pgn = game.pgn();
                navigator.clipboard.writeText(pgn);
                alert('PGN copiat al porta-retalls!');
              }}
              className="flex-1 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition text-white"
            >
              <Share2 size={16} /> PGN
            </button>
          </div>

          {/* PGN / Llista de Moviments */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[200px]">
            <div className="p-3 bg-slate-800 border-b border-slate-700 font-bold text-slate-300 text-sm uppercase tracking-wider">
              Partida
            </div>
            
            <div ref={moveListRef} className="flex-1 overflow-y-auto p-2 font-mono text-sm content-start">
              <div className="flex flex-wrap gap-1 content-start">
                {moveHistory.map((move, i) => {
                  // Calculem el número de moviment (1., 2., etc.)
                  const moveNumber = Math.floor(i / 2) + 1;
                  const isWhite = i % 2 === 0;
                  const isActive = i === currentMoveIndex;

                  return (
                    <React.Fragment key={i}>
                      {isWhite && (
                        <span className="text-slate-500 ml-2 select-none">{moveNumber}.</span>
                      )}
                      <button 
                        onClick={() => jumpToMove(i)}
                        className={`px-1.5 rounded hover:bg-indigo-900/50 transition ${
                          isActive 
                            ? 'bg-indigo-600 text-white font-bold' 
                            : 'text-slate-300'
                        }`}
                      >
                        {move}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
              {moveHistory.length === 0 && (
                <p className="text-slate-600 text-center mt-10 italic">Fes un moviment per començar l'anàlisi</p>
              )}
            </div>
          </div>

          {/* Espai reservat per Mòduls Futurs (Engine / Database) */}
          <div className="h-1/3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-center text-slate-600 border-dashed min-h-[150px]">
            <p className="text-center text-sm">Mòdul d'Anàlisi (Stockfish) properament...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

