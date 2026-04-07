'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email/client';
import WelcomeEmail from '@/emails/WelcomeEmail';

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

  // Generar ID previamente para evitar problemas de RLS (selección antes de membresía)
  const newOrgId = crypto.randomUUID();
  const slug = data.orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

  // Insertar la organización
  const { error: orgError } = await supabase
    .from('organizations')
    .insert({
      id: newOrgId,
      name: data.orgName,
      slug: slug,
      country_code: data.countryCode,
      plan_tier: 'pro',
      onboarding_completed: false,
    });

  if (orgError) {
    console.error('Organization creation error:', orgError);
    return { error: 'Error al crear el despacho' };
  }

  // Actualizar el perfil del usuario con el org_id
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      org_id: newOrgId,
      role: 'owner',
      status: 'active',
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: 'Error al actualizar el perfil' };
  }

  revalidatePath('/', 'layout');
  return { success: true, orgId: newOrgId };
}

/**
 * Marca el onboarding como completado y envía correo de bienvenida.
 */
export async function completeOnboardingAction(orgId: string) {
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from('organizations')
    .update({ onboarding_completed: true })
    .eq('id', orgId);

  if (updateError) {
    return { error: 'Error al completar el onboarding' };
  }

  // Obtener datos del usuario logueado para enviarle el correo
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    // Buscar su nombre en perfiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const lawyerName = profile?.full_name || 'Abogado';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abogados.zentyar.com';
    
    // Disparar correo asincrónicamente sin bloquear el retorno
    sendEmail({
      to: user.email,
      subject: 'Bienvenido a tu Despacho Digital - Abogado-Sala',
      react: WelcomeEmail({
        lawyerName,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    }).catch(err => console.error('Error enviando welcome email:', err));
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
