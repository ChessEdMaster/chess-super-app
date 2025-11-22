'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider'; // Utilitzem el context global
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // Deleguem la lògica al Provider

  useEffect(() => {
    // Només prenem decisions quan el Provider ha acabat de carregar
    if (!loading) {
      if (user) {
        router.push('/play');
      } else {
        // Opcional: Esperar un petit timeout per si el token està sent processat
        // però generalment el AuthProvider ja ho gestiona.
        const checkAndRedirect = setTimeout(() => {
             router.push('/login');
        }, 1000);
        return () => clearTimeout(checkAndRedirect);
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-indigo-500" size={48} />
        <p className="text-slate-400">Finalitzant autenticació...</p>
      </div>
    </div>
  );
}