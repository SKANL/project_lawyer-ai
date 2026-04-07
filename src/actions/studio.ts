'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Elimina un documento por ID. Verificando RLS.
 */
export async function deleteDocument(documentId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('documents').delete().eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    return { success: false, error: 'No se pudo eliminar el documento' };
  }

  // Next.js se encarga automáticamente de detectar el locale si revalidamos la ruta con layout support
  // Pero para estar seguros revalidamos la página donde listan
  revalidatePath('/[locale]/(app)/studio', 'page');
  return { success: true };
}

/**
 * Renombra un documento específico
 */
export async function renameDocument(documentId: string, newTitle: string) {
  const supabase = await createClient();

  // El RLS asegura que solo el autor (o miembro con permisos) pueda actualizarlo según las políticas que tengas
  const { error } = await supabase
    .from('documents')
    .update({ title: newTitle, updated_at: new Date().toISOString() })
    .eq('id', documentId);

  if (error) {
    console.error('Error renaming document:', error);
    return { success: false, error: 'No se pudo renombrar el documento' };
  }

  revalidatePath('/[locale]/(app)/studio', 'page');
  return { success: true };
}

/**
 * Duplica un documento (Crea una copia idéntica pero con diferente ID y Título + " - Copia")
 */
export async function duplicateDocument(documentId: string) {
  const supabase = await createClient();

  // 1. Obtener el documento original
  const { data: original, error: fetchError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (fetchError || !original) {
    console.error('Error fetching document to duplicate:', fetchError);
    return { success: false, error: 'Documento original no encontrado' };
  }

  // 2. Insertar una copia
  const { data: duplicated, error: insertError } = await supabase
    .from('documents')
    .insert({
      org_id: original.org_id,
      case_id: original.case_id,
      author_id: original.author_id,
      title: `${original.title || 'Documento'} - Copia`,
      content: original.content,
      word_count: original.word_count,
    })
    .select('id')
    .single();

  if (insertError || !duplicated) {
    console.error('Error duplicating document:', insertError);
    return { success: false, error: 'No se pudo duplicar el documento' };
  }

  revalidatePath('/[locale]/(app)/studio', 'page');
  return { success: true, newDocumentId: duplicated.id };
}
