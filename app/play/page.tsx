'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Chess, Square } from 'chess.js';
import { Loader2, User, Bot, Trophy, Timer, AlertCircle, Sword, Archive, Gift, Lock, Clock } from 'lucide-react';
import Chessboard2D from '@/components/2d/Chessboard2D';
import ChessScene from '@/components/3d/ChessScene';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useChessEngine } from '@/hooks/use-chess-engine';
import { useArenaStore } from '@/lib/store/arena-store';
import { usePlayerStore } from '@/lib/store/player-store';
import { ArenaCard } from '@/components/arena/arena-card';
import { ArenaPath } from '@/components/arena/arena-path';
import { ArenaVariant } from '@/types/arena';
import { ChestOpeningModal } from '@/components/cards/chest-opening-modal';
import { Chest } from '@/types/rpg';

type GameMode = 'bullet' | 'blitz' | 'rapid';
type GameState = 'idle' | 'searching' | 'playing' | 'finished';
type BotDifficulty = 'easy' | 'medium' | 'hard';

export default function PlayPage() {
  // Game State
  const [gameState, setGameState] = useState<GameState>('idle');

  // Arena State
  const { progress, fetchArenaProgress, claimChest, recordGatekeeperDefeat, updateCups } = useArenaStore();
  const [selectedArena, setSelectedArena] = useState<ArenaVariant | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('blitz');
  const [searchTimer, setSearchTimer] = useState(0);
  const [isGatekeeperMatch, setIsGatekeeperMatch] = useState<number | null>(null);
  const [showBotModal, setShowBotModal] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Player Store (Chests)
  const { chests, profile, startUnlockChest, openChest, loadProfile, addChest } = usePlayerStore();
  const [openingRewards, setOpeningRewards] = useState<{ gold: number; gems: number; cardId: string; cardAmount: number } | null>(null);

  // Chest Timer Hook
  useEffect(() => {
    const interval = setInterval(() => {
      usePlayerStore.getState().updateChestTimers();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Chess Logic - Use Hook
  const { fen, makeMove: engineMakeMove, setGameFromFen, game, resetGame } = useChessEngine();
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | 'win' | 'loss' | null>(null);

  // Click to move state for 3D board
  const [moveFrom, setMoveFrom] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

  // Bot Logic
  const engine = useRef<Worker | null>(null);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [isBotThinking, setIsBotThinking] = useState(false);

  // User Stats
  const [userProfile, setUserProfile] = useState<any>(null);

  // 1. Load User Profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(data);
        await loadProfile(user.id);
        fetchArenaProgress(user.id);
      }
    };
    fetchProfile();
  }, [fetchArenaProgress, loadProfile]);

  // 2. Initialize Stockfish
  useEffect(() => {
    if (!engine.current) {
      const stockfishUrl = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js';
      const workerCode = `importScripts('${stockfishUrl}');`;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const localWorkerUrl = URL.createObjectURL(blob);
      engine.current = new Worker(localWorkerUrl);
      engine.current.postMessage('uci');
    }
    return () => {
      engine.current?.terminate();
      engine.current = null;
    };
  }, []);

  // 3. Matchmaking Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'searching') {
      interval = setInterval(() => {
        setSearchTimer(prev => {
          if (prev >= 15) {
            setGameState('idle');
            setShowBotModal(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // 4. Bot Move Listener
  useEffect(() => {
    if (!engine.current) return;
    engine.current.onmessage = (event) => {
      const msg = event.data;
      if (msg.startsWith('bestmove')) {
        const move = msg.split(' ')[1];
        if (move) {
          const from = move.substring(0, 2);
          const to = move.substring(2, 4);
          const promotion = move.length > 4 ? move.substring(4, 5) : undefined;

          makeMove(from, to, promotion);
          setIsBotThinking(false);
        }
      }
    };
  }, [game]);

  // --- Actions ---

  const startSearch = (mode: GameMode) => {
    setGameMode(mode);
    setGameState('searching');
    setSearchTimer(0);
    setWinner(null);
    resetGame();
  };

  const startBotGame = (difficulty: BotDifficulty) => {
    setShowBotModal(false);
    setBotDifficulty(difficulty);
    setGameState('playing');
    setOrientation('white'); // User plays white vs Bot for now
    resetGame();
    toast.success(`Partida contra Bot (${difficulty}) iniciada!`);
  };

  const makeMove = useCallback((from: string, to: string, promotion?: string) => {
    const result = engineMakeMove({ from, to, promotion: promotion || 'q' });
    if (result) {
      checkGameOver(game);

      // Trigger Bot Move if playing vs Bot
      if (gameState === 'playing' && !isBotThinking) {
        if (!game.isGameOver()) {
          setIsBotThinking(true);
          const depth = botDifficulty === 'easy' ? 1 : botDifficulty === 'medium' ? 5 : 12;
          setTimeout(() => {
            engine.current?.postMessage(`position fen ${game.fen()}`);
            engine.current?.postMessage(`go depth ${depth}`);
          }, 500);
        }
      }
      return true;
    }
    return false;
  }, [engineMakeMove, game, gameState, isBotThinking, botDifficulty]);

  function getMoveOptions(square: Square) {
    const moves = game.moves({
      square,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
    moves.forEach((move) => {
      const targetPiece = game.get(move.to as Square);
      const sourcePiece = game.get(square);
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
    const sq = square as Square;

    // If we have a moveFrom, try to move to the clicked square
    if (moveFrom) {
      // If clicked on the same square, deselect
      if (moveFrom === sq) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // Attempt move
      const moveResult = makeMove(moveFrom, sq);
      if (moveResult) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // If move failed, check if we clicked on another piece of our own to select it instead
      const clickedPiece = game.get(sq);
      if (clickedPiece && clickedPiece.color === game.turn()) {
        setMoveFrom(sq);
        getMoveOptions(sq);
        return;
      }

      // Otherwise, just deselect
      setMoveFrom(null);
      setOptionSquares({});
    } else {
      // No piece selected, try to select
      const piece = game.get(sq);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(sq);
        getMoveOptions(sq);
      }
    }
  }

  const onUserMove = async (newFen: string) => {
    // SmartChessboard calls this after a successful move
    // We need to sync our local game instance
    setGameFromFen(newFen);

    // Check game over is async, but we can check sync first
    const gameCopy = new Chess(newFen); // Helper for check
    if (await checkGameOver(gameCopy)) return;

    // Trigger Bot Move
    if (gameState === 'playing' && !isBotThinking) {
      setIsBotThinking(true);
      const depth = botDifficulty === 'easy' ? 1 : botDifficulty === 'medium' ? 5 : 12;

      // Small delay for realism
      setTimeout(() => {
        engine.current?.postMessage(`position fen ${newFen}`);
        engine.current?.postMessage(`go depth ${depth}`);
      }, 500);
    }
  };

  const checkGameOver = async (chess: Chess) => {
    if (chess.isGameOver()) {
      setGameState('finished');
      let result = 'draw';
      if (chess.isCheckmate()) {
        result = chess.turn() === 'w' ? 'loss' : 'win'; // If white turn, white lost
      }
      setWinner(result as any);

      // Record Result
      if (userProfile) {
        const { data, error } = await supabase.rpc('record_game_result', {
          p_user_id: userProfile.id,
          p_mode: gameMode,
          p_result: result,
          p_opponent_elo: botDifficulty === 'easy' ? 800 : botDifficulty === 'medium' ? 1200 : 1800
        });

        if (error) {
          toast.error('Error guardant resultat: ' + error.message);
        } else {
          const points = data.points !== undefined ? data.points : data.new_elo;
          const label = data.status === 'qualified' ? 'CLASSIFICAT!' : 'Punts actualitzats';
          toast.success(`${label}: ${points}`);

          // Refresh profile to show new stats
          const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', userProfile.id).single();
          if (newProfile) setUserProfile(newProfile);
        }

        // Update Arena Cups
        let cupChange = 0;
        if (result === 'win') cupChange = 20;
        else if (result === 'loss') cupChange = -10;
        else cupChange = 5;

        // Handle Gatekeeper Victory
        if (isGatekeeperMatch && result === 'win') {
          await recordGatekeeperDefeat(userProfile.id, gameMode as ArenaVariant, isGatekeeperMatch);
          setIsGatekeeperMatch(null);
          toast.success("Gatekeeper derrotat! El camí està obert.");
        } else if (isGatekeeperMatch && result !== 'win') {
          setIsGatekeeperMatch(null);
          toast.error("Has fallat contra el Gatekeeper. Torna-ho a intentar!");
        }

        await updateCups(userProfile.id, gameMode as ArenaVariant, cupChange);
        toast.info(`Arena: ${cupChange > 0 ? '+' : ''}${cupChange} Copes`);
      }
      return true;
    }
    return false;
  };

  const handleChestClick = (index: number, chest: Chest | null) => {
    console.log('Chest clicked:', index, chest);
    if (!chest) {
      if (profile.role === 'SuperAdmin') {
        // Debug: Add a chest
        addChest({
          id: Math.random().toString(36).substring(7),
          type: 'WOODEN',
          unlockTime: 10,
          status: 'LOCKED'
        });
        toast.success("Debug: Chest Added!");
      }
      return;
    }

    if (chest.status === 'LOCKED') {
      const success = startUnlockChest(index);
      if (success) {
        toast.info("Desbloqueig iniciat!");
      } else {
        toast.error("Ja hi ha un cofre desbloquejant-se!");
      }

    } else if (chest.status === 'UNLOCKING') {
      if (profile.role === 'SuperAdmin') {
        const rewards = openChest(index);
        if (rewards) {
          setOpeningRewards(rewards);
        }
      } else {
        toast.info("Chest is unlocking... wait for timer!");
        // We don't open it here, the timer does the job to switch to READY
      }
    } else if (chest.status === 'READY') {
      const rewards = openChest(index);
      if (rewards) {
        setOpeningRewards(rewards);
      }
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">

      {/* Header - Compact */}
      <header className="flex-none py-4 px-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-md flex items-center justify-between z-20">
        <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2 text-white font-display">
          <Sword className="h-6 w-6 text-amber-500" />
          Arena Competitiva
        </h1>
        {userProfile && (
          <div className="flex gap-3 text-xs text-slate-400">
            <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Bullet: <strong className="text-white">{userProfile.elo_bullet || 1200}</strong>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Blitz: <strong className="text-white">{userProfile.elo_blitz || 1200}</strong>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Rapid: <strong className="text-white">{userProfile.elo_rapid || 1200}</strong>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* Left Sidebar: Controls */}
        <div className="w-full lg:w-80 flex-none p-4 lg:border-r border-white/10 bg-slate-900/30 overflow-y-auto scrollbar-hide z-10">
          <div className="space-y-4">
            {gameState === 'idle' && (
              <div className="space-y-3">
                <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-300 uppercase tracking-wider px-1">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Arenas
                </h3>
                <ArenaCard variant="bullet" progress={progress.bullet} onClick={() => setSelectedArena('bullet')} />
                <ArenaCard variant="blitz" progress={progress.blitz} onClick={() => setSelectedArena('blitz')} />
                <ArenaCard variant="rapid" progress={progress.rapid} onClick={() => setSelectedArena('rapid')} />
              </div>
            )}

            {/* Chests Section */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-slate-300 uppercase tracking-wider px-1">
                <Archive className="h-4 w-4 text-amber-500" />
                Cofres
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {chests.map((chest, index) => (
                  <div
                    key={index}
                    onClick={() => handleChestClick(index, chest)}
                    className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 ${chest
                      ? 'border-amber-500/50 bg-amber-900/20 cursor-pointer hover:bg-amber-900/30'
                      : 'border-zinc-800 bg-zinc-900/50'
                      }`}
                  >
                    {chest ? (
                      <>
                        <Gift className={`h-5 w-5 mb-1 ${chest.type === 'LEGENDARY' ? 'text-purple-400 animate-pulse' :
                          chest.type === 'GOLDEN' ? 'text-yellow-400' :
                            chest.type === 'SILVER' ? 'text-slate-300' :
                              'text-amber-700'
                          }`} />
                        <span className="text-[8px] font-bold text-white uppercase">{chest.type.substring(0, 1)}</span>

                        {/* Status Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          {chest.status === 'LOCKED' && <Lock className="h-3 w-3 text-white/50" />}
                          {chest.status === 'UNLOCKING' && (
                            <div className="flex flex-col items-center">
                              <Clock className="h-3 w-3 text-blue-400 animate-pulse" />
                              {/* Simple countdown display could go here */}
                            </div>
                          )}
                          {chest.status === 'READY' && <span className="text-[8px] font-bold text-green-400 bg-black/80 px-1 rounded animate-bounce">!</span>}
                        </div>
                      </>
                    ) : (
                      <span className="text-zinc-700 text-[8px] font-bold">EMPTY</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-4 bg-white/5 backdrop-blur-md border-white/10 shadow-xl text-white">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-300 uppercase tracking-wider">
                <Trophy className="h-4 w-4 text-amber-400" />
                Ritme de Joc
              </h3>

              <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                <Button
                  variant={gameMode === 'bullet' ? 'default' : 'outline'}
                  className={`justify-between h-auto py-3 ${gameMode === 'bullet' ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/20 text-white'}`}
                  onClick={() => setGameMode('bullet')}
                  disabled={gameState === 'playing' || gameState === 'searching'}
                >
                  <span className="flex items-center gap-2 text-sm">🚀 Bullet</span>
                  <span className="text-[10px] opacity-70">1+0</span>
                </Button>
                <Button
                  variant={gameMode === 'blitz' ? 'default' : 'outline'}
                  className={`justify-between h-auto py-3 ${gameMode === 'blitz' ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/20 text-white'}`}
                  onClick={() => setGameMode('blitz')}
                  disabled={gameState === 'playing' || gameState === 'searching'}
                >
                  <span className="flex items-center gap-2 text-sm">⚡ Blitz</span>
                  <span className="text-[10px] opacity-70">3+2</span>
                </Button>
                <Button
                  variant={gameMode === 'rapid' ? 'default' : 'outline'}
                  className={`justify-between h-auto py-3 ${gameMode === 'rapid' ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/20 text-white'}`}
                  onClick={() => setGameMode('rapid')}
                  disabled={gameState === 'playing' || gameState === 'searching'}
                >
                  <span className="flex items-center gap-2 text-sm">🐢 Rapid</span>
                  <span className="text-[10px] opacity-70">10+0</span>
                </Button>
              </div>

              <div className="mt-4">
                {gameState === 'idle' || gameState === 'finished' ? (
                  <Button
                    className="w-full font-bold py-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 border-none"
                    onClick={() => startSearch(gameMode)}
                  >
                    Jugar Partida
                  </Button>
                ) : gameState === 'searching' ? (
                  <div className="flex flex-col items-center gap-2 py-2 bg-black/20 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium animate-pulse text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cercant...
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">
                      00:{searchTimer.toString().padStart(2, '0')}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setGameState('idle')} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-8 text-xs">
                      Cancel·lar
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-xs text-slate-400 mb-1">Partida en curs</div>
                    <div className="font-bold text-emerald-400 flex items-center justify-center gap-2 text-sm">
                      <Sword className="h-3 w-3" /> VS Bot ({botDifficulty})
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-3 w-full bg-red-600/80 hover:bg-red-600"
                      onClick={() => {
                        setGameState('finished');
                        setWinner('loss'); // Resign
                      }}
                    >
                      Rendir-se
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Center: Chessboard Area */}
        <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden">

          {/* View Mode Toggle */}
          <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-1 rounded-lg flex gap-1 border border-white/10">
            <Button
              variant={viewMode === '2d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('2d')}
              className={`h-7 px-3 text-xs ${viewMode === '2d' ? 'bg-emerald-600 hover:bg-emerald-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              2D
            </Button>
            <Button
              variant={viewMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('3d')}
              className={`h-7 px-3 text-xs ${viewMode === '3d' ? 'bg-emerald-600 hover:bg-emerald-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              3D
            </Button>
          </div>

          {/* Board Container - Responsive Aspect Ratio */}
          <div className="w-full max-w-[80vh] aspect-square relative z-0 shadow-2xl rounded-xl overflow-hidden border border-white/5">
            {viewMode === '3d' ? (
              <ChessScene
                fen={fen}
                orientation={orientation}
                onSquareClick={onSquareClick}
                customSquareStyles={optionSquares}
              />
            ) : (
              <div className="w-full h-full">
                <Chessboard2D
                  fen={fen}
                  onSquareClick={onSquareClick}
                  customSquareStyles={optionSquares}
                  orientation={orientation}
                />
              </div>
            )}
          </div>

          {/* Game Over Overlay */}
          {gameState === 'finished' && winner && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in zoom-in duration-300 border border-white/10 shadow-2xl max-w-sm w-full mx-4">
                <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                  {winner === 'win' ? '🏆 Victòria!' : winner === 'loss' ? '💀 Derrota' : '🤝 Taules'}
                </h2>
                <p className="text-slate-300 mb-6 text-sm">
                  {winner === 'win' ? 'Has guanyat punts de lliga!' : 'Segueix practicant per millorar.'}
                </p>
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    size="lg"
                    className="w-full bg-white text-black hover:bg-slate-200 font-bold rounded-xl"
                    onClick={() => {
                      setGameState('searching');
                      setWinner(null);
                      // Swap colors for rematch logic if needed, or just search again
                      const nextColor = orientation === 'white' ? 'black' : 'white';
                      setOrientation(nextColor);
                      startBotGame(botDifficulty); // Immediate rematch with same bot settings
                    }}
                  >
                    🔄 Revenja
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl"
                    onClick={() => {
                      // Save current game PGN to local storage (or pass via URL state)
                      const pgn = game.pgn();
                      localStorage.setItem('analysis_pgn', pgn);
                      window.location.href = '/analysis';
                    }}
                  >
                    🔍 Analitzar Partida
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                    onClick={() => setGameState('idle')}
                  >
                    Tornar al menú
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Arena Path Dialog */}
      <Dialog open={!!selectedArena} onOpenChange={(open) => !open && setSelectedArena(null)}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 bg-slate-950 border-slate-800 text-white overflow-hidden">
          <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {selectedArena === 'bullet' ? 'Bullet Arena' : selectedArena === 'blitz' ? 'Blitz Arena' : 'Rapid Arena'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Camí cap a la glòria (0 - 1000 Copes)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
            {selectedArena && progress[selectedArena] && (
              <ArenaPath
                progress={progress[selectedArena]!}
                onClaimChest={(chestId) => userProfile && claimChest(userProfile.id, selectedArena, chestId)}
                onPlayGatekeeper={(tier) => {
                  setSelectedArena(null);
                  setIsGatekeeperMatch(tier);
                  startBotGame('hard'); // Gatekeeper is hard bot for now
                  toast.info(`Desafiant al Gatekeeper del Tier ${tier}!`);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bot Proposal Modal */}
      <Dialog open={showBotModal} onOpenChange={setShowBotModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              No s'ha trobat oponent humà
            </DialogTitle>
            <DialogDescription>
              Sembla que no hi ha jugadors disponibles en aquest moment. Vols jugar una partida puntuable contra la IA?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2 py-4">
            <Button variant="outline" className="flex flex-col h-24 gap-1 hover:bg-green-50 hover:border-green-500" onClick={() => startBotGame('easy')}>
              <span className="text-lg">🌱</span>
              <span className="font-bold">Fàcil</span>
              <span className="text-[10px] text-slate-500">800 ELO</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 gap-1 hover:bg-blue-50 hover:border-blue-500" onClick={() => startBotGame('medium')}>
              <span className="text-lg">⚖️</span>
              <span className="font-bold">Mitjà</span>
              <span className="text-[10px] text-slate-500">1200 ELO</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-24 gap-1 hover:bg-red-50 hover:border-red-500" onClick={() => startBotGame('hard')}>
              <span className="text-lg">🔥</span>
              <span className="font-bold">Difícil</span>
              <span className="text-[10px] text-slate-500">1800 ELO</span>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowBotModal(false); setGameState('idle'); }}>
              Cancel·lar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chest Opening Modal */}
      <ChestOpeningModal
        rewards={openingRewards}
        onClose={() => setOpeningRewards(null)}
      />

    </div>
  );
}