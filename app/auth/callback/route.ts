import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options });
                    },
                },
            }
        );

        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.redirect(`${origin}/login`);
            }

            // Check if user profile exists
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            // We need to know the intent (login vs register)
            // Since we can't easily read localStorage from server, we have to rely on profile existence logic.
            // If profile exists -> It's a login (or re-login).
            // If profile does NOT exist -> It's a registration.

            // However, the requirement is: "if a user tries to login with google and is not registered, redirect to registration page".
            // This implies we need to know if they *intended* to login.
            // But OAuth flow is the same.
            // Let's assume:
            // 1. If profile exists -> Allow access.
            // 2. If profile does NOT exist -> Redirect to a page that says "Completing registration..." or similar.
            //    But wait, the user said: "if not registered, redirect to registration page".
            //    So if no profile, we redirect to /register?error=not_registered or similar, effectively logging them out?
            //    Or we can just create the profile automatically (which is what usually happens).

            // The user specifically said: "A partir d'ara no s'ha de poder iniciar sessió si no t'has registrar".
            // This usually means we want to block "Login" if account doesn't exist.
            // But with Google Sign In, "Register" and "Login" are the same button usually.
            // The distinction is only in the UI text "Login with Google" vs "Register with Google".

            // Since we can't read the client-side intent here easily without state param (which Supabase handles),
            // we will use a client-side check on the destination page or an intermediate page.
            // BUT, we can check if profile exists.

            // If profile exists:
            //    - Redirect to /profile (for normal users) or / (for SuperAdmin).
            // If profile does NOT exist:
            //    - This is a new user.
            //    - We should probably redirect them to a "finish registration" page or back to register with a message.
            //    - However, standard OAuth flow usually auto-registers.
            //    - Let's redirect to a client-side page that checks the 'auth_intent' from localStorage.

            return NextResponse.redirect(`${origin}/auth/verify`);
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
