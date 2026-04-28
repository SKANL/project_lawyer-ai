import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { CasesClient } from './cases-client';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation';

/**
 * CasesPage — Server Component para obtener datos iniciales de Expedientes y Clientes.
 */
export default async function CasesPage({
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

  // 3. Obtener expedientes con join de cliente
  const { data: casesData, error: casesError } = await supabase
    .from('cases')
    .select(`
      *,
      client:clients(full_name)
    `)
    .eq('org_id', profile.org_id)
    .order('updated_at', { ascending: false });

  // 4. Obtener lista de clientes para el formulario de creación
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('org_id', profile.org_id)
    .order('full_name');

  // 5. Obtener catálogo de materias legales con sus etapas procesales
  const { data: legalAreasData } = await supabase
    .from('legal_areas')
    .select('id, name, slug, display_order, legal_area_stages(id, name, slug, display_order, color, is_terminal)')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)
    .order('display_order');

  if (casesError) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-bold text-destructive">Error al cargar expedientes</h2>
        <p className="text-muted-foreground">{casesError.message}</p>
      </div>
    );
  }

  const cases = (casesData || []).map((c: any) => ({
    ...c,
    client: c.client || { full_name: 'Cliente no asignado' }
  }));

  const clients = (clientsData || []).map((cl: any) => ({
    id: cl.id,
    name: cl.full_name
  }));

  // Normalizar legal_areas: ordenar stages internos por display_order
  const legalAreas = (legalAreasData || []).map((la: any) => ({
    ...la,
    legal_area_stages: (la.legal_area_stages || []).sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    ),
  }));

  return (
    <Suspense fallback={<CasesLoading />}>
      <CasesClient 
        initialCases={cases} 
        clients={clients} 
        orgId={profile.org_id}
        legalAreas={legalAreas}
      />
    </Suspense>
  );
}

function CasesLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
