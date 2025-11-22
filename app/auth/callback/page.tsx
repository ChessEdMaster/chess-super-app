'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase gestiona automàticament el callback i canvia la sessió
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Redirigir a la pàgina principal o a /play
          router.push('/play');
        } else {
          // Si no hi ha sessió, tornar al login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error en el callback:', error);
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-indigo-500" size={48} />
        <p className="text-slate-400">Comprovant autenticació...</p>
      </div>
    </div>
  );
}

