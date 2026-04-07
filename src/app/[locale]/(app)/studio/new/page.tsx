import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { StudioEditorClient } from '@/components/components-reusables/studio/editor-client';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('studio');
  return { title: t('newDocument') };
}

/**
 * Página de creación de nuevo documento.
 * Crea el registro en BD y redirige al editor para edición inmediata.
 */
export default async function NewDocumentPage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile?.org_id) redirect(`/${locale}/onboarding`);

  // Crear documento vacío en BD
  const { data: newDoc, error } = await supabase
    .from('documents')
    .insert({
      title: 'Documento sin título',
      org_id: profile.org_id,
      author_id: user.id,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      word_count: 0,
    })
    .select('id')
    .single();

  if (error || !newDoc) {
    redirect(`/${locale}/studio`);
  }

  // Redirigir al editor del documento recién creado
  redirect(`/${locale}/studio/${newDoc.id}`);
}
