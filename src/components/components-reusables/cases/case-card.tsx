'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Scale, MoreVertical, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface CaseCardProps {
  caseData: {
    id: string;
    title: string;
    case_number: string | null;
    official_id: string | null;
    court_name: string | null;
    client: { full_name: string };
    status: string;
    start_date: string | null;
  };
  onClick?: () => void;
}

/**
 * CaseCard — Vista resumida de un expediente para el Kanban.
 */
export function CaseCard({ caseData, onClick }: CaseCardProps) {
  const ts = useTranslations('cases.status');
  
  return (
    <Card 
      className="group relative cursor-grab active:cursor-grabbing border-border/40 hover:border-primary/50 hover:shadow-md transition-all duration-200 bg-background/80 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
              {caseData.title || 'Sin título'}
            </CardTitle>
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{caseData.client?.full_name}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()} />}>
                <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-3">
        {(caseData.official_id || caseData.court_name) && (
          <div className="flex flex-wrap gap-2">
            {caseData.official_id && (
              <div className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md">
                <Scale className="h-3 w-3" />
                {caseData.official_id}
              </div>
            )}
            {caseData.court_name && (
              <div className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-md">
                <Landmark className="h-3 w-3" />
                {caseData.court_name}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {caseData.start_date ? format(new Date(caseData.start_date), 'dd/MM/yy') : '--/--/--'}
          </div>
          <Badge variant="outline" className="text-[10px] py-0 h-5 border-primary/20 bg-primary/5 text-primary">
            {ts(caseData.status)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
