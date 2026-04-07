'use client';

import React, { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useTranslations } from 'next-intl';
import { KanbanColumn } from './kanban-column';
import { CaseCard } from './case-card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Tipado de los datos
export interface CaseItem {
  id: string;
  title: string;
  case_number: string | null;
  official_id: string | null;
  court_name: string | null;
  status: string;
  client: { full_name: string };
  start_date: string | null;
}

interface KanbanBoardProps {
  initialCases: CaseItem[];
  onStatusChange: (caseId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: 'draft', label: 'Eorrador' },
  { id: 'pending_docs', label: 'Documentación' },
  { id: 'in_progress', label: 'En Proceso' },
  { id: 'review', label: 'Revisión' },
  { id: 'suspended', label: 'Suspendido' },
  { id: 'completed', label: 'Completado' },
];

/**
 * KanbanBoard — Tablero de gestión de expedientes.
 */
export function KanbanBoard({ initialCases, onStatusChange }: KanbanBoardProps) {
  const ts = useTranslations('cases.status');
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeCase = cases.find(c => c.id === activeId);

  const getCasesByStatus = (status: string) => cases.filter(c => c.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdVal = active.id as string;
    const overIdVal = over.id as string;

    const activeCaseVal = cases.find(c => c.id === activeIdVal);
    if (!activeCaseVal) return;

    // Detectar si estamos sobre una columna o sobre un item
    const overColumnId = COLUMNS.find(col => col.id === overIdVal)?.id;
    const overCaseVal = cases.find(c => c.id === overIdVal);

    const targetStatus = overColumnId || overCaseVal?.status;

    if (targetStatus && activeCaseVal.status !== targetStatus) {
      setCases(prev => {
        const newCases = prev.map(c => 
          c.id === activeIdVal ? { ...c, status: targetStatus } : c
        );
        return newCases;
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdVal = active.id as string;
    const overIdVal = over.id as string;

    const activeCaseVal = cases.find(c => c.id === activeIdVal);
    if (!activeCaseVal) return;

    // Persistir cambio
    onStatusChange(activeIdVal, activeCaseVal.status);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border/10 bg-slate-50/10 dark:bg-zinc-950/20 p-4">
        <div className="flex gap-4 min-h-[calc(100vh-280px)] pb-4">
          {COLUMNS.map(col => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              title={ts(col.id)} 
              count={getCasesByStatus(col.id).length}
            >
              <SortableContext items={getCasesByStatus(col.id).map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[150px]">
                  {getCasesByStatus(col.id).map(c => (
                    <CaseCard key={c.id} caseData={c} />
                  ))}
                  {getCasesByStatus(col.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/20 rounded-xl bg-muted/5">
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Vacío</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="pt-2" />
      </ScrollArea>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeCase ? (
          <div className="rotate-2 scale-105 transition-transform duration-200 shadow-2xl">
            <CaseCard caseData={activeCase} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
