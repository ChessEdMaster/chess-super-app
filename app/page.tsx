'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Users, PlayCircle, Lock, Gem, Coins, Star, Swords, Zap, Timer, Turtle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import WelcomePage from './welcome/page';

export default function Home() {
  const { user, loading } = useAuth();
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [seasonId, setSeasonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // 2. Fetch Active Season
        const { data: seasonData } = await supabase
          .from('league_seasons')
          .select('id')
          .eq('active', true)
          .single();

        if (seasonData) {
          setSeasonId(seasonData.id);
          // 3. Fetch Progress
          const { data: progressData } = await supabase
            .from('league_progress')
            .select('*')
            .eq('user_id', user.id)
            .eq('season_id', seasonData.id);
          setProgress(progressData || []);
        }
      }
    };
    if (!loading) fetchData();
  }, [user, loading, supabase]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Carregant...</div>;
  }

  if (!user) {
    return <WelcomePage />;
  }

  const getModeStats = (mode: string) => {
    const prog = progress.find(p => p.mode === mode);
    const elo = profile ? profile[`elo_${mode}`] : 1200;
    const points = prog ? prog.seasonal_points : 0;
    const qualified = prog ? prog.is_qualified : false;
    return { elo, points, qualified };
  };

  const bulletStats = getModeStats('bullet');
  const blitzStats = getModeStats('blitz');
  const rapidStats = getModeStats('rapid');

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
          <span className="font-bold text-sm text-blue-200">Temporada {seasonId || '...'}</span>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 rounded-full px-3 py-1.5 shadow-lg">
            <Coins size={16} className="text-amber-400" fill="#fbbf24" />
            <span className="font-bold text-sm text-amber-100">2,450</span>
          </div>
        </div>
      </div>

      {/* Main Lobby Content */}
      <main className="flex flex-col items-center justify-center mt-8 relative z-10 px-4 w-full max-w-4xl mx-auto">

        {/* Seasonal Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
          {/* Bullet */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={64} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-yellow-400" size={20} />
              <h3 className="font-bold text-slate-300">Bullet</h3>
            </div>
            {bulletStats.qualified ? (
              <div>
                <div className="text-2xl font-black text-white">{bulletStats.elo}</div>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Classificat (Pro)</div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Punts de Lliga</span>
                  <span>{bulletStats.points} / 1000</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min(100, (bulletStats.points / 1000) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Blitz */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Timer size={64} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Timer className="text-blue-400" size={20} />
              <h3 className="font-bold text-slate-300">Blitz</h3>
            </div>
            {blitzStats.qualified ? (
              <div>
                <div className="text-2xl font-black text-white">{blitzStats.elo}</div>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Classificat (Pro)</div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Punts de Lliga</span>
                  <span>{blitzStats.points} / 1000</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(100, (blitzStats.points / 1000) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Rapid */}
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Turtle size={64} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Turtle className="text-green-400" size={20} />
              <h3 className="font-bold text-slate-300">Rapid</h3>
            </div>
            {rapidStats.qualified ? (
              <div>
                <div className="text-2xl font-black text-white">{rapidStats.elo}</div>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Classificat (Pro)</div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Punts de Lliga</span>
                  <span>{rapidStats.points} / 1000</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.min(100, (rapidStats.points / 1000) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Play Button */}
        <div className="mt-4 w-full max-w-xs">
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