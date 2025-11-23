'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Trophy, RefreshCw, User, Cpu, AlertTriangle, Loader2, Flag, XCircle, Save } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { MoveHistory } from '@/components/move-history';
import { playSound } from '@/lib/sounds';

// Configuració de potència (10 és un bon equilibri per navegador)
const ENGINE_DEPTH = 10;

export default function PlayPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(game.fen());
  const [moveStatus, setMoveStatus] = useState("El teu torn (Blanques)");
  const [isClient, setIsClient] = useState(false);
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Gestió de Coronació
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState<{ from: string, to: string } | null>(null);

  const engine = useRef<Worker | null>(null);

  // --- PROTECCIÓ DE RUTA ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Inicialització Worker + Client
  useEffect(() => {
    setIsClient(true);
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

    return () => {
      stockfishWorker.terminate();
      URL.revokeObjectURL(localWorkerUrl);
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
  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    if (isEngineThinking || isGameOver || !targetSquare) return false;

    const piece = game.get(sourceSquare as any);
    // Detectar Coronació visual
    if (
      piece?.type === 'p' &&
      ((piece.color === 'w' && targetSquare[1] === '8') || (piece.color === 'b' && targetSquare[1] === '1'))
    ) {
      setPromotionMove({ from: sourceSquare, to: targetSquare });
      setShowPromotionDialog(true);
      return false;
    }

    return attemptMove(sourceSquare, targetSquare);
  }

  function attemptMove(source: string, target: string, promotionPiece: string = 'q') {
    const gameCopy = new Chess(game.fen());
    let move = null;

    try {
      move = gameCopy.move({ from: source, to: target, promotion: promotionPiece });
    } catch (error) { return false; }

    if (!move) return false;

    // Sons
    if (gameCopy.isCheckmate()) playSound('game_end');
    else if (gameCopy.isCheck()) playSound('check');
    else if (move.captured) playSound('capture');
    else playSound('move');

    setGame(gameCopy);
    setFen(gameCopy.fen());
    setHistory(gameCopy.history());

    if (!checkGameStatus(gameCopy)) {
      setTimeout(() => { findBestMove(gameCopy.fen()); }, 200);
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
    } catch (error: any) {
      console.error("Error:", error);
      alert("❌ Error guardant: " + error.message);
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
            options={{
              id: "PlayVsStockfish",
              position: fen,
              onPieceDrop: onDrop,
              boardOrientation: "white",
              darkSquareStyle: { backgroundColor: '#779556' },
              lightSquareStyle: { backgroundColor: '#ebecd0' },
              animationDurationInMs: 200,
              allowDragging: !isGameOver && !isEngineThinking,
            }}
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
                <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center shadow-inner text-white font-bold group-hover:scale-110 transition-transform">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="U" className="w-full h-full rounded" />
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
