'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Chess } from 'chess.js';
import { Copy, Loader2, Flag, Handshake, X, RotateCw, Search } from 'lucide-react';
import { ChessClock } from '@/components/chess-clock';
import { ChatBox } from '@/components/chat-box';
import { MoveHistory } from '@/components/move-history';
import { playSound } from '@/lib/sounds';
import { useSettings } from '@/lib/settings';
import { BOARD_THEMES } from '@/lib/themes';

import Chessboard2D from '@/components/2d/Chessboard2D';

import { useChessEngine } from '@/hooks/use-chess-engine';

// ... imports

import { usePlayerStore } from '@/lib/store/player-store';

export default function OnlineGamePage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { addXp, addGold } = usePlayerStore();

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
        const difficulty = id.split('-')[1];
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
        // Obtenir perfils dels jugadors (Només per partides reals)
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

      // B. Determinar qui sóc i si m'he d'unir
      let currentBlackId = initialGame.black_player_id;
      let finalGameData = initialGame;

      // Si sóc el creador -> Sóc Blanques
      if (user.id === initialGame.white_player_id) {
        setOrientation('white');
      }
      // Si no sóc el creador i no hi ha rival -> M'uneixo com a Negres
      else if (!currentBlackId) {
        const { error: joinError } = await supabase
          .from('games')
          .update({
            black_player_id: user.id,
            status: 'active'
          })
          .eq('id', id);

        if (!joinError) {
          // IMPORTANT: Recarregar la partida completa després d'unir-se
          const { data: updatedGame } = await supabase
            .from('games')
            .select('*')
            .eq('id', id)
            .single();

          if (updatedGame) {
            // Recarregar perfils amb el nou jugador negre
            const whiteProfile = updatedGame.white_player_id ? await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', updatedGame.white_player_id)
              .single() : null;

            const blackProfile = updatedGame.black_player_id ? await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', updatedGame.black_player_id)
              .single() : null;

            updatedGame.white = whiteProfile?.data || null;
            updatedGame.black = blackProfile?.data || null;

            // Actualitzar estat local amb les dades completes
            finalGameData = updatedGame;
            currentBlackId = user.id;
          }

          setOrientation('black');
          playSound('game_start');
        } else {
          console.error('Error unint-se a la partida:', joinError);
          alert('Error al unir-se a la partida');
          router.push('/lobby');
          return;
        }
      }
      // Si ja hi ha rival i sóc jo -> Sóc Negres
      else if (currentBlackId === user.id) {
        setOrientation('black');
      }
      // Si ja està plena i no sóc ningú -> Espectador
      else {
        setOrientation('white');
        alert("Mode espectador");
      }

      // C. Actualitzar estat local (ara amb dades completes)
      setGameData(finalGameData as GameData);
      setPlayers({
        white: finalGameData.white?.username || user.user_metadata?.full_name || 'Jugador 1',
        black: finalGameData.black?.username || (currentBlackId ? 'Jugador 2' : 'Esperant rival...')
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
            const newData = payload.new;

            // Si s'ha unit un jugador, recarregar perfils
            if (newData.black_player_id && !gameData?.black_player_id) {
              const blackProfile = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', newData.black_player_id)
                .single();

              newData.black = blackProfile?.data || null;

              // Actualitzar noms dels jugadors
              setPlayers(prev => ({
                ...prev,
                black: newData.black?.username || 'Jugador 2'
              }));
              playSound('game_start');
            }

            // Quan rebem un canvi des de la DB (l'altre ha mogut):
            const incomeGame = new Chess(newData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

            // Detectar si hi ha hagut moviment per fer so
            if (incomeGame.fen() !== fen) {
              if (incomeGame.isCheckmate()) playSound('game_end');
              else if (incomeGame.isCheck()) playSound('check');
              else if (incomeGame.history({ verbose: true }).pop()?.captured) playSound('capture');
              else playSound('move');
            }

            setGameFromFen(newData.fen || incomeGame.fen());
            setGameData(newData as GameData);
            setDrawOffer(newData.draw_offer_by);

            updateStatus(incomeGame, newData);
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    };

    fetchAndSubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, router, setGameFromFen]); // Added setGameFromFen

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

    const newFen = game.fen();
    console.log('[Online onDrop] New FEN:', newFen);

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

    // Enviar movimiento a la base de datos (async, no bloquea el return)
    if (id && !id.toString().startsWith('bot-')) {
      supabase.from('games').update({
        fen: newFen,
        pgn: game.pgn(),
      }).eq('id', id).then(({ error }) => {
        if (error) {
          console.error('[Online onDrop] Error actualizando partida:', error);
        } else {
          console.log('[Online onDrop] Move saved to database successfully');
        }
      });
    } else {
      // BOT LOGIC
      if (!game.isGameOver()) {
        setTimeout(() => {
          // Simple random bot for now (can be improved with Stockfish later)
          const moves = game.moves({ verbose: true });
          if (moves.length > 0) {
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            const botMove = makeMove({
              from: randomMove.from,
              to: randomMove.to,
              promotion: randomMove.promotion
            });
            if (botMove) {
              playSound(botMove.captured ? 'capture' : 'move');
              if (game.isCheckmate()) playSound('game_end');
              else if (game.isCheck()) playSound('check');

              // Check for game over after bot move
              if (game.isGameOver()) {
                handleBotGameOver(game);
              }
            }
          }
        }, 500);
      } else {
        // Check for game over after user move (if user checkmated bot)
        handleBotGameOver(game);
      }
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
    // Lògica simple: Crear nova partida i redirigir (millorable amb invitació)
    if (!user) return;
    const { data, error } = await supabase
      .from('games')
      .insert({
        white_player_id: user.id, // Qui demana revenja juga amb blanques (o es podria alternar)
        black_player_id: null, // Esperem que l'altre s'uneixi (o podríem forçar-ho si tinguéssim API)
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        status: 'pending'
      })
      .select()
      .single();

    if (data) {
      // Enviar missatge al xat amb l'enllaç (opció ràpida)
      await supabase.from('messages').insert({
        game_id: id,
        user_id: user.id,
        content: `REVENJA: /play/online/${data.id}`
      });
      router.push(`/play/online/${data.id}`);
    }
  };

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

  // Helper to handle game over locally for bots
  const handleBotGameOver = (chess: Chess) => {
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

      // REWARDS LOGIC
      // Check if user won
      const userIsWhite = orientation === 'white';
      const userWon = (userIsWhite && result === '1-0') || (!userIsWhite && result === '0-1');
      const isDraw = result === '1/2-1/2';

      if (userWon) {
        // Award XP and Gold
        const xp = 50;
        const gold = 25;
        // We need to import usePlayerStore at the top level, but we can't do it inside this function easily if it's not a hook call.
        // Ideally we use the hook at the top and call its methods here.
        // Assuming 'addXp', 'addGold' are available from the hook called at component level.
        addXp(xp);
        addGold(gold);
        // Chance for chest
        if (Math.random() > 0.5) {
          // addChest('WOODEN'); // Need to implement addChest in store if not present, or just ignore for now
          alert(`Victòria! Has guanyat ${xp} XP i ${gold} d'Or! 🏆`);
        } else {
          alert(`Victòria! Has guanyat ${xp} XP i ${gold} d'Or! 🏆`);
        }
      } else if (isDraw) {
        addXp(15);
        addGold(5);
        alert("Taules! Has guanyat 15 XP i 5 d'Or.");
      } else {
        addXp(5);
        alert("Has perdut. Guanyes 5 XP per l'esforç.");
      }
    }
  };

  return (
    <div className="h-dvh w-full bg-slate-950 flex flex-col items-center overflow-hidden">



      <div className="flex-1 w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-4 p-2 lg:p-4 overflow-hidden">

        {/* COLUMNA ESQUERRA: Tauler i Rellotges */}
        <div className="flex flex-col gap-2 w-full max-w-[600px] h-full justify-center shrink-0">

          <ChessClock
            whiteTime={gameData.white_time || 600}
            blackTime={gameData.black_time || 600}
            turn={game.turn()}
            isActive={gameData.status === 'active'}
            onTimeout={handleTimeout}
          />

          {/* Board Container - Responsive Height */}
          <div className="relative w-full aspect-square max-h-[60vh] lg:max-h-[70vh] shadow-2xl rounded-lg overflow-hidden border-2 border-slate-800 bg-slate-900 mx-auto">
            <Chessboard2D
              fen={fen}
              orientation={orientation}
              onSquareClick={onSquareClick}
              customSquareStyles={optionSquares}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={handleResign} disabled={gameData.status !== 'active'} className="bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition border border-slate-700 hover:border-red-500/50 disabled:opacity-50 text-xs">
              <Flag size={14} /> Rendir-se
            </button>

            {/* Botó Taules Dinàmic */}
            {drawOffer && drawOffer !== orientation ? (
              <div className="flex gap-2">
                <button onClick={handleAcceptDraw} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition animate-pulse text-xs">
                  <Handshake size={14} /> Acceptar
                </button>
                <button onClick={handleDeclineDraw} className="w-10 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center transition border border-slate-700">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleOfferDraw}
                disabled={gameData.status !== 'active' || drawOffer === orientation}
                className={`bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition border border-slate-700 disabled:opacity-50 text-xs ${drawOffer === orientation ? 'opacity-50 cursor-wait' : ''}`}
              >
                <Handshake size={14} /> {drawOffer === orientation ? 'Oferta enviada...' : 'Oferir Taules'}
              </button>
            )}
          </div>

          {/* MODAL GAME OVER */}
          {gameData.status === 'finished' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-300">
                <h2 className="text-2xl font-bold text-white mb-1">Partida Finalitzada</h2>
                <p className="text-lg text-amber-400 font-bold mb-4">{status.replace('Partida Finalitzada: ', '')}</p>

                <div className="flex flex-col gap-2">
                  <button onClick={handleRematch} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/50 text-sm">
                    <RotateCw size={18} /> Revenja
                  </button>
                  <button onClick={goToAnalysis} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition border border-slate-700 text-sm">
                    <Search size={18} /> Analitzar Partida
                  </button>
                  <button onClick={() => router.push('/lobby')} className="w-full text-slate-400 hover:text-white py-2 text-xs transition">
                    Tornar al Lobby
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DRETA: Info, Xat, Historial */}
        <div className="w-full lg:w-80 flex flex-col gap-2 h-full lg:h-auto lg:max-h-[80vh] overflow-hidden">

          {/* Oponent */}
          <div className="bg-slate-800 p-2 rounded-lg flex items-center gap-3 border border-slate-700 opacity-90 shrink-0">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold shadow-inner text-xs">
              {orientation === 'white' ? 'B' : 'W'}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{orientation === 'white' ? players.black : players.white}</p>
              <p className="text-[10px] text-slate-400">Oponent</p>
            </div>
          </div>

          {/* Historial */}
          <div className="flex-1 min-h-0 bg-slate-900/50 rounded-lg overflow-hidden">
            <MoveHistory history={game.history()} />
          </div>

          {/* Xat */}
          <div className="h-32 lg:h-48 shrink-0">
            <ChatBox gameId={id as string} userId={user.id} />
          </div>

          {/* Tu */}
          <div className="bg-slate-800 p-2 rounded-lg flex items-center gap-3 border border-indigo-500/30 shadow-lg shadow-indigo-900/20 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shadow-inner text-xs">
              {orientation === 'white' ? 'W' : 'B'}
            </div>
            <div>
              <p className="font-bold text-white text-sm">{orientation === 'white' ? players.white : players.black} (Tu)</p>
              <p className="text-[10px] text-emerald-400">En línia</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

