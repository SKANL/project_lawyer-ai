import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { EmailOtpType } from '@supabase/supabase-js';

/**
 * Callback de Supabase Auth — intercambia el code/token_hash por una sesión.
 * Supabase redirige aquí después de confirmar email o reset de password.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';
  
  // Detectar locale desde la URL de origen o default
  const locale = origin.includes('/en') ? 'en' : 'es';

  const supabase = await createClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}/${locale}${next}`);
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/${locale}${next}`);
    }
  }

  // Error o code ausente — redirigir a login
  return NextResponse.redirect(`${origin}/${locale}/auth/login?error=auth_callback_failed`);
}
