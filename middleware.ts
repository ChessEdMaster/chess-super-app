import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission, type AppRole } from '@/lib/rbac';

const intlMiddleware = createMiddleware({
  locales: ['en', 'es', 'ca'],
  defaultLocale: 'ca'
});

export default async function middleware(request: NextRequest) {
  // 1. Run Intl Middleware to handle locale redirects/rewrites
  const response = intlMiddleware(request);

  // 2. Initialize Supabase for Auth checks
  // We pass the response from intlMiddleware so we can append cookies to it
  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
          cookies: {
              getAll() { return request.cookies.getAll() },
              setAll(cookiesToSet) {
                  cookiesToSet.forEach(({ name, value, options }) => {
                      request.cookies.set({ name, value, ...options });
                      response.cookies.set({ name, value, ...options });
                  });
              },
          },
      }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Resolve role
  let role: AppRole | string | undefined = user?.app_metadata?.app_role;

  // --- Admin Route Protection ---
  if (request.nextUrl.pathname.includes('/admin')) { // Simple check, careful with localized paths like /en/admin
      // Fallback: fetch role from DB if not in JWT
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
              // Silently fail
          }
      }

      if (!hasPermission(role, 'admin.all')) {
          return NextResponse.redirect(new URL('/', request.url));
      }
  }

  // --- Role-based Landing Page Redirects ---
  // Only redirect if at root (or localized root)
  // next-intl might have already redirected '/' to '/ca'.
  // We check if the pathname is one of the locales or root
  const pathname = request.nextUrl.pathname;
  const isRoot = pathname === '/' || pathname === '/en' || pathname === '/es' || pathname === '/ca';

  if (isRoot && role) {
      if (role === 'Mentor' || role === 'Monitor') {
          return NextResponse.redirect(new URL('/mentor/dashboard', request.url));
      }
      if (role === 'Hero' || role === 'Student') {
          // Keep locale if present?
          // If we redirect to '/academy', next-intl will handle the locale if we don't include it?
          // Better to redirect to a non-localized path and let next-intl handle it, OR usage localized path.
          // Simple approach:
          return NextResponse.redirect(new URL('/academy', request.url));
      }
  }

  return response;
}

export const config = {
  // Matcher ignoring assets/api
  matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};
