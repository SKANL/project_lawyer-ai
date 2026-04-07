import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Plus, Clock, MoreHorizontal, FileText } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import { DocumentMenuButton } from '@/components/components-reusables/studio/document-menu';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('studio');
  return { title: t('title') };
}

/** Trae los documentos del despacho ordenados por fecha de actualización */
async function getDocuments(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('documents')
    .select('id, title, word_count, updated_at, case_id')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(50);
  return data ?? [];
}

const documentColors = [
  'bg-blue-500/10 border-blue-500/20',
  'bg-violet-500/10 border-violet-500/20',
  'bg-emerald-500/10 border-emerald-500/20',
  'bg-amber-500/10 border-amber-500/20',
  'bg-rose-500/10 border-rose-500/20',
];

export default async function StudioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('studio');
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

  const documents = await getDocuments(profile.org_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            Redacta y gestiona tus documentos jurídicos
          </p>
        </div>
        <Link href={`/${locale}/studio/new`} className={buttonVariants({ variant: 'default' })}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newDocument')}
        </Link>
      </div>

      {/* Estado vacío */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t('empty.title')}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">{t('empty.description')}</p>
          <Link href={`/${locale}/studio/new`} className={buttonVariants({ variant: 'default' })}>
            <Plus className="mr-2 h-4 w-4" />
            {t('empty.action')}
          </Link>
        </div>
      ) : (
        /* Grid de documentos */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Tarjeta: Nuevo documento */}
          <Link
            href={`/${locale}/studio/new`}
            className="group flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 min-h-[160px]"
          >
            <div className="rounded-full bg-muted p-3 mb-3 group-hover:bg-primary/10 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              {t('newDocument')}
            </span>
          </Link>

          {/* Tarjetas de documentos existentes */}
          {documents.map((doc, i) => (
            <Link key={doc.id} href={`/${locale}/studio/${doc.id}`}>
              <Card
                className={`group h-full min-h-[160px] cursor-pointer border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${documentColors[i % documentColors.length]}`}
              >
                <CardContent className="flex h-full flex-col p-4">
                  {/* Icono + título */}
                  <div className="flex items-start justify-between gap-2 mb-auto">
                    <FileText className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                    
                    <div>
                      <DocumentMenuButton documentId={doc.id} documentTitle={doc.title} />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2 mb-2">
                      {doc.title || t('untitled')}
                    </h3>

                    <div className="flex items-center justify-between mt-auto gap-2">
                      {doc.word_count != null && doc.word_count > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          {doc.word_count} {t('wordCount')}
                        </Badge>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.updated_at).toLocaleDateString(
                          locale === 'es' ? 'es-MX' : 'en-US',
                          { month: 'short', day: 'numeric' },
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
