'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useRBAC } from '@/components/auth-provider';
import { Trophy, LogOut, User, Loader2, Shield } from 'lucide-react';
import { CartButton } from '@/components/shop/cart-button';

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const { checkPermission } = useRBAC();

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
              <Link href="/profile" className="flex items-center gap-2 text-slate-300 hover:text-white transition bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700 hover:border-indigo-500/50">
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                    alt="Avatar"
                  />
                ) : (
                  <User size={18} />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {user.user_metadata?.full_name || 'Perfil'}
                </span>
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

