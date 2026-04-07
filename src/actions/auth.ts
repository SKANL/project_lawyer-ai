'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getLocale } from 'next-intl/server';

// ── Tipos ─────────────────────────────────────────────────────

export type AuthActionResult = {
  error?: string;
  success?: boolean;
};

// ── Schemas ───────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  redirectTo: z.string().optional(),
});

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// ── Actions (firma compatible con useActionState) ─────────────

/**
 * Inicia sesión. Signature: (prevState, formData) para useActionState.
 */
export async function loginAction(
  _prevState: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const locale = await getLocale();
  const supabase = await createClient();

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    redirectTo: formData.get('redirectTo'),
  });

  if (!parsed.success) {
    return { error: 'Datos inválidos' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : 'Ocurrió un error al iniciar sesión',
    };
  }

  revalidatePath('/', 'layout');
  redirect(`/${locale}${parsed.data.redirectTo ?? '/dashboard'}`);
}

/**
 * Registra un nuevo usuario. Signature compatible con useActionState.
 */
export async function registerAction(
  _prevState: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const locale = await getLocale();
  const supabase = await createClient();

  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    return {
      error: error.message.includes('already registered')
        ? 'Este correo ya está registrado'
        : 'Ocurrió un error al crear la cuenta',
    };
  }

  revalidatePath('/', 'layout');
  redirect(`/${locale}/onboarding`);
}

/**
 * Envía email de recuperación. Signature compatible con useActionState.
 */
export async function forgotPasswordAction(
  _prevState: AuthActionResult | undefined,
  formData: FormData,
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) return { error: 'Correo inválido' };

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/auth/reset-password`,
  });

  if (error) return { error: 'Ocurrió un error al enviar el correo' };
  return { success: true };
}

/**
 * Cierra sesión.
 */
export async function logoutAction(): Promise<void> {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(`/${locale}/auth/login`);
}
