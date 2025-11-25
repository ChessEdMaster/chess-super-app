import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasPermission } from '@/lib/rbac'

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

    // Debug logging
    if (request.nextUrl.pathname.startsWith('/admin')) {
        console.log('[Middleware Debug] Request to /admin');
        console.log('[Middleware Debug] User found:', !!user);
        console.log('[Middleware Debug] App Metadata:', user?.app_metadata);
        console.log('[Middleware Debug] Role from metadata:', user?.app_metadata?.app_role);
    }

    // Obtenir el rol de les metadades de l'usuari (injectat pel trigger SQL)
    let role = user?.app_metadata?.app_role as any;

    // 1. Protecció de Rutes d'Administració (només SuperAdmin)
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Fallback: Si no trobem el rol a les metadades, el busquem a la base de dades
        // Això és més segur i robust contra problemes de sincronització de JWT
        if (!role && user) {
            console.log('[Middleware] Role not in metadata, fetching from DB...');
            const { data: profile } = await supabase
                .from('profiles')
                .select(`
                    role_id,
                    app_roles ( name )
                `)
                .eq('id', user.id)
                .single();

            // @ts-ignore
            role = profile?.app_roles?.name;
            console.log('[Middleware] Role fetched from DB:', role);
        }

        // CRÍTICO: Comprovar que el rol té permís d'admin
        const allowed = hasPermission(role, 'admin.all');

        if (!allowed) {
            console.log('[Middleware] Accés denegat a /admin. Rol:', role, 'User ID:', user?.id);
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    // 2. Protecció de Rutes de Clubs (Gestió)
    // ELIMINAT: Deixem que el layout de clubs/manage faci la comprovació específica
    // perquè la comprovació ha de ser per club (owner/admin), no per rol global.

    // 3. Protecció de l'Acadèmia
    if (request.nextUrl.pathname.startsWith('/academy')) {
        if (!hasPermission(role, 'view.academy')) {
            // Opcional
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
