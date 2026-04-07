'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type OnboardingOrgData = {
  orgName: string;
  countryCode: string;
};

/**
 * Crea la organización y redirige al wizard onboarding.
 */
export async function createOrganizationAction(data: OnboardingOrgData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'No autenticado' };
  }

  // Insertar la organización
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: data.orgName,
      country_code: data.countryCode,
      plan: 'trial',
      onboarding_completed: false,
    })
    .select('id')
    .single();

  if (orgError || !org) {
    return { error: 'Error al crear el despacho' };
  }

  // Actualizar el perfil del usuario con el org_id
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      org_id: org.id,
      role: 'owner',
      status: 'active',
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: 'Error al actualizar el perfil' };
  }

  revalidatePath('/', 'layout');
  return { success: true, orgId: org.id };
}

/**
 * Marca el onboarding como completado.
 */
export async function completeOnboardingAction(orgId: string) {
  const supabase = await createClient();

  await supabase
    .from('organizations')
    .update({ onboarding_completed: true })
    .eq('id', orgId);

  revalidatePath('/', 'layout');
  return { success: true };
}
