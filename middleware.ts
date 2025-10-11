import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/reading', '/payment', '/admin'];

// Admin-only routes
const adminRoutes = ['/admin'];

// Public routes that don't require auth
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/guest',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: 'sr',
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  // First, run the i18n middleware
  const intlResponse = intlMiddleware(request);

  // Get the pathname
  const { pathname } = request.nextUrl;

  // Extract locale and path without locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in pathname, let intl middleware handle it
  if (!pathnameHasLocale) {
    return intlResponse;
  }

  // Extract the locale
  const locale = pathname.split('/')[1];

  // Get path without locale prefix
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathWithoutLocale === route || pathWithoutLocale.startsWith(route)
  );

  // If public route, continue with i18n response
  if (isPublicRoute) {
    return intlResponse;
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  const isAdminRoute = adminRoutes.some((route) =>
    pathWithoutLocale.startsWith(route)
  );

  // If not a protected route, continue
  if (!isProtectedRoute && !isAdminRoute) {
    return intlResponse;
  }

  // Create Supabase client for middleware
  const response = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user and route is protected, redirect to signin
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL(`/${locale}/auth/signin`, request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If admin route, check if user is admin
  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      // Not an admin, redirect to dashboard
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }
  }

  // User is authenticated or route is public
  return intlResponse;
}

export const config = {
  matcher: ['/', '/(sr|en|tr)/:path*'],
};
