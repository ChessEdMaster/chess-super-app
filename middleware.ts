import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission, AppRole, Permission } from '@/lib/rbac';

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // 1. PROTECTED ROUTES DEFINITION
    const protectedRoutes = [
        { path: '/clubs/manage', permission: 'manage.club' as Permission },
        { path: '/admin', permission: 'admin.all' as Permission },
    ];

    const currentPath = request.nextUrl.pathname;

    // 2. CHECK PERMISSIONS
    for (const route of protectedRoutes) {
        if (currentPath.startsWith(route.path)) {
            if (!user) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            const role = user.app_metadata?.app_role as AppRole | undefined;

            // If user doesn't have role or permission, redirect to home or unauthorized
            if (!role || !hasPermission(role, route.permission)) {
                console.log(`[Middleware] Access denied for ${user.email} to ${currentPath}. Role: ${role}`);
                return NextResponse.redirect(new URL('/', request.url));
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
