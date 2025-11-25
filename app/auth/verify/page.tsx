'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function VerifyAuthPage() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [status, setStatus] = useState('Verificant...');

    useEffect(() => {
        const verify = async () => {
            // Wait for auth to load
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push('/login');
                return;
            }

            const intent = localStorage.getItem('auth_intent');
            const currentUser = session.user;

            // Check if profile exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', currentUser.id)
                .single();

            const profileExists = !!profile;

            if (intent === 'login') {
                if (!profileExists) {
                    // User tried to login but has no profile -> Block and redirect to register
                    await signOut();
                    alert('Aquest compte no està registrat. Si us plau, registra\'t primer.');
                    router.push('/register');
                    return;
                }
            } else if (intent === 'register') {
                if (!profileExists) {
                    // Create profile if it doesn't exist (Registration flow)
                    // Usually handled by database triggers, but if not, we might need to wait or do it here.
                    // Assuming triggers handle it or it's already done.
                    // If triggers are used, profile might already exist by now.
                }
                // If profile exists, it's fine, maybe they registered before.
            }

            // If we are here, access is granted.
            // Redirect based on role.
            const role = currentUser.app_metadata?.app_role;

            if (role === 'SuperAdmin') {
                router.push('/');
            } else {
                // Normal users go to profile
                router.push('/profile');
            }
        };

        verify();
    }, [router, signOut]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="animate-spin mx-auto mb-4 text-indigo-500" size={48} />
                <p className="text-slate-400">{status}</p>
            </div>
        </div>
    );
}
