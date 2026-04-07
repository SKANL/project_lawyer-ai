'use client';

import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Scale, FilePlus2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}

/**
 * KanbanColumn — Columna de estatus con detector de droppable.
 */
export function KanbanColumn({ id, title, count, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div 
      className={cn(
        "flex flex-col w-full min-w-0 rounded-2xl bg-muted/40 border border-border/40 p-4 transition-colors duration-200",
        isOver && "bg-primary/5 border-primary/20 ring-1 ring-primary/20"
      )}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="h-6 w-6 rounded-full p-0 flex items-center justify-center font-bold text-[10px] bg-background"
          >
            {count}
          </Badge>
          <h3 className="text-sm font-bold tracking-tight text-foreground/80">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary">
            <FilePlus2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary">
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div 
        ref={setNodeRef} 
        className={cn(
          "flex-1 transition-opacity duration-200",
          isOver ? "opacity-90" : "opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  );
}
