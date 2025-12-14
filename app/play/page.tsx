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
import { GameResultModal } from '@/components/game/game-result-modal';
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
  const [lastEloChange, setLastEloChange] = useState(0);
  const [lastStreak, setLastStreak] = useState(0);

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
          // Capture ELO change and streak for the result modal
          setLastEloChange(data.points_diff || 0);
          setLastStreak(data.streak || 0);

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
      <header className="flex-none py-4 px-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between z-20">
        <h1 className="text-2xl font-black tracking-widest flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 font-display italic">
          <Sword className="h-6 w-6 text-amber-500" />
          Arena Competitiva
        </h1>
        {userProfile && (
          <div className="flex gap-3 text-xs text-zinc-400">
            <div className="bg-zinc-900/80 px-4 py-1.5 rounded-full border border-white/10 shadow-inner flex items-center gap-2">
              <span className="font-bold text-zinc-500 uppercase tracking-wider">Bullet</span>
              <strong className="text-white font-mono">{userProfile.elo_bullet || 1200}</strong>
            </div>
            <div className="bg-zinc-900/80 px-4 py-1.5 rounded-full border border-white/10 shadow-inner flex items-center gap-2">
              <span className="font-bold text-zinc-500 uppercase tracking-wider">Blitz</span>
              <strong className="text-white font-mono">{userProfile.elo_blitz || 1200}</strong>
            </div>
            <div className="bg-zinc-900/80 px-4 py-1.5 rounded-full border border-white/10 shadow-inner flex items-center gap-2">
              <span className="font-bold text-zinc-500 uppercase tracking-wider">Rapid</span>
              <strong className="text-white font-mono">{userProfile.elo_rapid || 1200}</strong>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* Left Sidebar: Controls */}
        <div className="w-full lg:w-80 flex-none p-4 lg:border-r border-white/5 bg-zinc-900/20 overflow-y-auto scrollbar-hide z-10 glass-panel border-y-0 border-l-0 rounded-none">
          <div className="space-y-6">
            {gameState === 'idle' && (
              <div className="space-y-3">
                <h3 className="font-bold text-xs mb-2 flex items-center gap-2 text-zinc-500 uppercase tracking-widest px-1">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  Arenas
                </h3>
                <div className="space-y-2">
                  <ArenaCard variant="bullet" progress={progress.bullet} onClick={() => setSelectedArena('bullet')} />
                  <ArenaCard variant="blitz" progress={progress.blitz} onClick={() => setSelectedArena('blitz')} />
                  <ArenaCard variant="rapid" progress={progress.rapid} onClick={() => setSelectedArena('rapid')} />
                </div>
              </div>
            )}

            {/* Chests Section */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs mb-2 flex items-center gap-2 text-zinc-500 uppercase tracking-widest px-1">
                <Archive className="h-3 w-3 text-indigo-500" />
                Cofres
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {chests.map((chest, index) => (
                  <div
                    key={index}
                    onClick={() => handleChestClick(index, chest)}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all active:scale-95 group shadow-lg ${chest
                      ? 'border-amber-500/30 bg-gradient-to-br from-zinc-900 to-amber-950/30 cursor-pointer hover:border-amber-500/60'
                      : 'border-zinc-800 bg-zinc-900/30'
                      }`}
                  >
                    {chest ? (
                      <>
                        <Gift className={`h-6 w-6 mb-1 drop-shadow-md transition-transform group-hover:scale-110 ${chest.type === 'LEGENDARY' ? 'text-purple-400 animate-pulse' :
                          chest.type === 'GOLDEN' ? 'text-amber-300' :
                            chest.type === 'SILVER' ? 'text-slate-300' :
                              'text-amber-700'
                          }`} />
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{chest.type.substring(0, 1)}</span>

                        {/* Status Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          {chest.status === 'LOCKED' && <Lock className="h-4 w-4 text-white/70" />}
                          {chest.status === 'UNLOCKING' && (
                            <div className="flex flex-col items-center">
                              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                            </div>
                          )}
                          {chest.status === 'READY' && <span className="text-[10px] font-bold text-emerald-400 bg-black/80 px-2 py-1 rounded-full border border-emerald-500/50">OPEN</span>}
                        </div>
                        {chest.status === 'UNLOCKING' && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                        )}
                        {chest.status === 'READY' && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-ping" />
                        )}
                      </>
                    ) : (
                      <span className="text-zinc-800 text-[8px] font-black">EMPTY</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-5 rounded-xl bg-zinc-900/60 border-white/5">
              <h3 className="font-bold text-xs mb-4 flex items-center gap-2 text-zinc-500 uppercase tracking-widest">
                <Timer className="h-3 w-3 text-emerald-500" />
                Ritme de Joc
              </h3>

              <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
                <Button
                  variant={gameMode === 'bullet' ? 'default' : 'outline'}
                  className={`justify-between h-auto py-3 px-4 rounded-xl transition-all duration-300 ${gameMode === 'bullet' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 text-white shadow-lg shadow-emerald-900/20' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                  onClick={() => setGameMode('bullet')}
                  disabled={gameState === 'playing' || gameState === 'searching'}
                >
                  <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">🚀 Bullet</span>
                  <span className="text-[10px] font-mono opacity-60">1+0</span>
                </Button>
                <Button
                  variant={gameMode === 'blitz' ? 'default' : 'outline'}
                  className={`justify-between h-auto py-3 px-4 rounded-xl transition-all duration-300 ${gameMode === 'blitz' ? 'bg-amber-600 hover:bg-amber-500 border-amber-500/50 text-white shadow-lg shadow-amber-900/20' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                  onClick={() => setGameMode('blitz')}
                  disabled={gameState === 'playing' || gameState === 'searching'}
                >
                  <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">⚡ Blitz</span>
                  <span className="text-[10px] font-mono opacity-60">3+2</span>
                </Button>
                <Button
                  variant={gameMode === 'rapid' ? 'default' : 'outline'}
                  className={`justify-between h-auto py-3 px-4 rounded-xl transition-all duration-300 ${gameMode === 'rapid' ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500/50 text-white shadow-lg shadow-indigo-900/20' : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                  onClick={() => setGameMode('rapid')}
                  disabled={gameState === 'playing' || gameState === 'searching'}
                >
                  <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">🐢 Rapid</span>
                  <span className="text-[10px] font-mono opacity-60">10+0</span>
                </Button>
              </div>

              <div className="mt-6">
                {gameState === 'idle' || gameState === 'finished' ? (
                  <Button
                    className="w-full font-black py-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 border border-emerald-500/20 uppercase tracking-widest text-sm"
                    onClick={() => startSearch(gameMode)}
                  >
                    Jugar Partida
                  </Button>
                ) : gameState === 'searching' ? (
                  <div className="flex flex-col items-center gap-3 py-4 bg-zinc-950/50 rounded-xl border border-dashed border-zinc-800 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold animate-pulse text-xs uppercase tracking-widest">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cercant Oponent...
                    </div>
                    <div className="text-3xl font-mono font-black text-white px-4 py-1 bg-black/40 rounded">
                      00:{searchTimer.toString().padStart(2, '0')}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setGameState('idle')} className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 text-[10px] uppercase font-bold tracking-wider">
                      Cancel·lar
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2 glass-panel rounded-xl border-amber-500/20 bg-amber-500/5">
                    <div className="text-[10px] font-bold text-amber-500/70 mb-2 uppercase tracking-widest">Partida en curs</div>
                    <div className="font-bold text-white flex items-center justify-center gap-2 text-sm mb-4">
                      <Sword className="h-4 w-4 text-amber-500" /> VS Bot ({botDifficulty})
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold uppercase tracking-wider text-xs"
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
            </div>
          </div>
        </div>

        {/* Center: Chessboard Area */}
        <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden bg-gradient-to-br from-zinc-950 to-zinc-900">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

          {/* View Mode Toggle */}
          <div className="absolute top-4 right-4 z-20 glass-panel p-1 rounded-lg flex gap-1 border-white/5 bg-zinc-900/60 backdrop-blur-md">
            <Button
              variant={viewMode === '2d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('2d')}
              className={`h-7 px-3 text-[10px] font-bold uppercase tracking-wider ${viewMode === '2d' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              2D
            </Button>
            <Button
              variant={viewMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('3d')}
              className={`h-7 px-3 text-[10px] font-bold uppercase tracking-wider ${viewMode === '3d' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              3D
            </Button>
          </div>

          {/* Board Container - Responsive Aspect Ratio */}
          <div className="w-full max-w-[min(85vh,85vw)] aspect-square relative z-10 shadow-2xl rounded-xl overflow-hidden glass-panel border-white/5 ring-1 ring-white/10">
            {viewMode === '3d' ? (
              <ChessScene
                fen={fen}
                orientation={orientation}
                onSquareClick={onSquareClick}
                customSquareStyles={optionSquares}
              />
            ) : (
              <div className="w-full h-full bg-zinc-900">
                <Chessboard2D
                  fen={fen}
                  onSquareClick={onSquareClick}
                  customSquareStyles={optionSquares}
                  orientation={orientation}
                />
              </div>
            )}
          </div>

          {/* Game Over Modal */}
          {gameState === 'finished' && winner && (winner === 'win' || winner === 'loss' || winner === 'draw') && (
            <GameResultModal
              result={winner as 'win' | 'loss' | 'draw'}
              eloChange={lastEloChange}
              streak={lastStreak}
              onNewGame={() => {
                setGameState('idle');
                setWinner(null);
                resetGame();
              }}
              onRematch={() => {
                setWinner(null);
                const nextColor = orientation === 'white' ? 'black' : 'white';
                setOrientation(nextColor);
                startBotGame(botDifficulty);
              }}
              onAnalyze={() => {
                const pgn = game.pgn();
                localStorage.setItem('analysis_pgn', pgn);
                window.location.href = '/analysis';
              }}
              onExit={() => {
                window.location.href = '/';
              }}
              onClose={() => {
                setGameState('idle');
                setWinner(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Arena Path Dialog */}
      <Dialog open={!!selectedArena} onOpenChange={(open) => !open && setSelectedArena(null)}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 bg-zinc-950 border-zinc-800 text-white overflow-hidden glass-panel shadow-2xl">
          <DialogHeader className="p-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl">
            <DialogTitle className="flex items-center gap-2 font-display uppercase tracking-wider text-sm">
              <Trophy className="h-4 w-4 text-amber-500" />
              {selectedArena === 'bullet' ? 'Bullet Arena' : selectedArena === 'blitz' ? 'Blitz Arena' : 'Rapid Arena'}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
              Journey to Glory (0 - 1000 Cups)
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/80">
            {selectedArena && progress[selectedArena] && (
              <ArenaPath
                progress={progress[selectedArena]!}
                onClaimChest={(chestId) => userProfile && claimChest(userProfile.id, selectedArena, chestId)}
                onPlayGatekeeper={(tier) => {
                  setSelectedArena(null);
                  setIsGatekeeperMatch(tier);
                  startBotGame('hard');
                  toast.info(`Challenging Gatekeeper Tier ${tier}!`);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bot Proposal Modal */}
      <Dialog open={showBotModal} onOpenChange={setShowBotModal}>
        <DialogContent className="glass-panel border-zinc-800 bg-zinc-950/90 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-amber-400">
              <AlertCircle className="h-5 w-5" />
              No Human Opponent Found
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Seems quiet right now. Want to play a ranked match against AI?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-4">
            <Button variant="outline" className="flex flex-col h-28 gap-2 bg-zinc-900 border-zinc-800 hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all group" onClick={() => startBotGame('easy')}>
              <span className="text-2xl group-hover:scale-110 transition-transform">🌱</span>
              <div className="flex flex-col items-center">
                <span className="font-bold text-white group-hover:text-emerald-400">Easy</span>
                <span className="text-[10px] text-zinc-500 font-mono">800 ELO</span>
              </div>
            </Button>
            <Button variant="outline" className="flex flex-col h-28 gap-2 bg-zinc-900 border-zinc-800 hover:bg-blue-900/20 hover:border-blue-500/50 transition-all group" onClick={() => startBotGame('medium')}>
              <span className="text-2xl group-hover:scale-110 transition-transform">⚖️</span>
              <div className="flex flex-col items-center">
                <span className="font-bold text-white group-hover:text-blue-400">Medium</span>
                <span className="text-[10px] text-zinc-500 font-mono">1200 ELO</span>
              </div>
            </Button>
            <Button variant="outline" className="flex flex-col h-28 gap-2 bg-zinc-900 border-zinc-800 hover:bg-red-900/20 hover:border-red-500/50 transition-all group" onClick={() => startBotGame('hard')}>
              <span className="text-2xl group-hover:scale-110 transition-transform">🔥</span>
              <div className="flex flex-col items-center">
                <span className="font-bold text-white group-hover:text-red-400">Hard</span>
                <span className="text-[10px] text-zinc-500 font-mono">1800 ELO</span>
              </div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowBotModal(false); setGameState('idle'); }} className="text-zinc-500 hover:text-white">
              Cancel
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