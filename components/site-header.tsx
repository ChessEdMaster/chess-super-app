'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useRBAC } from '@/components/auth-provider';
import { Trophy, LogOut, User, Loader2, Shield } from 'lucide-react';
import { CartButton } from '@/components/shop/cart-button';
import { usePlayerStore } from '@/lib/store/player-store';

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const { checkPermission } = useRBAC();
  const { profile } = usePlayerStore();

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* LOGO - Sempre et porta a l'inici */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <Trophy className="text-indigo-500" size={28} />
          <span className="text-xl font-bold text-white tracking-tight">ChessHub</span>
        </Link>

        {/* NAVIGATION */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/shop" className="text-slate-300 hover:text-emerald-400 transition font-medium">
            Botiga
          </Link>
          <Link href="/academy" className="text-slate-300 hover:text-indigo-400 transition font-medium">
            Acadèmia
          </Link>
          <Link href="/play" className="text-slate-300 hover:text-purple-400 transition font-medium">
            Jugar
          </Link>
          {checkPermission('view.clubs') && (
            <Link href="/clubs" className="text-slate-300 hover:text-purple-400 transition font-medium">
              Clubs
            </Link>
          )}
        </nav>

        {/* ZONA D'USUARI */}
        <div className="flex items-center gap-4">
          {/* Cart Button - Always visible */}
          <CartButton />

          {loading ? (
            <Loader2 className="animate-spin text-slate-500" size={20} />
          ) : user ? (
            <>
              {/* Només visible si estàs loguejat */}
              <Link href="/profile" className="flex items-center gap-3 text-slate-300 hover:text-white transition bg-slate-800/50 pl-2 pr-4 py-1.5 rounded-full border border-slate-700 hover:border-indigo-500/50 group">
                <div className="relative">
                  {user.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border-2 border-slate-800 group-hover:border-indigo-500 transition"
                      alt="Avatar"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-800 group-hover:border-indigo-500 transition">
                      <User size={16} />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 rounded-full border border-slate-900">
                    {profile.level}
                  </div>
                </div>

                <div className="flex flex-col leading-none">
                  <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition">
                    {profile.username || user.user_metadata?.full_name || 'Jugador'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    LVL {profile.level}
                  </span>
                </div>
              </Link>

              <button
                onClick={signOut}
                className="text-slate-400 hover:text-red-400 transition p-2 hover:bg-slate-800 rounded-full"
                title="Tancar Sessió"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            /* Si no estàs loguejat, només veus botó d'Entrar */
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-lg shadow-indigo-900/20">
                Iniciar Sessió
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

