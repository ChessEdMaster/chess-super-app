'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import Link from 'next/link';
import { ArrowLeft, Copy, Loader2, User } from 'lucide-react';

export default function OnlineGamePage() {
  const { id } = useParams();
  const { user } = useAuth();
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
          setOrientation('black');
          currentBlackId = user.id; // Actualitzem localment
        }
      } 
      // Si ja hi ha rival i sóc jo -> Sóc Negres
      else if (currentBlackId === user.id) {
        setOrientation('black');
      } 
      // Si ja està plena i no sóc ningú -> Espectador
      else {
        setOrientation('white'); // Espectador veu com blanques per defecte
        alert("Mode espectador");
      }

      // C. Actualitzar estat local
      setGameData(initialGame);
      setPlayers({
        white: initialGame.white?.username || 'Jugador 1',
        black: initialGame.black?.username || (currentBlackId ? 'Jugador 2' : 'Esperant rival...')
      });
      
      // Sincronitzar tauler
      const initialFen = initialGame.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const newGame = new Chess(initialFen);
      setGame(newGame);
      setFen(initialFen);
      updateStatus(newGame, initialGame);

      // D. Subscriure's a canvis (REALTIME)
      const channel = supabase
        .channel(`game_${id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${id}` }, (payload) => {
          const newData = payload.new;
          
          // Quan rebem un canvi des de la DB (l'altre ha mogut):
          const incomeGame = new Chess(newData.fen);
          setGame(incomeGame);
          setFen(newData.fen);
          setGameData(newData);
          
          // Si s'ha unit el jugador negre, actualitzem noms
          if (newData.black_player_id && !currentBlackId) {
             // Petita trampa: recarreguem pàgina per pillar el nom d'usuari fàcil, 
             // o fem un fetch extra. Per simplificar, actualitzem text:
             setPlayers(p => ({ ...p, black: 'Rival connectat!' }));
          }
          
          updateStatus(incomeGame, newData);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    };

    fetchAndSubscribe();
  }, [id, user, router]);

  // Helper per l'estat
  function updateStatus(chessInstance: Chess, dbData: any) {
    if (dbData.status === 'pending') {
      setStatus("Esperant que s'uneixi un rival...");
    } else if (chessInstance.isGameOver()) {
      setStatus("Partida Finalitzada");
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

    // Moviment vàlid localment -> Optimistic UI update
    setGame(gameCopy);
    setFen(gameCopy.fen());

    // Enviar a Supabase (en segon pla, sense bloquejar el retorn)
    let result = null;
    let status = 'active';
    
    if (gameCopy.isGameOver()) {
      status = 'finished';
      if (gameCopy.isCheckmate()) result = gameCopy.turn() === 'w' ? '0-1' : '1-0';
      else result = '1/2-1/2';
    }

    // Executar de forma asíncrona sense await
    (async () => {
      try {
        await supabase
          .from('games')
          .update({
            fen: gameCopy.fen(),
            pgn: gameCopy.pgn(),
            status: status,
            result: result
          })
          .eq('id', id);
      } catch (error) {
        console.error('Error actualitzant partida:', error);
      }
    })();

    return true;
  }

  if (!user || !isClient) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Carregant...
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
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <Link href="/lobby" className="text-slate-400 hover:text-white flex items-center gap-2">
          <ArrowLeft size={20} /> Sortir al Lobby
        </Link>
        <div className="bg-slate-900 px-4 py-2 rounded-full border border-slate-800 flex items-center gap-2 text-slate-300 text-sm">
          <span>ID: {id?.toString().slice(0,8)}...</span>
          <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="hover:text-white"><Copy size={14}/></button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center">
        
        {/* TAULER */}
        <div className="w-full max-w-[600px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-slate-800 bg-slate-900">
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

        {/* INFO */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          
          {/* Oponent */}
          <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 border border-slate-700 opacity-90">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold">
              {orientation === 'white' ? 'B' : 'W'}
            </div>
            <div>
              <p className="font-bold text-white">{orientation === 'white' ? players.black : players.white}</p>
              <p className="text-xs text-slate-400">Oponent</p>
            </div>
          </div>

          {/* Estat Central */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center flex-1 flex items-center justify-center">
             <div>
               <h2 className="text-2xl font-bold text-white mb-2">{status}</h2>
               {gameData?.status === 'pending' && (
                 <div className="flex justify-center mt-2">
                   <Loader2 className="animate-spin text-indigo-500" />
                 </div>
               )}
             </div>
          </div>

          {/* Tu */}
          <div className="bg-slate-800 p-4 rounded-xl flex items-center gap-3 border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
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

