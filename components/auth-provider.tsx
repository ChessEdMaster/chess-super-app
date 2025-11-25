'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { AppRole, Permission, hasPermission } from '@/lib/rbac';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  loading: true,
  signInWithGoogle: async () => { },
  signOut: async () => { },
  checkPermission: () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const updateState = (session: Session | null) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    // Extreure el rol de les metadades (injectat pel trigger SQL)
    const appRole = currentUser?.app_metadata?.app_role as AppRole | undefined;
    setRole(appRole ?? 'Guest');

    setLoading(false);
  };

  useEffect(() => {
    // 1. Comprovar sessió inicial
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      updateState(session);
    };
    checkSession();

    // 2. Escoltar canvis en temps real (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateState(session);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent select_account',
        },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(role ?? undefined, permission);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signInWithGoogle, signOut, checkPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

// Hook específic per a RBAC
export const useRBAC = () => {
  const { role, checkPermission, loading } = useAuth();
  return { role, checkPermission, loading };
};