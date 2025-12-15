'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function VerifyAuthPage() {
    const router = useRouter();
    const { signOut } = useAuth();
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
            let { data: profile } = await supabase
                .from('profiles')
                .select('id, role:app_roles(name)')
                .eq('id', currentUser.id)
                .single();

            // If profile doesn't exist, we might need to wait for the trigger or create it manually?
            // The trigger `handle_new_user` handles automatic profile creation on `auth.users` insert.
            // But since we just committed a fix for it, it should work.
            // However, we should be resilient.

            // Retry fetching profile a few times if it's missing (race condition)
            if (!profile) {
                for (let i = 0; i < 3; i++) {
                    await new Promise(r => setTimeout(r, 1000));
                    const { data: refetchedProfile } = await supabase
                        .from('profiles')
                        .select('id, role:app_roles(name)')
                        .eq('id', currentUser.id)
                        .single();
                    if (refetchedProfile) {
                        profile = refetchedProfile;
                        break;
                    }
                }
            }

            const profileExists = !!profile;

            if (intent === 'login') {
                if (!profileExists) {
                    await signOut();
                    alert('Aquest compte no està registrat. Si us plau, registra\'t primer.');
                    router.push('/register');
                    return;
                }
            }

            // If it's a new registration (or successful login), proceed.
            // If profile still doesn't exist after retries, something is wrong with the DB trigger, but we'll try to let them in or show an error.
            if (!profileExists) {
                console.error("Profile not found after registration.");
                // Ideally show error or try to create it manually here as fallback?
                // For now, let's redirect to Welcome which might handle missing profile setup.
                router.push('/welcome');
                return;
            }

            // Redirect based on role
            // Careful: 'role' in profile might be an object due to join, or we use metadata
            // Better use the profile data we just fetched if possible, or metadata
            // profile.role might be { name: 'SuperAdmin' }

            const roleName = (profile as any)?.role?.name || currentUser.app_metadata?.app_role;

            if (roleName === 'SuperAdmin') {
                router.push('/');
            } else {
                if (intent === 'register') {
                    router.push('/welcome');
                } else {
                    router.push('/');
                }
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
