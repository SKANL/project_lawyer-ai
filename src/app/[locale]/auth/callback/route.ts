import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Callback de Supabase Auth — intercambia el code por una sesión.
 * Supabase redirige aquí después de confirmar email o reset de password.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Detectar locale desde la URL de origen
      const locale = origin.includes('/en') ? 'en' : 'es';
      return NextResponse.redirect(`${origin}/${locale}${next}`);
    }
  }

  // Error o code ausente — redirigir a login
  return NextResponse.redirect(`${origin}/es/auth/login?error=auth_callback_failed`);
}
