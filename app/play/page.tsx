'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Chess } from 'chess.js';
import { Loader2, User, Bot, Trophy, Timer, AlertCircle, Sword } from 'lucide-react';
import SmartChessboard from '@/components/smart-chessboard';
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

type GameMode = 'bullet' | 'blitz' | 'rapid';
type GameState = 'idle' | 'searching' | 'playing' | 'finished';
type BotDifficulty = 'easy' | 'medium' | 'hard';

export default function PlayPage() {
  // Game State
  const [gameState, setGameState] = useState<GameState>('idle');
  const [gameMode, setGameMode] = useState<GameMode>('blitz');
  const [searchTimer, setSearchTimer] = useState(0);
  const [showBotModal, setShowBotModal] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // Chess Logic
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | 'win' | 'loss' | null>(null);

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
      }
    };
    fetchProfile();
  }, []);

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
    setGame(new Chess());
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  };

  const startBotGame = (difficulty: BotDifficulty) => {
    setShowBotModal(false);
    setBotDifficulty(difficulty);
    setGameState('playing');
    setOrientation('white'); // User plays white vs Bot for now
    setGame(new Chess());
    setFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    toast.success(`Partida contra Bot (${difficulty}) iniciada!`);
  };

  const makeMove = useCallback((from: string, to: string, promotion?: string) => {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move({ from, to, promotion: promotion || 'q' });
      if (result) {
        setGame(gameCopy);
        setFen(gameCopy.fen());
        checkGameOver(gameCopy);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [game]);

  const onUserMove = async (newFen: string) => {
    // SmartChessboard calls this after a successful move
    // We need to sync our local game instance
    const gameCopy = new Chess(newFen);
    setGame(gameCopy);
    setFen(newFen);

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
      }
      return true;
    }
    return false;
  };

  return (
    <div className="container mx-auto py-8 min-h-screen flex flex-col items-center gap-8">

      {/* Header & Stats */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl flex items-center justify-center gap-3">
          <Sword className="h-10 w-10 text-amber-500" />
          Arena Competitiva
        </h1>
        {userProfile && (
          <div className="flex justify-center gap-4 text-sm">
            <div className="bg-slate-100 px-3 py-1 rounded-full border">
              Bullet: <strong>{userProfile.elo_bullet || 1200}</strong>
            </div>
            <div className="bg-slate-100 px-3 py-1 rounded-full border">
              Blitz: <strong>{userProfile.elo_blitz || 1200}</strong>
            </div>
            <div className="bg-slate-100 px-3 py-1 rounded-full border">
              Rapid: <strong>{userProfile.elo_rapid || 1200}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">

        {/* Left Panel: Controls */}
        <div className="space-y-4 z-10">
          <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20 shadow-xl text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-amber-400" />
              Selecciona Ritme
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <Button
                variant={gameMode === 'bullet' ? 'default' : 'outline'}
                className={`justify-between h-auto py-4 ${gameMode === 'bullet' ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/20 text-white'}`}
                onClick={() => setGameMode('bullet')}
                disabled={gameState === 'playing' || gameState === 'searching'}
              >
                <span className="flex items-center gap-2">🚀 Bullet</span>
                <span className="text-xs opacity-70">1+0</span>
              </Button>
              <Button
                variant={gameMode === 'blitz' ? 'default' : 'outline'}
                className={`justify-between h-auto py-4 ${gameMode === 'blitz' ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/20 text-white'}`}
                onClick={() => setGameMode('blitz')}
                disabled={gameState === 'playing' || gameState === 'searching'}
              >
                <span className="flex items-center gap-2">⚡ Blitz</span>
                <span className="text-xs opacity-70">3+2</span>
              </Button>
              <Button
                variant={gameMode === 'rapid' ? 'default' : 'outline'}
                className={`justify-between h-auto py-4 ${gameMode === 'rapid' ? 'bg-emerald-600 hover:bg-emerald-700 border-transparent' : 'bg-white/5 border-white/10 hover:bg-white/20 text-white'}`}
                onClick={() => setGameMode('rapid')}
                disabled={gameState === 'playing' || gameState === 'searching'}
              >
                <span className="flex items-center gap-2">🐢 Rapid</span>
                <span className="text-xs opacity-70">10+0</span>
              </Button>
            </div>

            <div className="mt-6">
              {gameState === 'idle' || gameState === 'finished' ? (
                <Button
                  className="w-full text-lg font-bold py-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 border-none"
                  onClick={() => startSearch(gameMode)}
                >
                  Jugar Partida
                </Button>
              ) : gameState === 'searching' ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium animate-pulse">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Cercant oponent...
                  </div>
                  <div className="text-3xl font-mono font-bold text-white">
                    00:{searchTimer.toString().padStart(2, '0')}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setGameState('idle')} className="text-red-400 hover:text-red-300 hover:bg-red-500/20">
                    Cancel·lar
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-300 mb-1">Partida en curs</div>
                  <div className="font-bold text-emerald-400 flex items-center justify-center gap-2">
                    <Sword className="h-4 w-4" /> VS Bot ({botDifficulty})
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-4 w-full bg-red-600/80 hover:bg-red-600"
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

          {/* Game Info Card */}
          {gameState === 'playing' && (
            <Card className="p-4 bg-black/40 backdrop-blur-md text-white border-white/10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-8 w-8 p-1.5 bg-white/10 rounded-lg" />
                  <div>
                    <div className="font-bold">Stockfish</div>
                    <div className="text-xs text-slate-400">Nivell {botDifficulty}</div>
                  </div>
                </div>
                {isBotThinking && <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />}
              </div>

              <div className="h-px bg-white/10 my-2" />

              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <User className="h-8 w-8 p-1.5 bg-emerald-600 rounded-lg" />
                  <div>
                    <div className="font-bold">Tu</div>
                    <div className="text-xs text-slate-400">
                      {userProfile ? userProfile[`elo_${gameMode}`] : '...'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Center: Chessboard */}
        <div className="col-span-1 lg:col-span-2 flex justify-center items-start relative">

          {/* View Mode Toggle */}
          <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-1 rounded-lg flex gap-1 border border-white/10">
            <Button
              variant={viewMode === '2d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('2d')}
              className={`h-8 px-3 ${viewMode === '2d' ? 'bg-emerald-600 hover:bg-emerald-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              2D
            </Button>
            <Button
              variant={viewMode === '3d' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('3d')}
              className={`h-8 px-3 ${viewMode === '3d' ? 'bg-emerald-600 hover:bg-emerald-500' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              3D
            </Button>
          </div>

          {/* Board Container */}
          <div className="w-full h-[600px] relative z-0 flex items-center justify-center bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden">
            {viewMode === '3d' ? (
              <ChessScene
                fen={fen}
                orientation={orientation}
              />
            ) : (
              <div className="w-full max-w-[600px] aspect-square">
                <SmartChessboard
                  initialFen={fen}
                  onMove={onUserMove}
                  boardOrientation={orientation}
                />
              </div>
            )}
          </div>

          {/* Game Over Overlay */}
          {gameState === 'finished' && winner && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-md rounded-xl flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in zoom-in duration-300 border border-white/10 pointer-events-auto shadow-2xl">
                <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                  {winner === 'win' ? '🏆 Victòria!' : winner === 'loss' ? '💀 Derrota' : '🤝 Taules'}
                </h2>
                <p className="text-slate-300 mb-8 text-lg">
                  {winner === 'win' ? 'Has guanyat punts de lliga!' : 'Segueix practicant per millorar.'}
                </p>
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-slate-200 font-bold text-lg px-8 py-6 rounded-full"
                  onClick={() => setGameState('idle')}
                >
                  Tornar a jugar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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

    </div>
  );
}