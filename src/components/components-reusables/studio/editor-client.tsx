'use client';

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { LegalEditor } from '@/components/components-reusables/studio/legal-editor';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface StudioEditorClientProps {
  locale: string;
  documentId: string | null;
  initialTitle: string;
  initialContent?: Record<string, unknown>;
}

/**
 * StudioEditorClient — wrapper cliente para el editor TipTap.
 * Maneja el autoguardado, el título editable y el estado de guardado.
 */
export function StudioEditorClient({
  locale,
  documentId,
  initialTitle,
  initialContent,
}: StudioEditorClientProps) {
  const t = useTranslations('studio');
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  /** Autoguardado con debounce de 2s */
  const handleContentChange = useCallback(
    (content: Record<string, unknown>, wordCount: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const res = await fetch('/api/studio/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId, title, content, wordCount }),
          });

          if (!res.ok) throw new Error('Error guardando');
          setLastSaved(new Date());
        } catch {
          toast.error('No se pudo guardar el documento');
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [documentId, title],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Sub-header del editor: título editable + botón de vuelta */}
      <div className="flex items-center gap-3 border-b px-4 py-2">
        <Link 
          href={`/${locale}/studio`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 shrink-0")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('untitled')}
          className="h-8 border-none bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        {lastSaved && (
          <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">
            {t('lastSaved')}{' '}
            {lastSaved.toLocaleTimeString(locale === 'es' ? 'es-MX' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}

        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          disabled={isSaving}
          onClick={() => handleContentChange({} as Record<string, unknown>, 0)}
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isSaving ? t('saving') : t('saved')}</span>
        </Button>
      </div>

      {/* El editor ocupa todo el espacio restante */}
      <div className="flex-1 overflow-hidden">
        <LegalEditor
          title={title}
          initialContent={initialContent}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}
