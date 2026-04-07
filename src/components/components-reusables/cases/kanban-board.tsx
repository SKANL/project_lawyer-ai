'use client';

import React, { useState, useEffect } from 'react';
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
  legal_area: string | null;
  opposition_party: string | null;
  notes: string | null;
}

interface KanbanBoardProps {
  initialCases: CaseItem[];
  onStatusChange: (caseId: string, newStatus: string) => void;
}

const COLUMNS = [
  { id: 'draft' },
  { id: 'active' },
  { id: 'review' },
  { id: 'suspended' },
  { id: 'closed' },
];

/**
 * KanbanBoard — Tablero de gestión de expedientes.
 */
export function KanbanBoard({ initialCases, onStatusChange }: KanbanBoardProps) {
  const ts = useTranslations('cases.status');
  const [cases, setCases] = useState<CaseItem[]>(initialCases);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeCase = cases.find(c => c.id === activeId);

  const getCasesByStatus = (status: string) => cases.filter(c => c.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const activeCaseVal = cases.find(c => c.id === event.active.id);
    if (activeCaseVal) {
      setOriginalStatus(activeCaseVal.status);
    }
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdVal = active.id as string;
    const activeCaseVal = cases.find(c => c.id === activeIdVal);
    if (!activeCaseVal) return;

    // Persistir cambio optimista
    try {
      await onStatusChange(activeIdVal, activeCaseVal.status);
    } catch (e) {
      // Revertir en caso de fallo (Optimistic UI Fallback)
      if (originalStatus) {
        setCases(prev => prev.map(c => 
          c.id === activeIdVal ? { ...c, status: originalStatus } : c
        ));
      }
    }
    setOriginalStatus(null);
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
      <div className="w-full bg-slate-50/5 dark:bg-zinc-950/10 rounded-xl p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 min-h-[calc(100vh-280px)]">
          {COLUMNS.map(col => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              title={ts(col.id)} 
              count={getCasesByStatus(col.id).length}
            >
              <SortableContext items={getCasesByStatus(col.id).map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[200px]">
                  {getCasesByStatus(col.id).map(c => (
                    <CaseCard key={c.id} caseData={c} />
                  ))}
                  {getCasesByStatus(col.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border/10 rounded-2xl bg-muted/5 opacity-40">
                       <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Sin Asuntos</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </KanbanColumn>
          ))}
        </div>
      </div>

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
