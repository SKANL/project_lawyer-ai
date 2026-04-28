'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * createCase — Crea un nuevo expediente en Supabase.
 * Soporta tanto el modelo legacy (status enum) como el nuevo (legal_area_id + stage_id).
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
 * updateCaseStage — Actualiza la etapa procesal de un expediente via RPC.
 * Incluye audit trail automático e idempotencia (no duplica registros si no cambia).
 * Requiere: función RPC `update_case_stage` en la BD.
 */
export async function updateCaseStage(caseId: string, newStageId: string, reason?: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc('update_case_stage', {
    p_case_id: caseId,
    p_new_stage_id: newStageId,
    p_reason: reason,
  });

  if (error) {
    console.error("Error updating case stage:", error);
    throw new Error(error.message);
  }

  revalidatePath('/[locale]/(app)/cases', 'page');
  return { success: true };
}

/**
 * updateCaseStatus — [LEGACY] Actualiza solo el estatus (mesa) de un expediente.
 * Mantener activo como fallback para expedientes sin stage_id.
 * @deprecated Usar updateCaseStage para nuevos expedientes.
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
