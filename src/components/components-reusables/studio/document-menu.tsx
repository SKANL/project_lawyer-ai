'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MoreHorizontal, FileEdit, Copy, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { deleteDocument, duplicateDocument, renameDocument } from '@/actions/studio';

interface DocumentMenuButtonProps {
  documentId: string;
  documentTitle: string;
}

export function DocumentMenuButton({ documentId, documentTitle }: DocumentMenuButtonProps) {
  const t = useTranslations('studio.actions'); // Asegúrate de tener estas keys (las añadiré si no)
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Estados de carga
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const [newTitle, setNewTitle] = useState(documentTitle);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteDocument(documentId);
    setIsDeleting(false);

    if (result.success) {
      toast.success(t('deleted'));
      setIsDeleteOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    const result = await duplicateDocument(documentId);
    setIsDuplicating(false);

    if (result.success && result.newDocumentId) {
      toast.success(t('duplicated'));
      setIsOpen(false);
      // Extraemos locale del window o hook si fuera necesario, para redireccionar
      // Aunque con Next App Router basta refresh y redireccion al ID. 
      // Si la URL actual es /es/studio, recargará los datos solos si llamamos a router.refresh() 
      // pero redirigir a page de studio/[id] es mejor si se quisiera.
      router.refresh(); 
    } else {
      toast.error(result.error);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle === documentTitle) {
      setIsRenameOpen(false);
      return;
    }

    setIsRenaming(true);
    const result = await renameDocument(documentId, newTitle);
    setIsRenaming(false);

    if (result.success) {
      toast.success(t('renamed'));
      setIsRenameOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm hover:bg-muted"
          aria-label="Opciones del documento"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault(); // Evitamos que dispare el Link padre
            e.stopPropagation();
          }}
        >
          {isDuplicating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
        </DropdownMenuTrigger>
        
        {/* Usamos stopPropagation en los items si el padre es un Link, sino Next.js enruta. */}
        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              setNewTitle(documentTitle);
              setIsRenameOpen(true);
              setIsOpen(false);
            }}
            className="cursor-pointer"
          >
            <FileEdit className="mr-2 h-4 w-4" />
            <span>Renombrar</span> {/* t('rename') */}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate();
            }}
            disabled={isDuplicating}
            className="cursor-pointer"
          >
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicar</span> {/* t('duplicate') */}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteOpen(true);
              setIsOpen(false);
            }}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span> {/* t('delete') */}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para Renombrar */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Renombrar documento</DialogTitle>
              <DialogDescription>
                Ingresa el nuevo título para tu documento legal.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                placeholder="Ej. Contrato de Arrendamiento"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isRenaming}>
                {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Eliminar */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>¿Eliminar documento?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente "{documentTitle}".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
