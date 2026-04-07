import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ClientsClient } from './clients-client';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('clients');
  return { title: t('title') };
}

/**
 * ClientsPage — Punto de entrada del CRM.
 * Carga inicial de datos desde Supabase (Server Side).
 */
export default async function ClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // 1. Verificar Autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  // 2. Obtener Perfil y Organización
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile?.org_id) redirect(`/${locale}/onboarding`);

  // 3. Cargar Clientes iniciales
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('full_name');

  return (
    <ClientsClient 
      initialClients={(clients as any) || []} 
      orgId={profile.org_id} 
      userId={user.id}
    />
  );
}
