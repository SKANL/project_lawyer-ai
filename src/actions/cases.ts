'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * createCase — Crea un nuevo expediente en Supabase.
 */
export async function createCase(data: any, orgId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cases')
    .insert([{
      ...data,
      org_id: orgId,
    }]);

  if (error) {
    console.error("Error creating case:", error);
    throw new Error(error.message);
  }

  revalidatePath('/[locale]/(app)/cases', 'page');
  return { success: true };
}

/**
 * updateCaseStatus — Actualiza solo el estatus (mesa) de un expediente.
 * Útil para el drag & drop del Kanban.
 */
export async function updateCaseStatus(caseId: string, newStatus: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cases')
    .update({ status: newStatus as any })
    .eq('id', caseId);

  if (error) {
    console.error("Error updating case status:", error);
    throw new Error(error.message);
  }

  revalidatePath('/[locale]/(app)/cases', 'page');
  return { success: true };
}

/**
 * updateCase — Actualización completa de un expediente.
 */
export async function updateCase(caseId: string, data: any) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cases')
    .update(data)
    .eq('id', caseId);

  if (error) {
    console.error("Error updating case:", error);
    throw new Error(error.message);
  }

  revalidatePath('/[locale]/(app)/cases', 'page');
  return { success: true };
}
