import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

/**
 * Verifica que el usuario tenga sesión activa.
 * Si no tiene sesión, redirige al login.
 * Si no completó el onboarding, redirige al wizard.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return {
    title: t('title'),
    description: t('overview'),
  };
}

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  // Verificar si el onboarding fue completado
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  const hasOrg = !!profile?.org_id;

  if (!hasOrg) {
    redirect(`/${locale}/onboarding`);
  }

  return <>{children}</>;
}
