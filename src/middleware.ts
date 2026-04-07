import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from '@/i18n/routing';

/** Rutas que NO requieren autenticación */
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/callback',
  '/auth/confirm',
  // Portal público del cliente (acceso por token)
  '/portal',
];

/** Rutas que redirigen al dashboard si el usuario YA está logueado */
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

/** Middleware de next-intl para routing i18n */
const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extraer el locale del path (ej: /es/dashboard → /dashboard)
  const pathnameWithoutLocale = pathname.replace(/^\/(es|en)/, '') || '/';

  // ── Verificar si la ruta es pública ────────────────────────────
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) =>
      pathnameWithoutLocale === route ||
      pathnameWithoutLocale.startsWith(route + '/'),
  );

  const isAuthRoute = AUTH_ROUTES.some(
    (route) =>
      pathnameWithoutLocale === route ||
      pathnameWithoutLocale.startsWith(route + '/'),
  );

  // ── Crear response base con i18n ────────────────────────────────
  const intlResponse = intlMiddleware(request);

  // ── Verificar sesión de Supabase ────────────────────────────────
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
            request.cookies.set(name, value),
          );
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const locale = pathname.startsWith('/en') ? 'en' : 'es';

  // ── Lógica de redirección ───────────────────────────────────────

  // Si el usuario YA está logueado y visita una ruta de auth → dashboard
  if (session && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Si el usuario NO está logueado y visita una ruta protegida → login
  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth/login`;
    // Guardar la URL a la que quería ir para redirigir después del login
    url.searchParams.set('redirectTo', pathnameWithoutLocale);
    return NextResponse.redirect(url);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    // Excluir archivos estáticos y API routes de Next.js
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
