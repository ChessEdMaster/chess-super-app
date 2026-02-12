import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasPermission, type AppRole } from '@/lib/rbac'

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set({ name, value, ...options });
                    });
                    response = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set({ name, value, ...options });
                    });
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Resolve role from JWT metadata or DB fallback
    let role: AppRole | string | undefined = user?.app_metadata?.app_role;

    // --- Admin Route Protection ---
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Fallback: fetch role from DB if not in JWT metadata
        if (!role && user) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role_id, app_roles!inner(name)')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const appRoles = profile.app_roles as unknown as { name: string } | null;
                    role = appRoles?.name;
                }
            } catch {
                // Silently fail — role stays undefined, access denied
            }
        }

        if (!hasPermission(role, 'admin.all')) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // --- Role-based Landing Page Redirects ---
    const pathname = request.nextUrl.pathname;

    if (pathname === '/' && role) {
        // Mentor → Mentor dashboard
        if (role === 'Mentor' || role === 'Monitor') {
            return NextResponse.redirect(new URL('/mentor/dashboard', request.url))
        }
        // Hero (student) → Academy
        if (role === 'Hero' || role === 'Student') {
            return NextResponse.redirect(new URL('/academy', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
