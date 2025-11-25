'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Users, PlayCircle, Lock, Gem, Coins, Star, Swords } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export default function Home() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const isSuperAdmin = role === 'SuperAdmin';

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push('/clubs');
    }
  }, [loading, isSuperAdmin, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Carregant perfil...</div>;
  }

  // If not superadmin, we show a locked screen briefly before redirect (or if redirect fails/is slow)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <Lock size={64} className="text-slate-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-300 mb-2">Zona de Batalla Bloquejada</h2>
          <p className="text-slate-400 mb-6">Uneix-te a un Club per desbloquejar funcionalitats.</p>
          <Link href="/clubs" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Anar als Clubs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Resources */}
      <div className="flex justify-between items-center p-4 pt-6 relative z-10">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-full px-4 py-1.5 shadow-lg">
          <div className="bg-blue-500 p-1 rounded-full">
            <Star size={12} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-sm text-blue-200">Nivell 12</span>
          <div className="w-16 h-2 bg-slate-800 rounded-full ml-2 overflow-hidden">
            <div className="h-full bg-blue-500 w-3/4" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-full px-3 py-1.5 shadow-lg">
            <Coins size={16} className="text-amber-400" fill="#fbbf24" />
            <span className="font-bold text-sm text-amber-100">2,450</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-full px-3 py-1.5 shadow-lg">
            <Gem size={16} className="text-emerald-400" fill="#34d399" />
            <span className="font-bold text-sm text-emerald-100">150</span>
          </div>
        </div>
      </div>

      {/* Main Lobby Content */}
      <main className="flex flex-col items-center justify-center mt-8 relative z-10 px-4">

        {/* Rank Badge */}
        <div className="mb-6 flex flex-col items-center animate-fade-in-up">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl rotate-3 flex items-center justify-center shadow-2xl shadow-indigo-500/30 border-4 border-slate-800 relative group cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=300&q=80')] bg-cover opacity-50 mix-blend-overlay rounded-2xl"></div>
            <Trophy size={64} className="text-white drop-shadow-md relative z-10" />
            <div className="absolute -bottom-4 bg-slate-900 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/50 uppercase tracking-wider">
              Mestre Tàctic
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mt-8 tracking-tight">GRANDMASTER</h1>
          <p className="text-slate-400 font-medium">Divisió Diamant III</p>
        </div>

        {/* Play Button */}
        <div className="mt-8 w-full max-w-xs">
          <Link href="/play">
            <button className="w-full group relative bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-900 font-black text-xl py-6 rounded-2xl shadow-[0_10px_0_rgb(180,83,9)] hover:shadow-[0_6px_0_rgb(180,83,9)] active:shadow-[0_2px_0_rgb(180,83,9)] active:translate-y-2 transition-all duration-150 flex items-center justify-center gap-3 uppercase tracking-wider border-t border-amber-200">
              <Swords className="w-8 h-8 group-hover:rotate-12 transition-transform" />
              <span>Batalla</span>
            </button>
          </Link>
          <p className="text-center text-slate-500 text-xs mt-4 font-medium uppercase tracking-widest">
            Partida Ràpida • 10 min
          </p>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-md">
          <Link href="/play/online" className="bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group">
            <div className="bg-indigo-500/20 p-3 rounded-xl group-hover:bg-indigo-500 group-hover:text-white text-indigo-400 transition-colors">
              <Users size={24} />
            </div>
            <span className="font-bold text-slate-300 text-sm">Amistosa</span>
          </Link>
          <Link href="/analysis" className="bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group">
            <div className="bg-emerald-500/20 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white text-emerald-400 transition-colors">
              <PlayCircle size={24} />
            </div>
            <span className="font-bold text-slate-300 text-sm">Entrenar</span>
          </Link>
        </div>

      </main>
    </div>
  );
}