'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, User, Clock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

export default function LobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingGames, setPendingGames] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  // 1. Carregar partides pendents i subscriure's a canvis
  useEffect(() => {
    const fetchGames = async () => {
      const { data } = await supabase
        .from('games')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (data) {
        // Obtenir noms d'usuari per cada partida
        const gamesWithUsers = await Promise.all(
          data.map(async (game) => {
            if (game.white_player_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', game.white_player_id)
                .single();
              return { ...game, white: profile };
            }
            return game;
          })
        );
        setPendingGames(gamesWithUsers);
      }
    };

    fetchGames();

    // Màgia Realtime: Si algú crea una partida, apareix automàticament
    const channel = supabase
      .channel('lobby_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        fetchGames(); // Recarreguem la llista si hi ha canvis
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // 2. Crear una nova partida
  const createGame = async () => {
    if (!user) return router.push('/login');
    setCreating(true);
    
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          white_player_id: user.id,
          black_player_id: null, // Esperem rival
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Posició inicial
          pgn: '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      if (data) router.push(`/play/online/${data.id}`); // Redirigim a la sala de joc
      
    } catch (error) {
      console.error(error);
      alert('Error creant partida');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-200 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} /> Inici
          </Link>
          <h1 className="text-3xl font-bold text-white">Sala d'Espera (Lobby)</h1>
        </div>

        {/* Botó Crear */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Vols jugar una partida?</h2>
            <p className="text-indigo-300 text-sm">Crea una sala i espera que algú s'uneixi.</p>
          </div>
          <button 
            onClick={createGame} 
            disabled={creating}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-900/50"
          >
            {creating ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
            Crear Partida
          </button>
        </div>

        {/* Llista de Partides */}
        <h3 className="text-lg font-bold text-slate-400 mb-4 uppercase tracking-wider text-sm">Partides Disponibles</h3>
        
        <div className="grid gap-4">
          {pendingGames.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
              <p className="text-slate-500">No hi ha partides pendents.</p>
              <p className="text-slate-600 text-sm">Sigues el primer en crear-ne una!</p>
            </div>
          ) : (
            pendingGames.map((game) => (
              <div key={game.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-indigo-500/50 transition group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl font-bold text-white border border-slate-700">
                    {game.white?.avatar_url ? (
                      <img src={game.white.avatar_url} className="w-full h-full rounded-full" alt="Avatar" />
                    ) : (
                      game.white?.username?.[0]?.toUpperCase() || <User />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{game.white?.username || 'Anònim'}</p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Esperant rival
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-slate-400 text-xs flex items-center gap-1 justify-end">
                      <Clock size={12} /> {new Date(game.created_at).toLocaleTimeString()}
                    </p>
                    <p className="text-slate-500 text-xs">Clàssica • 10 min</p>
                  </div>
                  <Link href={`/play/online/${game.id}`}>
                    <button className="bg-slate-800 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition group-hover:shadow-lg">
                      Jugar <ArrowRight size={16} />
                    </button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

