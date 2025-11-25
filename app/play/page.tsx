'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Trophy, RefreshCw, User, Cpu, AlertTriangle, Loader2, Flag, XCircle, Save } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { MoveHistory } from '@/components/move-history';
import { playSound } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';

// CRÍTICO: Dynamic import para evitar problemas de SSR
const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg" />
});

// Configuració de potència (10 és un bon equilibri per navegador)
const ENGINE_DEPTH = 10;

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // CRÍTICO: Inicializar game y fen correctamente para evitar problemas de sincronización
  const initialGame = new Chess();
  const [game, setGame] = useState(initialGame);
  const [fen, setFen] = useState(initialGame.fen());
  const [moveStatus, setMoveStatus] = useState("El teu torn (Blanques)");
  const [isClient, setIsClient] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Settings
  const { boardTheme } = useSettings();
  const theme = BOARD_THEMES[boardTheme];

  // Gestió de Coronació
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: string, to: string } | null>(null);

  // Click to move state
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

  const engine = useRef<Worker | null>(null);

  // --- PROTECCIÓ DE RUTA ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Inicialització Worker + Client
  // CRÍTICO: Solo inicializar una vez usando useRef
  useEffect(() => {
    setIsClient(true);
    
    // Solo crear el worker si no existe
    if (!engine.current) {
      const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';
      const workerCode = `importScripts('${stockfishUrl}');`;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const localWorkerUrl = URL.createObjectURL(blob);

      const stockfishWorker = new Worker(localWorkerUrl);
      engine.current = stockfishWorker;

      stockfishWorker.onmessage = (event) => {
        const message = event.data;
        if (typeof message === 'string' && message.startsWith('bestmove')) {
          const bestMove = message.split(' ')[1];
          makeEngineMove(bestMove);
        }
      };
    }

    return () => {
      // Solo limpiar al desmontar el componente
      if (engine.current) {
        engine.current.terminate();
        engine.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Utilitats del Joc
  function safeGameMutate(modify: (gameCopy: Chess) => void) {
    setGame((g) => {
      const update = new Chess(g.fen());
      modify(update);
      return update;
    });
  }

  const makeEngineMove = (bestMoveLAN: string) => {
    if (!bestMoveLAN) return;
    const from = bestMoveLAN.substring(0, 2);
    const to = bestMoveLAN.substring(2, 4);
    const promotion = bestMoveLAN.length > 4 ? bestMoveLAN.substring(4, 5) : undefined;

    safeGameMutate((gameCopy) => {
      try {
        const move = gameCopy.move({ from, to, promotion: promotion || 'q' });
        if (move) {
          if (gameCopy.isCheckmate()) playSound('game_end');
          else if (gameCopy.isCheck()) playSound('check');
          else if (move.captured) playSound('capture');
          else playSound('move');
        }
      } catch (e) { console.error(e); }

      setFen(gameCopy.fen());
      setHistory(gameCopy.history());
      checkGameStatus(gameCopy);
      setIsEngineThinking(false);

      if (!gameCopy.isGameOver()) {
        setMoveStatus("El teu torn (Blanques)");
      }
    });
  };

  const findBestMove = (gameFen: string) => {
    if (!engine.current) return;
    setIsEngineThinking(true);
    setMoveStatus("Stockfish està pensant...");
    engine.current.postMessage(`position fen ${gameFen}`);
    engine.current.postMessage(`go depth ${ENGINE_DEPTH}`);
  };

  // Gestió de Moviments
  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean {
    // Debug: Log para identificar problemas
    console.log('[onDrop] Called:', { sourceSquare, targetSquare, isEngineThinking, isGameOver, currentFen: game.fen() });

    if (isEngineThinking || isGameOver || !targetSquare) {
      console.log('[onDrop] Rejected:', { isEngineThinking, isGameOver, hasTarget: !!targetSquare });
      return false;
    }

    const piece = game.get(sourceSquare as Parameters<typeof game.get>[0]);
    // Detectar Coronació visual
    if (
      piece?.type === 'p' &&
      ((piece.color === 'w' && targetSquare[1] === '8') || (piece.color === 'b' && targetSquare[1] === '1'))
    ) {
      console.log('[onDrop] Promotion detected');
      setPromotionMove({ from: sourceSquare, to: targetSquare });
      setShowPromotionDialog(true);
      return false;
    }

    const result = attemptMove(sourceSquare, targetSquare);
    console.log('[onDrop] Move result:', result);
    if (result) {
      setMoveFrom(null);
      setOptionSquares({});
    }
    return result === true;
  }

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as Parameters<typeof game.moves>[0]['square'],
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
    moves.forEach((move) => {
      const targetPiece = game.get(move.to as Parameters<typeof game.get>[0]);
      const sourcePiece = game.get(square as Parameters<typeof game.get>[0]);
      const isCapture = targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color;

      newSquares[move.to] = {
        background: isCapture
          ? 'radial-gradient(circle, rgba(255,0,0,.5) 25%, transparent 25%)'
          : 'radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    if (isEngineThinking || isGameOver) return;

    // If we have a moveFrom, try to move to the clicked square
    if (moveFrom) {
      // If clicked on the same square, deselect
      if (moveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // Check for promotion
      const piece = game.get(moveFrom as Parameters<typeof game.get>[0]);
      if (
        piece?.type === 'p' &&
        ((piece.color === 'w' && square[1] === '8') || (piece.color === 'b' && square[1] === '1'))
      ) {
        // Check if it's a valid move first
        const moves = game.moves({ square: moveFrom as Parameters<typeof game.moves>[0]['square'], verbose: true });
        const isPromotion = moves.find(m => m.to === square && m.promotion);

        if (isPromotion) {
          setPromotionMove({ from: moveFrom, to: square });
          setShowPromotionDialog(true);
          return;
        }
      }

      // Attempt move
      const moveResult = attemptMove(moveFrom, square);
      if (moveResult) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // If move failed, check if we clicked on another piece of our own to select it instead
      const clickedPiece = game.get(square as Parameters<typeof game.get>[0]);
      if (clickedPiece && clickedPiece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
        return;
      }

      // Otherwise, just deselect
      setMoveFrom(null);
      setOptionSquares({});
    } else {
      // No piece selected, try to select
      const piece = game.get(square as Parameters<typeof game.get>[0]);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
    }
  }

  function attemptMove(source: string, target: string, promotionPiece: string = 'q'): boolean {
    console.log('[attemptMove] Starting:', { source, target, promotionPiece, currentFen: game.fen() });

    // CRÍTICO: Hacer el movimiento en la instancia actual
    let move = null;
    try {
      move = game.move({ from: source, to: target, promotion: promotionPiece });
      console.log('[attemptMove] Move created:', move);
    } catch (error) {
      console.error('[attemptMove] Move failed:', error);
      return false;
    }

    if (!move) {
      console.log('[attemptMove] Move is null');
      return false;
    }

    // CRÍTICO: LA CLAU MÀGICA - Crear nueva instancia con el FEN resultante para forzar re-render
    const newGame = new Chess(game.fen());
    const newFen = newGame.fen();
    console.log('[attemptMove] New FEN:', newFen);

    // Sons
    if (newGame.isCheckmate()) {
      playSound('game_end');
    } else if (newGame.isCheck()) {
      playSound('check');
    } else if (move.captured) {
      playSound('capture');
    } else {
      playSound('move');
    }

    // Actualizar estado con nueva instancia (fuerza re-render)
    setGame(newGame);
    setFen(newFen);
    setHistory(newGame.history());
    console.log('[attemptMove] State updated');

    if (!checkGameStatus(newGame)) {
      setTimeout(() => { findBestMove(newFen); }, 200);
    }
    return true;
  }

  function onPromotionSelect(piece: string) {
    if (promotionMove) {
      attemptMove(promotionMove.from, promotionMove.to, piece);
      setShowPromotionDialog(false);
      setPromotionMove(null);
    }
  }

  function checkGameStatus(currentGame: Chess) {
    if (currentGame.isGameOver()) {
      setIsGameOver(true);
      if (currentGame.isCheckmate()) {
        const winner = currentGame.turn() === 'w' ? "Stockfish" : "TU";
        setMoveStatus(`🏆 FINAL: Escac i mat! Guanya ${winner}`);
        playSound('game_end');
      } else {
        setMoveStatus("🤝 FINAL: Taules");
        playSound('game_end');
      }
      return true;
    }
    if (currentGame.isCheck() && !isEngineThinking) setMoveStatus("⚠️ ATENCIÓ: Estàs en ESCAC!");
    return false;
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setHistory([]);
    setMoveStatus("El teu torn (Blanques)");
    setIsEngineThinking(false);
    setIsGameOver(false);
    setShowPromotionDialog(false);
    setPromotionMove(null);
    engine.current?.postMessage('ucinewgame');
    playSound('game_start');
  }

  function resignGame() {
    setIsGameOver(true);
    setMoveStatus("🏳️ T'has rendit. Guanya Stockfish.");
    setIsEngineThinking(false);
    playSound('game_end');
  }

  // --- GUARDAR PARTIDA A SUPABASE ---
  async function saveGame() {
    if (!user) {
      // Redirigim al login si no està autenticat
      window.location.href = '/login';
      return;
    }

    setIsSaving(true);

    // Determinar resultat en format text estàndard
    let result = '1/2-1/2';
    if (game.isCheckmate()) {
      result = game.turn() === 'w' ? '0-1' : '1-0'; // Si torn blanques i és mat -> guanyen negres
    } else if (moveStatus.includes("rendit")) {
      result = '0-1'; // Assumim que l'usuari (blanques) es rendeix
    }

    try {
      const { error } = await supabase.from('games').insert({
        white_player_id: user.id,
        black_player_id: null, // null = CPU
        pgn: game.pgn(),
        fen: game.fen(),
        result: result,
        status: 'finished'
      });

      if (error) throw error;
      alert("✅ Partida guardada al teu perfil!");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error guardant: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  }

  // Mentres comprovem l'usuari, mostrem càrrega i no deixem veure res
  if (loading || !user || !isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Verificant accés...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200">

      {/* Capçalera Simplificada - El SiteHeader ja gestiona la navegació */}
      <div className="w-full max-w-6xl mb-6 flex justify-center">
        <div className="text-xl font-bold flex items-center gap-2 text-white">
          <Trophy className="text-amber-500" /> ChessHub vs IA
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl items-start justify-center">

        {/* COLUMNA ESQUERRA: Tauler */}
        <div className="relative w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900 mx-auto lg:mx-0">
          {isEngineThinking && (
            <div className="absolute top-4 right-4 z-20 bg-slate-900/80 px-3 py-1 rounded-full text-xs font-bold text-amber-400 flex items-center gap-2 border border-amber-500/30 backdrop-blur-sm animate-pulse pointer-events-none">
              <Cpu size={14} /> CALCULANT...
            </div>
          )}
          {showPromotionDialog && (
            <div className="absolute inset-0 z-50 bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <p className="text-white font-bold mb-4">Corona el peó:</p>
              <div className="flex gap-2">
                {['q', 'r', 'b', 'n'].map((p) => (
                  <button key={p} onClick={() => onPromotionSelect(p)} className="w-12 h-12 bg-slate-700 hover:bg-amber-500 text-2xl rounded border-2 border-slate-600">
                    {p === 'q' ? '♛' : p === 'r' ? '♜' : p === 'b' ? '♝' : '♞'}
                  </button>
                ))}
              </div>
              <button onClick={() => { setShowPromotionDialog(false); setPromotionMove(null); setFen(game.fen()) }} className="mt-4 text-xs text-slate-400 hover:text-white flex items-center gap-1"><XCircle size={14} /> Cancel·lar</button>
            </div>
          )}
          <Chessboard
            id="PlayVsStockfish"
            position={fen}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            onSquareRightClick={() => {
              setMoveFrom(null);
              setOptionSquares({});
            }}
            boardOrientation="white"
            customDarkSquareStyle={{ backgroundColor: theme.dark }}
            customLightSquareStyle={{ backgroundColor: theme.light }}
            customSquareStyles={optionSquares}
            animationDurationInMs={200}
            arePiecesDraggable={!isGameOver && !isEngineThinking}
          />
        </div>

        {/* COLUMNA DRETA: Info + Historial */}
        <div className="w-full lg:w-96 flex flex-col gap-4 h-[600px]">

          {/* CPU */}
          <div className="bg-slate-800 p-3 rounded-xl flex items-center justify-between border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center shadow-inner"><Cpu size={20} className="text-white" /></div>
              <div><h3 className="font-bold text-white text-sm">Stockfish 10</h3><p className="text-[10px] text-slate-400">Nivell 10</p></div>
            </div>
          </div>

          {/* HISTORIAL */}
          <MoveHistory history={history} />

          {/* Estat i Accions */}
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-3 shadow-lg">
            <div className={`text-center font-bold text-sm ${isGameOver ? "text-amber-400" : moveStatus.includes("ESCAC") ? "text-red-400" : "text-white"}`}>{moveStatus}</div>

            {isGameOver ? (
              <button
                onClick={saveGame}
                disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {isSaving ? 'Guardant...' : 'Guardar Partida'}
              </button>
            ) : (
              <button onClick={resignGame} className="w-full bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 py-2.5 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition border border-transparent hover:border-red-500/30"><Flag size={16} /> Rendir-se</button>
            )}

            <button onClick={resetGame} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition"><RefreshCw size={16} /> Nova Partida</button>
          </div>

          {/* TU - ARA CLICABLE */}
          <Link href="/profile" className="block">
            <div className="bg-slate-800 p-3 rounded-xl flex items-center justify-between border border-slate-700 hover:border-indigo-500/50 transition cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center shadow-inner text-white font-bold group-hover:scale-110 transition-transform overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="User Avatar"
                      width={40}
                      height={40}
                      className="w-full h-full rounded object-cover"
                    />
                  ) : (
                    user?.email?.[0].toUpperCase() || <User size={20} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm truncate max-w-[120px] group-hover:text-indigo-300 transition-colors">
                    {user ? (user.user_metadata?.full_name || 'Tu') : 'Convidat'}
                  </h3>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> En línia
                  </p>
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
