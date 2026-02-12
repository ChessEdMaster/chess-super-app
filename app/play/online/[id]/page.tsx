'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { useArenaStore } from '@/lib/store/arena-store';
import { Chess } from 'chess.js';
import { Copy, Loader2, Flag, Handshake, X, RotateCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { ChessClock } from '@/components/chess/chess-clock';
import { ChatBox } from '@/components/chat-box';
import { MoveHistory } from '@/components/chess/move-history';
import { playSound } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';

import Chessboard2D from '@/components/2d/Chessboard2D';

import { useChessEngine } from '@/hooks/use-chess-engine';

// ... imports

import { usePlayerStore } from '@/lib/store/player-store';
import { BotEngine, BotDifficulty } from '@/lib/game/bot-engine';

export default function OnlineGamePage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addXp, addGold, addChest } = usePlayerStore();

  const [isClient, setIsClient] = useState(false);

  // Use Hook for Chess Logic
  const { fen, makeMove, setGameFromFen, game } = useChessEngine();

  interface GameData {
    id: string;
    white_player_id: string | null;
    black_player_id: string | null;
    fen: string;
    pgn: string;
    status: 'pending' | 'active' | 'finished';
    result?: string;
    white_time?: number;
    black_time?: number;
    draw_offer_by?: string | null;
    white?: { username: string; avatar_url?: string };
    black?: { username: string; avatar_url?: string };
    is_bot?: boolean;
    bot_difficulty?: number;
    gatekeeper_tier?: number;
    variant?: string;
  }

  const [gameData, setGameData] = useState<GameData | null>(null);
  // fen is now managed by hook
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [status, setStatus] = useState('Carregant...');
  const [players, setPlayers] = useState({ white: '...', black: '...' });
  const [drawOffer, setDrawOffer] = useState<string | null>(null); // 'white' | 'black' | null

  // Click to move state
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, { background: string; borderRadius?: string }>>({});

  // Settings
  const { boardTheme } = useSettings();
  const theme = BOARD_THEMES[boardTheme];

  // Assegurar que estem al client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- PROTECCIÓ DE RUTA ---
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // 1. Inicialització de la partida
  useEffect(() => {
    if (!id || !user) return;

    const fetchAndSubscribe = async () => {
      // A. Obtenir dades inicials
      let initialGame = null;
      let isBotGame = false;

      // Check if it's a bot game
      if (typeof id === 'string' && id.startsWith('bot-')) {
        isBotGame = true;
        const difficulty = searchParams.get('difficulty') || 'medium';
        initialGame = {
          id: id,
          white_player_id: user.id,
          black_player_id: 'bot',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          pgn: '',
          status: 'active',
          white: { username: user.user_metadata?.full_name || 'You', avatar_url: user.user_metadata?.avatar_url },
          black: { username: `Bot (Lvl ${difficulty})`, avatar_url: null }
        };
      } else {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          alert("Partida no trobada");
          router.push('/lobby');
          return;
        }
        initialGame = data;
      }

      if (initialGame && !isBotGame) {
        // If it's a DB game, check if it's a BOT game
        if ((initialGame as any).is_bot) {
          isBotGame = true;
          // Force active status for bot games if they are stuck
          if (initialGame.status === 'pending') {
            initialGame.status = 'active';
            // Fire and forget update to DB to fix it permanently for this game
            supabase.from('games').update({ status: 'active' }).eq('id', id).then(() => { });
          }
          const tier = (initialGame as any).gatekeeper_tier;
          let botName = 'Bot';
          let botAvatar = null;

          if (tier) {
            // Import ARENA_TIERS dynamically or use a helper if possible, 
            // but we can just hardcode or fetch from types if imported
            // For now, let's map simply:
            const tiers = [
              { tier: 1, name: 'Gatekeeper Pawn', avatar: '/bots/pawn-boss.png' },
              { tier: 2, name: 'Gatekeeper Knight', avatar: '/bots/knight-boss.png' },
              { tier: 3, name: 'Gatekeeper Bishop', avatar: '/bots/bishop-boss.png' },
              { tier: 4, name: 'Gatekeeper Queen', avatar: '/bots/queen-boss.png' }
            ];
            const t = tiers.find(x => x.tier === tier);
            if (t) {
              botName = t.name;
              botAvatar = t.avatar;
            }
          }

          initialGame.black = { username: botName, avatar_url: botAvatar };
          // White is the user (usually)
          const whiteProfile = initialGame.white_player_id ? await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', initialGame.white_player_id)
            .single() : null;
          initialGame.white = whiteProfile?.data || null;

        } else {
          // PVP Game
          const whiteProfile = initialGame.white_player_id ? await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', initialGame.white_player_id)
            .single() : null;

          const blackProfile = initialGame.black_player_id ? await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', initialGame.black_player_id)
            .single() : null;

          initialGame.white = whiteProfile?.data || null;
          initialGame.black = blackProfile?.data || null;
        }
      }

      // B. Determinar qui sóc i si m'he d'unir
      // B. Determine role (White, Black, or Spectator) and Join if necessary
      let finalGameData = initialGame;
      let myColor: 'white' | 'black' | null = null;
      let isParticipant = false;

      // 1. Check if I am already a participant
      if (initialGame.white_player_id === user.id) {
        myColor = 'white';
        isParticipant = true;
      } else if (initialGame.black_player_id === user.id) {
        myColor = 'black';
        isParticipant = true;
      }

      // 2. If not participant, try to claim an open seat
      if (!isParticipant) {
        let seatToClaim: 'white_player_id' | 'black_player_id' | null = null;
        let orientationToSet: 'white' | 'black' = 'white';

        if (!initialGame.white_player_id) {
          seatToClaim = 'white_player_id';
          orientationToSet = 'white';
        } else if (!initialGame.black_player_id) {
          seatToClaim = 'black_player_id';
          orientationToSet = 'black';
        }

        if (seatToClaim) {
          // Attempt to claim the seat
          const { error: joinError } = await supabase
            .from('games')
            .update({
              [seatToClaim]: user.id,
              status: 'active' // If both seats are filled, game becomes active. If one remains empty (unlikely logic here but safe), it might stay pending.
              // Ideally update status only if both are full. But typically 2nd person joining makes it full.
            })
            .eq('id', id);

          if (!joinError) {
            // Reload game to be sure we have clean state (and profile data later)
            const { data: updatedGame } = await supabase
              .from('games')
              .select('*')
              .eq('id', id)
              .single();

            if (updatedGame) {
              finalGameData = updatedGame;
              myColor = orientationToSet;
              isParticipant = true;
              playSound('game_start');
            }
          } else {
            console.error("Failed to join game:", joinError);
            alert("Error al unir-se a la partida.");
            router.push('/lobby');
            return;
          }
        } else {
          // Both seats taken, I am a spectator
          myColor = 'white'; // Spectate from white perspective by default
          alert("Mode espectador");
        }
      }

      // 3. Set Orientation
      // If I am active player, set my color. If spectator, default to white.
      if (myColor) {
        setOrientation(myColor);
      }

      // 4. Fetch Profiles again if we just joined or if we need to refresh opponent
      if (finalGameData) { // Always refresh profiles just in case
        const whiteProfile = finalGameData.white_player_id ? await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', finalGameData.white_player_id)
          .single() : null;

        const blackProfile = finalGameData.black_player_id ? await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', finalGameData.black_player_id)
          .single() : null;

        finalGameData.white = whiteProfile?.data || null;
        finalGameData.black = blackProfile?.data || null;
      }

      // C. Actualitzar estat local (ara amb dades completes)
      setGameData(finalGameData as GameData);

      // FETCH ARENA PROGRESS - Ensure store is ready for results
      if (user) {
        useArenaStore.getState().fetchArenaProgress(user.id);
      }
      setPlayers({
        white: finalGameData.white?.username || user.user_metadata?.full_name || 'Jugador 1',
        black: finalGameData.black?.username || (finalGameData.black_player_id ? 'Jugador 2' : 'Esperant rival...')
      });

      // Sincronitzar tauler
      const initialFen = finalGameData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      setGameFromFen(initialFen);
      updateStatus(new Chess(initialFen), finalGameData); // Use a temp instance for status check if needed, or game ref if updated

      // D. Subscriure's a canvis (REALTIME) - Només si NO és un bot
      if (!isBotGame) {
        const channel = supabase
          .channel(`game_${id}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` }, async (payload) => {
            console.log("Realtime update received:", payload);

            // Robustness: Always refetch the latest state to avoid partial updates or race conditions
            const { data: freshGame, error: fetchError } = await supabase
              .from('games')
              .select('*')
              .eq('id', id)
              .single();

            if (fetchError || !freshGame) {
              console.error("Error fetching fresh game data:", fetchError);
              return;
            }

            // Check if we need to fetch profiles (e.g. opponent joined)
            // We can just optimistically fetch profiles if IDs exist and we don't have them, or just rely on IDs
            const updatedGame = freshGame as GameData;

            // Fetch profiles if they are missing from our current state but exist in fresh data
            // Or simplistically, just fetch them if player IDs are present.
            // Optimize: Only fetch if different from current IDs. But current state 'gameData' might be stale in closure.
            // We can rely on a functional update or just fetch to be safe. 
            // Since this event doesn't happen often (moves are frequent, but joins are once), let's be safe.

            if (updatedGame.white_player_id) {
              const p = await supabase.from('profiles').select('username, avatar_url').eq('id', updatedGame.white_player_id).single();
              updatedGame.white = p.data || undefined;
            }

            if (updatedGame.black_player_id) {
              const p = await supabase.from('profiles').select('username, avatar_url').eq('id', updatedGame.black_player_id).single();
              updatedGame.black = p.data || undefined;
            }

            // Update Notification Sounds
            const incomeGame = new Chess(updatedGame.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
            if (incomeGame.fen() !== fen) {
              // Logic to detect move type
              if (incomeGame.isCheckmate()) playSound('game_end');
              else if (incomeGame.isCheck()) playSound('check');
              else if (incomeGame.history({ verbose: true }).pop()?.captured) playSound('capture');
              else playSound('move');
            }

            // Play start sound if status changed to active
            // We can check previous status via payload.old if available, or just check if we were pending
            // But since we don't have reliable access to 'current state' here, we can play it if game is active and we are at start
            if (updatedGame.status === 'active' && payload.old?.status === 'pending') {
              playSound('game_start');
            }

            // Batch updates
            setGameFromFen(updatedGame.fen);
            setGameData(updatedGame);
            setDrawOffer(updatedGame.draw_offer_by || null);
            setPlayers({
              white: updatedGame.white?.username || 'Jugador 1',
              black: updatedGame.black?.username || (updatedGame.black_player_id ? 'Jugador 2' : 'Esperant rival...')
            });
            updateStatus(incomeGame, updatedGame);
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    };

    fetchAndSubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, router, setGameFromFen]);

  // Helper to handle game over locally for bots
  const handleBotGameOver = async (chess: Chess) => {
    if (!user) return;
    try {
      let result = '';
      if (chess.isCheckmate()) {
        result = chess.turn() === 'w' ? '0-1' : '1-0'; // If white turn and checkmate, black wins
      } else if (chess.isDraw()) {
        result = '1/2-1/2';
      }

      if (result) {
        setGameData(prev => prev ? ({
          ...prev,
          status: 'finished',
          result: result
        }) : null);

        const statusText = result === '1/2-1/2' ? "Partida Finalitzada: Taules" :
          result === '1-0' ? "Partida Finalitzada: Guanyen Blanques" :
            "Partida Finalitzada: Guanyen Negres";
        setStatus(statusText);
        playSound('game_end');

        // Update DB Status
        if (id && !id.toString().startsWith('bot-')) {
          await supabase.from('games').update({
            status: 'finished',
            result: result,
            pgn: chess.pgn() // Ensure final PGN is saved
          }).eq('id', id);
        }

        // REWARDS LOGIC
        // Check if user won
        const userIsWhite = orientation === 'white';
        const userWon = (userIsWhite && result === '1-0') || (!userIsWhite && result === '0-1');
        const isDraw = result === '1/2-1/2';

        if (userWon) {
          // Award XP and Gold
          const xp = 50;
          const gold = 25;
          addXp(xp);
          addGold(gold);

          // RANKED BOT LOGIC
          const variant = (gameData as any).variant || 'blitz';

          try {
            await useArenaStore.getState().processMatchResult(user.id, variant, 'win');
          } catch (e) {
            console.error("Error processing match result:", e);
          }

          // GATEKEEPER VICTORY
          if ((gameData as any)?.gatekeeper_tier) {
            const tier = (gameData as any).gatekeeper_tier;
            await usePlayerStore.getState().addXp(100); // Bonus for boss

            // Update Arena Progress directly
            const { data: progress } = await supabase
              .from('arena_progress')
              .select('gatekeepers_defeated')
              .eq('user_id', user.id)
              .eq('variant', variant)
              .single();

            if (progress) {
              const defeated = progress.gatekeepers_defeated || [];
              if (!defeated.includes(tier)) {
                await supabase.from('arena_progress').update({
                  gatekeepers_defeated: [...defeated, tier]
                }).eq('user_id', user.id).eq('variant', variant);

                // Also insert into attempts history
                await supabase.from('arena_gatekeeper_attempts').insert({
                  user_id: user.id,
                  division_id: (gameData as any).division_id || null,
                  status: 'won',
                  pgn: chess.pgn()
                });

                toast.success(`🎉 GATEKEEPER DEFEATED! You have promoted! 🎉`);
                playSound('success');
              }
            }
          } else {
            if (Math.random() > 0.3) {
              addChest({
                id: Math.random().toString(36).substring(7),
                type: 'WOODEN',
                status: 'LOCKED',
                unlockTime: 60,
              });
              toast.success(`Victòria! +${xp} XP, +${gold} Or i un Cofre! 🏆`);
            } else {
              toast.success(`Victòria! +${xp} XP i +${gold} Or! 🏆`);
            }
          }

        } else if (isDraw) {
          addXp(15);
          addGold(5);

          const variant = (gameData as any).variant || 'blitz';
          try {
            await useArenaStore.getState().processMatchResult(user.id, variant, 'draw');
            toast.info("Taules! +15 XP i +5 Or.");
          } catch (e) {
            console.error("Error processing match result:", e);
            toast.info("Taules! +15 XP i +5 Or.");
          }
        } else {
          addXp(5);

          const variant = (gameData as any).variant || 'blitz';
          try {
            await useArenaStore.getState().processMatchResult(user.id, variant, 'loss');
          } catch (e) {
            console.error("Error processing match result:", e);
          }

          toast.info("Has perdut. +5 XP per l'esforç.");
        }
      }
    } catch (e) {
      console.error("Error handling bot game over:", e);
      toast.error("Error processant el final de partida.");
    }
  };

  // BOT AUTO-MOVE EFFECT
  useEffect(() => {
    // Only run for active bot games
    if (!gameData?.is_bot || gameData.status !== 'active') return;
    if (game.isGameOver()) return;

    // Determine turns
    const userIsWhite = gameData.white_player_id === user?.id;
    const botColor = userIsWhite ? 'b' : 'w';

    if (game.turn() === botColor) {
      // Schedule move
      const timer = setTimeout(() => {
        try {
          // Difficulty Mapping
          const difficultyMap: Record<number, BotDifficulty> = {
            1: 'EASY', 2: 'MEDIUM', 3: 'HARD', 4: 'GATEKEEPER'
          };
          const diffLevel = (gameData as any).bot_difficulty || 2;
          const difficulty = difficultyMap[diffLevel] || 'MEDIUM';

          const engine = new BotEngine(game.fen(), difficulty);
          const move = engine.makeMove();

          if (move) {
            // Apply move locally
            const result = makeMove({ from: move.from, to: move.to, promotion: move.promotion });

            if (result) {
              // Sounds
              if (game.isCheckmate()) playSound('game_end');
              else if (game.isCheck()) playSound('check');
              else if (move.captured) playSound('capture');
              else playSound('move');

              // Sync bot move to DB
              if (id && !id.toString().startsWith('bot-')) {
                supabase.from('games').update({
                  fen: game.fen(),
                  pgn: game.pgn(),
                  last_move_at: new Date().toISOString()
                }).eq('id', id).then(() => { });
              }

              // Check Game Over
              if (game.isGameOver()) {
                handleBotGameOver(game);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fen, gameData, user, makeMove, game, id]);


  // Helper per l'estat
  function updateStatus(chessInstance: Chess, dbData: any) {
    if (dbData.status === 'pending') {
      setStatus("Esperant que s'uneixi un rival...");
    } else if (dbData.status === 'finished') {
      if (dbData.result === '1/2-1/2') setStatus("Partida Finalitzada: Taules");
      else if (dbData.result === '1-0') setStatus("Partida Finalitzada: Guanyen Blanques");
      else if (dbData.result === '0-1') setStatus("Partida Finalitzada: Guanyen Negres");
      else setStatus("Partida Finalitzada");
    } else {
      const turn = chessInstance.turn() === 'w' ? 'Blanques' : 'Negres';
      setStatus(`Torn de les ${turn}`);
    }
  }

  // Help to sync state to DB
  const syncMoveToDB = async (chessInstance: Chess) => {
    if (!id || id.toString().startsWith('bot-')) return;

    const increment = (gameData as any).increment || 0;
    const moverColor = chessInstance.turn() === 'b' ? 'white' : 'black'; // Previous player moved

    const now = new Date();
    const lastMoveTime = (gameData as any).last_move_at ? new Date((gameData as any).last_move_at) : new Date((gameData as any).created_at);
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - lastMoveTime.getTime()) / 1000));

    const currentWhiteTime = (gameData?.white_time || 600);
    const currentBlackTime = (gameData?.black_time || 600);

    let newWhiteTime = currentWhiteTime;
    let newBlackTime = currentBlackTime;

    if (moverColor === 'white') {
      newWhiteTime = Math.max(0, currentWhiteTime - elapsedSeconds + increment);
    } else {
      newBlackTime = Math.max(0, currentBlackTime - elapsedSeconds + increment);
    }

    const { error } = await supabase.from('games').update({
      fen: chessInstance.fen(),
      pgn: chessInstance.pgn(),
      last_move_at: now.toISOString(),
      white_time: newWhiteTime,
      black_time: newBlackTime,
    }).eq('id', id);

    if (error) {
      console.error('[syncMoveToDB] Error:', error);
    } else {
      console.log('[syncMoveToDB] Success');
    }
  };

  // 2. Gestionar Moviment
  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    console.log('[Online onDrop] Called:', { sourceSquare, targetSquare, gameStatus: gameData?.status, currentFen: fen });

    // Validacions bàsiques
    if (!targetSquare) {
      console.log('[Online onDrop] No target square');
      return false;
    }
    if (gameData?.status === 'pending') {
      console.log('[Online onDrop] Game is pending');
      return false;
    }
    if (gameData?.status === 'finished') {
      console.log('[Online onDrop] Game is finished');
      return false;
    }
    if (game.turn() === 'w' && orientation === 'black') {
      console.log('[Online onDrop] Not your turn (white to move, you are black)');
      return false; // No és el teu torn
    }
    if (game.turn() === 'b' && orientation === 'white') {
      console.log('[Online onDrop] Not your turn (black to move, you are white)');
      return false; // No és el teu torn
    }

    // CRÍTICO: Hacer el movimiento en la instancia actual usando el hook
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (!move) {
      console.error('[Online onDrop] Move failed or null');
      return false;
    }

    // Sons locals (optimistic)
    if (game.isCheckmate()) {
      playSound('game_end');
    } else if (game.isCheck()) {
      playSound('check');
    } else if (move.captured) {
      playSound('capture');
    } else {
      playSound('move');
    }

    // Enviar movimiento a la base de datos (async)
    syncMoveToDB(game);

    // CRITICAL FIX: Trigger local Game Over logic for Ranked Bot Games
    if (gameData?.is_bot && game.isGameOver()) {
      handleBotGameOver(game);
    }

    return true;
  }

  function getMoveOptions(square: string) {
    const moves = game.moves({
      square: square as any,
      verbose: true,
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, { background: string; borderRadius?: string }> = {};
    moves.map((move) => {
      const targetPiece = game.get(move.to as any);
      const sourcePiece = game.get(square as any);
      const isCapture = targetPiece && sourcePiece && targetPiece.color !== sourcePiece.color;

      newSquares[move.to] = {
        background: isCapture
          ? 'radial-gradient(circle, rgba(255,0,0,.5) 25%, transparent 25%)'
          : 'radial-gradient(circle, rgba(0,0,0,.5) 25%, transparent 25%)',
        borderRadius: '50%',
      };
      return move;
    });
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: string) {
    // Validacions bàsiques
    if (gameData?.status !== 'active' || game.isGameOver()) return;
    if (game.turn() === 'w' && orientation === 'black') return;
    if (game.turn() === 'b' && orientation === 'white') return;

    // If we have a moveFrom, try to move to the clicked square
    if (moveFrom) {
      // If clicked on the same square, deselect
      if (moveFrom === square) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // Attempt move (reuse onDrop logic essentially)
      const moveResult = onDrop(moveFrom, square);
      if (moveResult) {
        setMoveFrom(null);
        setOptionSquares({});
        return;
      }

      // If move failed, check if we clicked on another piece of our own to select it instead
      const clickedPiece = game.get(square as any);
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
      const piece = game.get(square as any);
      if (piece && piece.color === game.turn()) {
        setMoveFrom(square);
        getMoveOptions(square);
      }
    }
  }

  const handleResign = async () => {
    if (!confirm("Estàs segur que vols rendir-te?")) return;

    const result = orientation === 'white' ? '0-1' : '1-0';
    await supabase.from('games').update({
      status: 'finished',
      result: result
    }).eq('id', id);
  };

  const handleOfferDraw = async () => {
    if (gameData?.status !== 'active') return;
    // Si ja he ofert, no faig res (o podria cancel·lar)
    if (drawOffer === orientation) return;

    await supabase.from('games').update({
      draw_offer_by: orientation
    }).eq('id', id);
  };

  const handleAcceptDraw = async () => {
    await supabase.from('games').update({
      status: 'finished',
      result: '1/2-1/2',
      draw_offer_by: null
    }).eq('id', id);
  };

  const handleDeclineDraw = async () => {
    await supabase.from('games').update({
      draw_offer_by: null
    }).eq('id', id);
  };

  const handleRematch = async () => {
    if (!user || !gameData) return;

    // Determine my color in this game to set the flag
    const myColor = user.id === gameData.white_player_id ? 'white' : 'black';
    const opponentColor = myColor === 'white' ? 'black' : 'white';

    // Get current status
    const currentStatus = (gameData as any).rematch_status || { white: false, black: false, next_game_id: null };

    // Optimistic update
    const newStatus = { ...currentStatus, [myColor]: true };

    // Check if opponent already accepted
    if (newStatus[opponentColor]) {
      // Both accepted! create new game
      // Only one should create to avoid duplicates. Let's say White (of PREVIOUS game) creates it.
      // Or deeper logic: atomic check. simpler: trigger server function or use RLS. 
      // For now: client side creation with a "lock" check via DB constraints is hard.
      // We will just create it and update. If race condition, last write wins (might overwrite next_game_id, checking null helps)

      if (!currentStatus.next_game_id) {
        const { data: newGame, error } = await supabase
          .from('games')
          .insert({
            white_player_id: gameData.black_player_id, // Swap colors
            black_player_id: gameData.white_player_id,
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            pgn: '',
            status: 'active', // Direct start since we have both
            white_time: gameData.white_time || 600, // Preserve constraints
            black_time: gameData.black_time || 600
          })
          .select()
          .single();

        if (newGame) {
          newStatus.next_game_id = newGame.id;
          await supabase.from('games').update({ rematch_status: newStatus }).eq('id', id);
        }
      }
    } else {
      // Just report my readiness
      await supabase.from('games').update({ rematch_status: newStatus }).eq('id', id);
      toast.success("Petició de revenja enviada! Esperant rival...");
    }
  };

  // Effect to handle redirection when next_game_id appears
  useEffect(() => {
    if ((gameData as any)?.rematch_status?.next_game_id) {
      router.push(`/play/online/${(gameData as any).rematch_status.next_game_id}`);
    }
  }, [gameData, router]);

  const goToAnalysis = () => {
    // Guardar PGN al localStorage per recuperar-lo a l'anàlisi
    localStorage.setItem('analysis_pgn', game.pgn());
    router.push('/analysis');
  };

  const handleTimeout = async (winnerColor: 'w' | 'b') => {
    // Només un dels dos hauria de cridar això per evitar conflictes, idealment el guanyador o el server
    // Per simplificar, ho fem si som el jugador actiu
    if (gameData?.status !== 'active') return;

    const result = winnerColor === 'w' ? '1-0' : '0-1';
    await supabase.from('games').update({
      status: 'finished',
      result: result
    }).eq('id', id);
  };

  // Mentres comprovem l'usuari, mostrem càrrega
  if (loading || !user || !isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Verificant accés...
      </div>
    );
  }

  // No renderitzar el tauler fins que tinguem dades
  if (!gameData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Carregant partida...
      </div>
    );
  }



  return (
    <div className="h-dvh w-full bg-slate-950 flex flex-col items-center overflow-hidden">



      <div className="flex-1 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-4 p-2 lg:p-4 overflow-hidden">

        {/* COLUMNA ESQUERRA: Tauler i Rellotges */}
        <div className="flex flex-col gap-4 w-full max-w-[600px] h-full justify-center shrink-0 z-10">

          <ChessClock
            whiteTime={gameData.white_time || 600}
            blackTime={gameData.black_time || 600}
            turn={game.turn()}
            isActive={gameData.status === 'active'}
            onTimeout={handleTimeout}
          />

          {/* Board Container - Responsive Height */}
          <div className="relative w-full aspect-square max-h-[60vh] lg:max-h-[70vh] shadow-2xl rounded-xl overflow-hidden glass-panel mx-auto bg-black/20">
            <Chessboard2D
              fen={fen}
              orientation={orientation}
              onSquareClick={onSquareClick}
              customSquareStyles={optionSquares}
            />
            {gameData.status === 'pending' && !gameData.is_bot && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-center">
                  <Loader2 className="animate-spin text-amber-400 mb-4 mx-auto" size={48} />
                  <h3 className="text-xl font-bold text-white font-display uppercase tracking-wider">Waiting for Opponent...</h3>
                  <p className="text-sm text-zinc-400 mt-2">Compartir enllaç o esperar al Lobby.</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button onClick={handleResign} disabled={gameData.status !== 'active'} className="glass-panel hover:bg-red-900/30 text-zinc-300 hover:text-red-400 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition border-zinc-700/50 hover:border-red-500/50 disabled:opacity-50 text-xs font-display uppercase tracking-wider">
              <Flag size={14} /> Resign
            </button>

            {/* Botó Taules Dinàmic */}
            {drawOffer && drawOffer !== orientation ? (
              <div className="flex gap-2">
                <button onClick={handleAcceptDraw} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition animate-pulse text-xs font-display uppercase">
                  <Handshake size={14} /> Accept
                </button>
                <button onClick={handleDeclineDraw} className="w-12 glass-panel hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg flex items-center justify-center transition border-zinc-700/50">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOfferDraw}
                disabled={gameData.status !== 'active' || drawOffer === orientation}
                className={`glass-panel hover:bg-zinc-800 text-zinc-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition border-zinc-700/50 disabled:opacity-50 text-xs font-display uppercase tracking-wider ${drawOffer === orientation ? 'opacity-50 cursor-wait' : ''}`}
              >
                <Handshake size={14} /> {drawOffer === orientation ? 'Offer Sent...' : 'Offer Draw'}
              </button>
            )}
          </div>

          {/* MODAL GAME OVER */}
          {gameData.status === 'finished' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
              <div className="glass-panel p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center transform scale-100 animate-in zoom-in duration-300 border-amber-500/20">
                <h2 className="text-3xl font-black text-white mb-2 font-display uppercase italic tracking-wider">Game Over</h2>
                <p className="text-lg text-amber-400 font-bold mb-8">{status.replace('Partida Finalitzada: ', '')}</p>

                <div className="flex flex-col gap-3">
                  <button onClick={handleRematch} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/40 text-sm font-display uppercase tracking-wide">
                    <RotateCw size={18} /> Rematch
                  </button>
                  <button onClick={goToAnalysis} className="w-full glass-panel hover:bg-zinc-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition border-zinc-700 text-sm font-display uppercase tracking-wide">
                    <Search size={18} /> Analysis Board
                  </button>
                  <button onClick={() => router.push('/lobby')} className="w-full text-zinc-500 hover:text-zinc-300 py-2 text-xs transition uppercase tracking-widest mt-2">
                    Return to Lobby
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DRETA: Info, Xat, Historial */}
        <div className="w-full lg:w-80 flex flex-col gap-3 h-full lg:h-auto lg:max-h-[80vh] overflow-hidden z-10 glass-panel p-3 rounded-xl bg-zinc-950/40">

          {/* Oponent */}
          <div className="bg-zinc-900/60 p-3 rounded-lg flex items-center gap-3 border border-white/5 shrink-0">
            <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold shadow-inner text-sm ${orientation === 'white' ? 'bg-zinc-800' : 'bg-zinc-100 text-black'}`}>
              {orientation === 'white' ? 'B' : 'W'}
            </div>
            <div>
              <p className="font-bold text-white text-sm font-display tracking-wide">{orientation === 'white' ? players.black : players.white}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Opponent</p>
            </div>
          </div>

          {/* Historial */}
          <div className="flex-1 min-h-0 bg-zinc-900/30 rounded-lg overflow-hidden border border-white/5">
            <MoveHistory history={game.history()} />
          </div>

          {/* Xat */}
          <div className="h-32 lg:h-48 shrink-0">
            <ChatBox gameId={id as string} userId={user.id} />
          </div>

          {/* Tu */}
          <div className="bg-zinc-900/60 p-3 rounded-lg flex items-center gap-3 border border-amber-500/30 shadow-lg shadow-amber-900/10 shrink-0">
            <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold shadow-inner text-sm ${orientation === 'white' ? 'bg-zinc-100 text-black' : 'bg-zinc-800'}`}>
              {orientation === 'white' ? 'W' : 'B'}
            </div>
            <div>
              <p className="font-bold text-white text-sm font-display tracking-wide">{orientation === 'white' ? players.white : players.black}</p>
              <p className="text-[10px] text-amber-500 uppercase tracking-widest font-bold">You</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

