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
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  CheckSquare,
  Link2,
  Calendar,
  Binary,
  BookText,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive('subscript')}
          label="Subíndice"
        >
          <SubscriptIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive('superscript')}
          label="Superíndice"
        >
          <SuperscriptIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => {
            const previousUrl = editor.getAttributes('link').href
            const url = window.prompt('URL', previousUrl)
            if (url === null) {
              return
            }
            if (url === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}
          isActive={editor.isActive('link')}
          label="Enlace"
        >
          <Link2 className="h-3.5 w-3.5" />
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

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          label="Lista de tareas"
        >
          <CheckSquare className="h-3.5 w-3.5" />
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

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          isActive={editor.isActive('table')}
          label="Insertar tabla"
        >
          <TableIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "group flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted",
              editor.isActive('textStyle') && "bg-muted text-foreground"
            )}
            title="Color del texto"
          >
            <Palette className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] grid grid-cols-5 gap-1 p-2">
            {[
              { color: '#000000', name: 'Negro' },
              { color: '#4b5563', name: 'Gris' },
              { color: '#ef4444', name: 'Rojo' },
              { color: '#f97316', name: 'Naranja' },
              { color: '#f59e0b', name: 'Ámbar' },
              { color: '#eab308', name: 'Amarillo' },
              { color: '#84cc16', name: 'Lima' },
              { color: '#10b981', name: 'Esmeralda' },
              { color: '#06b6d4', name: 'Cian' },
              { color: '#3b82f6', name: 'Azul' },
              { color: '#6366f1', name: 'Índigo' },
              { color: '#8b5cf6', name: 'Violeta' },
              { color: '#a855f7', name: 'Morado' },
              { color: '#d946ef', name: 'Fucsia' },
              { color: '#ec4899', name: 'Rosa' },
            ].map(({ color, name }) => (
              <DropdownMenuItem
                key={color}
                className="flex aspect-square h-7 w-7 items-center justify-center rounded-md p-0 cursor-pointer focus:bg-accent"
                onClick={() => editor.chain().focus().setColor(color).run()}
                title={name}
              >
                <div
                  className={cn(
                    "h-5 w-5 rounded-full ring-offset-background transition-all hover:scale-110 shadow-sm border border-border/50",
                    editor.isActive('textStyle', { color }) && "ring-2 ring-ring ring-offset-2"
                  )}
                  style={{ backgroundColor: color }}
                />
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              className="col-span-1 flex aspect-square h-7 w-7 items-center justify-center rounded-md p-0 cursor-pointer focus:bg-accent"
              onClick={() => editor.chain().focus().unsetColor().run()}
              title="Restablecer"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border/50 bg-background text-[10px] font-bold text-muted-foreground ring-offset-background transition-all hover:scale-110">
                /
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarButton
          onClick={() => editor.chain().focus().insertLegalDate().run()}
          label="Fecha Legal"
        >
          <Calendar className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().convertNumberToWords().run()}
          label="Números a Letras"
        >
          <Binary className="h-3.5 w-3.5" />
        </ToolbarButton>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="group flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            aria-label="Librería de cláusulas"
          >
            <BookText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().insertContent('<b>Jurisdicción y Competencia.</b> Para la interpretación y cumplimiento del presente contrato, así como para todo lo no previsto en el mismo, las partes se someten expresamente a la jurisdicción y competencia de los tribunales de la Ciudad de México, renunciando expresamente a cualquier otro fuero que por razón de sus domicilios presentes o futuros, o por cualquier otra causa, pudiere corresponderles.').run()}
              className="cursor-pointer"
            >
              Cláusula de Jurisdicción
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().insertContent('<b>Confidencialidad.</b> Las Partes acuerdan mantener en estricta confidencialidad toda la Información Confidencial recibida o a la que tengan acceso con motivo de la celebración o ejecución de este contrato.').run()}
              className="cursor-pointer"
            >
              Cláusula de Confidencialidad
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => editor.chain().focus().insertContent('<b>Fuerza Mayor.</b> Ninguna de las Partes será responsable por cualquier retraso o incumplimiento de sus obligaciones bajo este contrato si dicho retraso o incumplimiento es causado directa o indirectamente por un evento de Caso Fortuito o Fuerza Mayor.').run()}
              className="cursor-pointer"
            >
              Cláusula de Fuerza Mayor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolbarDivider />

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
