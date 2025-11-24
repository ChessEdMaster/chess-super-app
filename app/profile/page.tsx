'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar, User, Swords, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  interface GameRecord {
    id: string;
    white_player_id: string | null;
    black_player_id: string | null;
    result: string;
    created_at: string;
    white?: { username: string };
    black?: { username: string };
  }

  const [games, setGames] = useState<GameRecord[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // --- PROTECCIÓ DE RUTA ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchGames() {
      if (!user) return;

      // Busquem partides on l'usuari sigui blanques O negres
      // I fem join amb profiles per obtenir els noms
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          white:white_player_id(username),
          black:black_player_id(username)
        `)
        .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error carregant partides:', error);
      } else {
        setGames(data || []);
      }
      setLoadingGames(false);
    }

    if (user) fetchGames();
  }, [user]);

  // Mentres comprovem l'usuari, mostrem càrrega
  if (authLoading || !user || loadingGames) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" /> Verificant accés...
      </div>
    );
  }

  // Càlcul d'estadístiques simples
  const totalGames = games.length;
  const wins = games.filter(g =>
    (g.white_player_id === user.id && g.result === '1-0') ||
    (g.black_player_id === user.id && g.result === '0-1')
  ).length;
  const losses = games.filter(g =>
    (g.white_player_id === user.id && g.result === '0-1') ||
    (g.black_player_id === user.id && g.result === '1-0')
  ).length;
  const draws = totalGames - wins - losses;

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-sans text-slate-200">
      <div className="max-w-4xl mx-auto">

        {/* Capçalera */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="text-indigo-500" /> El teu Perfil
          </h1>
        </div>

        {/* Targeta d'Usuari */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-xl">
          <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-inner overflow-hidden">
            {user.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              user.email?.[0].toUpperCase()
            )}
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-2xl font-bold text-white">{user.user_metadata?.full_name || 'Jugador'}</h2>
            <p className="text-slate-400 mb-4">{user.email}</p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <span className="block text-xs text-slate-500 uppercase font-bold">Partides</span>
                <span className="text-xl font-bold text-white">{totalGames}</span>
              </div>
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <span className="block text-xs text-slate-500 uppercase font-bold">Victòries</span>
                <span className="text-xl font-bold text-emerald-400">{wins}</span>
              </div>
              <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                <span className="block text-xs text-slate-500 uppercase font-bold">Ràting</span>
                <span className="text-xl font-bold text-amber-400">1200</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Partides */}
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Swords size={20} className="text-slate-400" /> Historial Recent
        </h3>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          {games.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Encara no has jugat cap partida.
              <Link href="/play" className="text-indigo-400 hover:underline ml-1">Juga ara!</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {games.map((game) => {
                const isWhite = game.white_player_id === user.id;
                // Determinar nom del rival
                let opponentName = 'Stockfish (CPU)';
                if (isWhite) {
                  if (game.black_player_id) opponentName = game.black?.username || 'Jugador 2';
                } else {
                  if (game.white_player_id) opponentName = game.white?.username || 'Jugador 1';
                }

                // Determinem si has guanyat tu
                let outcomeColor = 'text-slate-400';
                let outcomeLabel = 'Taules';

                if (game.result === '1/2-1/2') {
                  outcomeLabel = '🤝 Taules';
                  outcomeColor = 'text-slate-400';
                } else if ((isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1')) {
                  outcomeLabel = '🏆 Victòria';
                  outcomeColor = 'text-emerald-400';
                } else {
                  outcomeLabel = '❌ Derrota';
                  outcomeColor = 'text-red-400';
                }

                return (
                  <div key={game.id} className="p-4 hover:bg-slate-800/50 transition flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-lg ${isWhite ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>
                        {isWhite ? 'W' : 'B'}
                      </div>
                      <div>
                        <p className="font-bold text-white">vs {opponentName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={12} /> {new Date(game.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className={`font-bold ${outcomeColor}`}>{outcomeLabel}</p>
                        <p className="text-xs text-slate-600 font-mono">{game.result}</p>
                      </div>
                      {/* Aquí en el futur posarem un botó "Veure" per reproduir el PGN */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

