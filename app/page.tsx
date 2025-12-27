'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import WelcomePage from './welcome/page';
import { LobbyView } from '@/components/lobby/LobbyView';
import { OnlineGameView } from '@/components/chess/OnlineGameView';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sword, Package } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeGameId, setActiveGameId] = useState<string | null>(searchParams.get('gameId'));

  useEffect(() => {
    const gameId = searchParams.get('gameId');
    if (gameId !== activeGameId) {
      setActiveGameId(gameId);
    }
  }, [searchParams, activeGameId]);

  const handleJoinGame = (id: string) => {
    setActiveGameId(id);
    // Update URL without full refresh to stay on home but mark the game
    const params = new URLSearchParams(searchParams.toString());
    params.set('gameId', id);
    router.push(`/?${params.toString()}`);
  };

  const handleExitGame = () => {
    setActiveGameId(null);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-pulse text-amber-500 font-black text-xl tracking-widest uppercase">
          Carregant ChessClans...
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(30,41,59,1)_0%,_rgba(2,6,23,1)_100%)]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/30 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-amber-600/20 blur-[100px] rounded-full" />
      </div>

      {/* Main UI Overlay */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Sword size={20} className="text-black" />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter">CHESSCLANS</h1>
          </div>

          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-xs font-black uppercase tracking-widest transition-colors ${!activeGameId ? 'text-amber-500' : 'text-zinc-500 hover:text-white'}`}
            >
              Arena
            </Link>
            <Link
              href="/features"
              className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-2"
            >
              <Package size={14} /> Features
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-500 tracking-widest uppercase">{user.user_metadata?.full_name || 'Warrior'}</span>
              <span className="text-xs font-mono font-bold text-amber-500">Lv. 1</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-amber-500/50 overflow-hidden bg-zinc-800">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-zinc-600">?</div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
          {activeGameId ? (
            <OnlineGameView
              gameId={activeGameId}
              user={user}
              onExit={handleExitGame}
            />
          ) : (
            <LobbyView
              user={user}
              onJoinGame={handleJoinGame}
            />
          )}
        </main>
      </div>
    </div>
  );
}