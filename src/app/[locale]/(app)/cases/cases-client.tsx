'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Plus, Search, Filter, 
  LayoutGrid, List as ListIcon, 
  Scale, Briefcase, FileText, ChevronDown
} from 'lucide-react';
import { KanbanBoard, CaseItem } from '@/components/components-reusables/cases/kanban-board';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { CaseForm } from '@/components/components-reusables/cases/case-form';
import { toast } from 'sonner';
import { createCase, updateCaseStatus, updateCase } from '@/actions/cases';

interface CasesClientProps {
  initialCases: CaseItem[];
  clients: { id: string, name: string }[];
  orgId: string;
}

/**
 * CasesClient — Controlador de la vista de Expedientes (Kanban + Filtros).
 */
export function CasesClient({ initialCases, clients, orgId }: CasesClientProps) {
  const t = useTranslations('cases');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isAddingCase, setIsAddingCase] = useState(false);

  // Filtrado reactivo
  const filteredCases = initialCases.filter(c => {
    const matchesSearch = c.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.official_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Aquí podrías añadir filtros por Área si estuvieran en el objeto CaseItem
    return matchesSearch;
  });

  const handleCreateCase = async (data: any) => {
    setIsAddingCase(true);
    try {
      await createCase(data, orgId);
      toast.success("Expediente creado correctamente");
    } catch (error) {
      toast.error("Error al crear expediente");
    } finally {
      setIsAddingCase(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    return new Promise<void>((resolve, reject) => {
      toast.promise(
        updateCaseStatus(id, newStatus)
          .then(() => resolve())
          .catch((e) => {
            reject(e);
            throw e;
          }),
        {
          loading: 'Actualizando estatus...',
          success: 'Estatus actualizado',
          error: 'Error al actualizar',
        }
      );
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* HEADER DE ACCIONES */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
            <Scale className="h-8 w-8 text-primary" />
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona la etapa procesal de todos tus asuntos legales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de Vista */}
          <div className="flex bg-muted/30 p-1 rounded-lg border border-border/40">
            <Button 
              variant={view === 'kanban' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('kanban')}
              className="h-8 gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('list')}
              className="h-8 gap-2"
            >
              <ListIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
          </div>

          <Dialog>
            <DialogTrigger render={<Button size="sm" className="h-10 gap-2 shadow-lg shadow-primary/20" />}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Expediente</span>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
              <DialogHeader>
                 <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Abrir Nuevo Expediente
                 </DialogTitle>
                 <DialogDescription>
                    Completa la ficha técnica del asunto. Recuerda que puedes añadir campos personalizados.
                 </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <CaseForm clients={clients} onSubmit={handleCreateCase} isLoading={isAddingCase} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por título, cliente o número de control..." 
            className="pl-10 h-11 bg-background/50 border-border/40 focus-visible:ring-primary/30"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="h-11 border-border/40 gap-2" />}>
                <Filter className="h-4 w-4" />
                Área Legal
                <ChevronDown className="h-3 w-3 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Filtrar por Especialidad</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {['Civil', 'Familiar', 'Penal', 'Mercantil', 'Laboral'].map(area => (
                <DropdownMenuCheckboxItem key={area} checked={selectedArea === area} onCheckedChange={() => setSelectedArea(area)}>
                  {area}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="h-11 border-border/40 gap-2 px-3" />}>
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Abogado</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
               <DropdownMenuLabel>Responsable del Caso</DropdownMenuLabel>
               <DropdownMenuSeparator />
               <DropdownMenuItem>Todos los abogados</DropdownMenuItem>
               <DropdownMenuItem>Mis expedientes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: KANBAN O LISTA */}
      <div className="flex-1 overflow-hidden">
        {view === 'kanban' ? (
          <KanbanBoard initialCases={filteredCases} onStatusChange={handleStatusChange} />
        ) : (
          <div className="p-8 text-center bg-background/40 border border-dashed border-border/50 rounded-2xl">
              <p className="text-muted-foreground">Vista de lista en desarrollo. Usa el Kanban mientras tanto.</p>
          </div>
        )}
      </div>

    </div>
  );
}
