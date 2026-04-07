'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * createClient — Registra un nuevo cliente en la organización.
 */
export async function createClientMutation(data: any, orgId: string, assignedLawyerId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('clients')
    .insert([{
      ...data,
      org_id: orgId,
      assigned_lawyer_id: assignedLawyerId
    }]);

  if (error) {
    console.error("Error creating client:", error);
    throw new Error(error.message);
  }

  revalidatePath('/[locale]/(app)/clients', 'page');
  return { success: true };
}

/**
 * updateClient — Actualiza los datos de un cliente existente.
 */
export async function updateClient(clientId: string, data: any) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', clientId);

  if (error) {
    console.error("Error updating client:", error);
    throw new Error(error.message);
  }

  revalidatePath('/[locale]/(app)/clients', 'page');
  return { success: true };
}
