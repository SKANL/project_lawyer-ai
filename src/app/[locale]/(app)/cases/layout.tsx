import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/components-reusables/layout/app-sidebar';
import { DashboardHeader } from '@/components/components-reusables/layout/dashboard-header';

/**
 * Layout del área de Expedientes.
 * Comparte el shell principal de la aplicación.
 */
export default async function CasesLayout({
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

  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, org_id')
    .eq('id', user.id)
    .single();

  const { data: organization } = await supabase
    .from('organizations')
    .select('name, plan_tier')
    .eq('id', profile?.org_id ?? '')
    .single();

  async function signOut() {
    'use server';
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    const currentLocale = await getLocale();
    redirect(`/${currentLocale}/auth/login`);
  }

  return (
    <SidebarProvider>
      <AppSidebar
        locale={locale}
        user={{
          name: profile?.full_name ?? user.email ?? 'Usuario',
          email: user.email ?? '',
          avatarUrl: profile?.avatar_url ?? undefined,
        }}
        organization={{
          name: organization?.name ?? 'Mi Despacho',
          planTier: organization?.plan_tier ?? 'trial',
        }}
        onSignOut={signOut}
      />
      <SidebarInset>
        <DashboardHeader locale={locale} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
