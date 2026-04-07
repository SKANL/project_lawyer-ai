import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { StudioEditorClient } from '@/components/components-reusables/studio/editor-client';
import type { Metadata } from 'next';
import type { Json } from '@/types/database';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .select('title')
    .eq('id', id)
    .single();

  return { title: data?.title ?? 'Documento sin título' };
}

/**
 * Página del editor de un documento específico.
 * Carga el documento desde Supabase y lo pasa al client component del editor.
 */
export default async function StudioEditorPage({ params }: PageProps) {
  const { locale, id } = await params;
  const t = await getTranslations('studio');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { data: document, error } = await supabase
    .from('documents')
    .select('id, title, content, word_count, org_id')
    .eq('id', id)
    .single();

  if (error || !document) {
    notFound();
  }

  return (
    // Layout a pantalla completa sin padding — el editor lo gestiona internamente
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden -m-4 md:-m-6">
      <StudioEditorClient
        locale={locale}
        documentId={document.id}
        initialTitle={document.title}
        initialContent={(document.content as Record<string, unknown>) ?? undefined}
      />
    </div>
  );
}
