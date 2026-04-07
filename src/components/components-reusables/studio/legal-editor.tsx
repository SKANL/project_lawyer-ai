'use client';

import { Tiptap, useEditor, useCurrentEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';

// Nuevas extensiones open source
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import Gapcursor from '@tiptap/extension-gapcursor';

// Custom extensiones
import { LegalDate } from './extensions/legal-date';
import { NumberToWords } from './extensions/number-to-words';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { LegalToolbar } from './toolbar';

interface LegalEditorProps {
  /** Contenido inicial en formato JSON de TipTap */
  initialContent?: Record<string, unknown>;
  /** Título del documento */
  title?: string;
  /** Callback que se invoca cuando el contenido cambia (para autoguardado) */
  onChange?: (content: Record<string, unknown>, wordCount: number) => void;
  /** Si el editor está en modo solo lectura */
  readOnly?: boolean;
}

/**
 * LegalEditor — editor de texto enriquecido para documentos jurídicos.
 * Construido con TipTap v3 Composable API + SSR-safe (immediatelyRender: false).
 *
 * Includes: Bold, Italic, Underline, Strike, Headings, Lists, Alignment,
 * Blockquote, Highlight, CharacterCount, Placeholder, Subscript, Superscript,
 * Table, TaskList, Link, Color, Typography, LegalDate, NumberToWords.
 */
export function LegalEditor({
  initialContent,
  title,
  onChange,
  readOnly = false,
}: LegalEditorProps) {
  const t = useTranslations('studio');
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-6' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-6' } },
        blockquote: {
          HTMLAttributes: { class: 'border-l-2 border-muted-foreground/30 pl-4 italic' },
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: t('placeholder'),
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:float-left before:text-muted-foreground/40 before:pointer-events-none before:h-0',
      }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
      Subscript,
      Superscript,
      Gapcursor,
      Table.configure({
        resizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList.configure({
        HTMLAttributes: {
          class: 'not-prose flex flex-col gap-1 pl-4 my-4',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex flex-row items-center gap-2',
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextStyle,
      Color,
      Typography,
      LegalDate.configure({ locale: 'es' }),
      NumberToWords,
    ],
    content: initialContent ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editable: !readOnly,
    // CRÍTICO para Next.js SSR — evita hydration mismatch
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const wordCount = editor.storage.characterCount?.words() ?? 0;
        onChange(editor.getJSON() as Record<string, unknown>, wordCount);
      }
    },
  });

  /** Simula el indicador de guardado al cambiar contenido */
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      setIsSaving(true);
      const timer = setTimeout(() => setIsSaving(false), 1500);
      return () => clearTimeout(timer);
    };
    editor.on('update', handler);
    return () => { editor.off('update', handler); };
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <Tiptap instance={editor}>
        {/* Toolbar sticky */}
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <LegalToolbar editor={editor} isSaving={isSaving} />
        </div>

        {/* Área de escritura */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-8 py-12">
            {title && (
              <div className="mb-8 border-b pb-6">
                <h1 className="text-xl font-semibold text-muted-foreground/80 tracking-tight">
                  {title}
                </h1>
              </div>
            )}

            {/* Área de escritura del editor */}
            <Tiptap.Content
              className={cn(
                'prose prose-zinc dark:prose-invert max-w-none min-h-[600px] focus:outline-none',
                'prose-headings:font-bold prose-headings:tracking-tight',
                'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
                'prose-p:leading-relaxed prose-p:text-base',
                '[&_.ProseMirror]:focus:outline-none',
                '[&_.ProseMirror]:min-h-[600px]',
              )}
            />
          </div>
        </div>

        {/* Footer con contador de palabras */}
        <WordCountFooter />
      </Tiptap>
    </div>
  );
}

/** Contador de palabras que usa useTiptapState para re-renders eficientes */
function WordCountFooter() {
  const t = useTranslations('studio');

  return (
    <div className="sticky bottom-0 flex items-center justify-end border-t bg-background/95 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
      <WordCount />
      <span className="ml-1">{t('wordCount')}</span>
    </div>
  );
}

function WordCount() {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return <span>—</span>;
  }

  return <span>{editor.storage.characterCount?.words() ?? 0}</span>;
}
