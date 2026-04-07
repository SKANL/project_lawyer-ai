'use client';

import { useTranslations } from 'next-intl';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Undo,
  Redo,
  SaveAll,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Editor } from '@tiptap/react';

interface LegalToolbarProps {
  editor: Editor | null;
  isSaving?: boolean;
}

/**
 * LegalToolbar — barra de herramientas para el editor legal.
 * Cada botón tiene un tooltip con el nombre de la acción (accesibilidad).
 */
export function LegalToolbar({ editor, isSaving = false }: LegalToolbarProps) {
  const t = useTranslations('studio.toolbar');

  if (!editor) {
    return (
      <div className="flex h-12 items-center gap-1 px-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-8 w-8 animate-pulse rounded bg-muted/30" />
        ))}
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive,
    label,
    disabled,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    label: string;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <Tooltip>
      <TooltipTrigger render={
        <Toggle
          size="sm"
          pressed={isActive}
          onPressedChange={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            'h-8 w-8 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary',
            'hover:bg-muted transition-colors',
          )}
        />
      }>
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );

  const ToolbarDivider = () => <Separator orientation="vertical" className="mx-1 h-6" />;

  return (
    <TooltipProvider delay={400}>
      <div className="flex items-center gap-0.5 px-3 py-1.5 overflow-x-auto scrollbar-none">
        {/* Deshacer / Rehacer */}
        <Tooltip>
          <TooltipTrigger render={
            <Toggle
              size="sm"
              onPressedChange={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              aria-label={t('undo')}
              className="h-8 w-8 p-0 hover:bg-muted transition-colors"
            />
          }>
            <Undo className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{t('undo')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={
            <Toggle
              size="sm"
              onPressedChange={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              aria-label={t('redo')}
              className="h-8 w-8 p-0 hover:bg-muted transition-colors"
            />
          }>
            <Redo className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{t('redo')}</TooltipContent>
        </Tooltip>

        <ToolbarDivider />

        {/* Formato de texto */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          label={t('bold')}
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          label={t('italic')}
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          label={t('underline')}
        >
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          label={t('strike')}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive('highlight')}
          label={t('highlight')}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Encabezados */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          label={t('heading1')}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          label={t('heading2')}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          label={t('heading3')}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          label={t('bulletList')}
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          label={t('orderedList')}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          label={t('blockquote')}
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alineación */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          label={t('alignLeft')}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          label={t('alignCenter')}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          label={t('alignRight')}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          label={t('alignJustify')}
        >
          <AlignJustify className="h-3.5 w-3.5" />
        </ToolbarButton>

        {/* Indicador de guardado */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {isSaving ? (
            <Badge variant="secondary" className="gap-1 text-[11px] h-5 px-2">
              <SaveAll className="h-3 w-3 animate-pulse" />
              Guardando...
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-[11px] h-5 px-2 text-emerald-500 border-emerald-500/30 bg-emerald-500/5">
              <Check className="h-3 w-3" />
              Guardado
            </Badge>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
