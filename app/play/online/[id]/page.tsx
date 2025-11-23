'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Copy, Loader2, Flag, Handshake } from 'lucide-react';
import { ChessClock } from '@/components/chess-clock';
import { ChatBox } from '@/components/chat-box';
import { MoveHistory } from '@/components/move-history';
import { playSound } from '@/lib/sounds';

export default function OnlineGamePage() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [gameData, setGameData] = useState<any>(null);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [status, setStatus] = useState('Carregant...');
  const [players, setPlayers] = useState({ white: '...', black: '...' });

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
      const { data: initialGame, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (initialGame) {
        // Obtenir perfils dels jugadors
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

      if (error || !initialGame) {
        alert("Partida no trobada");
        router.push('/lobby');
        return;
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
      setGameData(finalGameData);
      setPlayers({
        white: finalGameData.white?.username || user.user_metadata?.full_name || 'Jugador 1',
        black: finalGameData.black?.username || (currentBlackId ? 'Jugador 2' : 'Esperant rival...')
      });

      // Sincronitzar tauler
      const initialFen = finalGameData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const newGame = new Chess(initialFen);
      setGame(newGame);
      setFen(initialFen);
      updateStatus(newGame, finalGameData);

      // D. Subscriure's a canvis (REALTIME)
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
          if (incomeGame.fen() !== game.fen()) {
            if (incomeGame.isCheckmate()) playSound('game_end');
            else if (incomeGame.isCheck()) playSound('check');
            else if (incomeGame.history({ verbose: true }).pop()?.captured) playSound('capture');
            else playSound('move');
          }

          setGame(incomeGame);
          setFen(newData.fen || incomeGame.fen());
          setGameData(newData);

          updateStatus(incomeGame, newData);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    fetchAndSubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, router]);

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
  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
    // Validacions bàsiques
    if (!targetSquare) return false;
    if (gameData?.status === 'pending') return false;
    if (gameData?.status === 'finished') return false;
    if (game.turn() === 'w' && orientation === 'black') return false; // No és el teu torn
    if (game.turn() === 'b' && orientation === 'white') return false; // No és el teu torn

    const gameCopy = new Chess(game.fen());
    let move = null;
    try {
      move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
    } catch (e) { return false; }

    if (!move) return false;

    // Sons locals (optimistic)
    if (gameCopy.isCheckmate()) playSound('game_end');
    else if (gameCopy.isCheck()) playSound('check');
    else if (move.captured) playSound('capture');
    else playSound('move');
    return true;
  }

  const handleResign = async () => {
    if (!confirm("Estàs segur que vols rendir-te?")) return;

    const result = orientation === 'white' ? '0-1' : '1-0';
    await supabase.from('games').update({
      status: 'finished',
      result: result
    }).eq('id', id);
  };

  const handleDraw = () => {
    alert("Funcionalitat de taules properament!");
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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4">

      {/* Header Simplificat */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div className="bg-slate-900 px-4 py-2 rounded-full border border-slate-800 flex items-center gap-2 text-slate-300 text-sm">
          <span>ID: {id?.toString().slice(0, 8)}...</span>
          <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="hover:text-white"><Copy size={14} /></button>
        </div>
        <div className="text-white font-bold text-xl">{status}</div>
        <div className="w-[150px]"></div> {/* Spacer */}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl justify-center items-start">

        {/* COLUMNA ESQUERRA: Tauler i Rellotges */}
        <div className="flex flex-col gap-4 w-full max-w-[600px]">

          <ChessClock
            whiteTime={gameData.white_time || 600}
            blackTime={gameData.black_time || 600}
            turn={game.turn()}
            isActive={gameData.status === 'active'}
            onTimeout={handleTimeout}
          />

          <div className="relative w-full aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
            <Chessboard
              options={{
                id: `online-game-${id}`,
                position: fen,
                onPieceDrop: onDrop,
                boardOrientation: orientation,
                darkSquareStyle: { backgroundColor: '#779556' },
                lightSquareStyle: { backgroundColor: '#ebecd0' },
                animationDurationInMs: 200,
                allowDragging: gameData?.status === 'active' && !game.isGameOver(),
              }}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleResign} disabled={gameData.status !== 'active'} className="bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition border border-slate-700 hover:border-red-500/50 disabled:opacity-50">
              <Flag size={18} /> Rendir-se
            </button>
            <button onClick={handleDraw} disabled={gameData.status !== 'active'} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition border border-slate-700 disabled:opacity-50">
              <Handshake size={18} /> Oferir Taules
            </button>
          </div>
        </div>

        {/* COLUMNA DRETA: Info, Xat, Historial */}
        <div className="w-full lg:w-96 flex flex-col gap-4 h-[700px]">

          {/* Oponent */}
          <div className="bg-slate-800 p-3 rounded-xl flex items-center gap-3 border border-slate-700 opacity-90">
            <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center text-white font-bold shadow-inner">
              {orientation === 'white' ? 'B' : 'W'}
            </div>
            <div>
              <p className="font-bold text-white">{orientation === 'white' ? players.black : players.white}</p>
              <p className="text-xs text-slate-400">Oponent</p>
            </div>
          </div>

          {/* Historial */}
          <div className="flex-1 min-h-[200px]">
            <MoveHistory history={game.history()} />
          </div>

          {/* Xat */}
          <ChatBox gameId={id as string} userId={user.id} username={user.user_metadata?.full_name || 'Jo'} />

          {/* Tu */}
          <div className="bg-slate-800 p-3 rounded-xl flex items-center gap-3 border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
            <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shadow-inner">
              {orientation === 'white' ? 'W' : 'B'}
            </div>
            <div>
              <p className="font-bold text-white">{orientation === 'white' ? players.white : players.black} (Tu)</p>
              <p className="text-xs text-emerald-400">En línia</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

