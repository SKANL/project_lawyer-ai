import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Scale, MoreVertical, Landmark, ShieldAlert, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
    legal_area: string | null;
    opposition_party: string | null;
    notes: string | null;
  };
  onClick?: () => void;
}

/**
 * CaseCard — Vista resumida y desglosable de un expediente.
 */
export function CaseCard({ caseData, onClick }: CaseCardProps) {
  const ts = useTranslations('cases.status');
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <Card 
      className={cn(
        "group relative cursor-grab active:cursor-grabbing border-border/40 hover:border-primary/50 transition-all duration-300 bg-background/60 backdrop-blur-md shadow-sm",
        expanded ? "ring-1 ring-primary/20 shadow-lg scale-[1.01] z-10" : "hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-xs font-bold leading-tight truncate group-hover:text-primary transition-colors pr-4">
              {caseData.title || 'Sin título'}
            </CardTitle>
            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <User className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{caseData.client?.full_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-6 w-6 rounded-md hover:bg-primary/10 hover:text-primary transition-all", expanded && "bg-primary/10 text-primary rotate-180")}
              onClick={toggleExpand}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-0 space-y-2">
        {/* Vista Compacta (Siempre visible) */}
        {!expanded && (
          <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1 opacity-70">
            <div className="flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" />
              {caseData.start_date ? format(new Date(caseData.start_date), 'dd/MM/yy') : '--/--/--'}
            </div>
            <div className="flex items-center gap-1">
              {caseData.legal_area && <Scale className="h-2.5 w-2.5" />}
              {caseData.official_id && <span className="font-mono">{caseData.official_id}</span>}
            </div>
          </div>
        )}

        {/* Vista Desglosada (Expandible) */}
        {expanded && (
          <div className="pt-2 border-t border-border/10 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 gap-2">
              {caseData.official_id && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">No. Expediente</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground bg-muted/30 p-1.5 rounded-lg border border-border/20">
                    <Scale className="h-3 w-3 text-primary/70" />
                    {caseData.official_id}
                  </div>
                </div>
              )}
              
              {caseData.court_name && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Juzgado</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground bg-muted/30 p-1.5 rounded-lg border border-border/20">
                    <Landmark className="h-3 w-3 text-primary/70" />
                    {caseData.court_name}
                  </div>
                </div>
              )}

              {caseData.legal_area && (
                <div className="flex flex-col gap-0.5">
                   <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Materia Legal</span>
                   <div className="flex items-center gap-1.5 text-[10px] font-medium text-foreground">
                    <Badge variant="outline" className="text-[9px] py-0 h-4 bg-primary/5">{caseData.legal_area}</Badge>
                   </div>
                </div>
              )}

              {caseData.opposition_party && (
                <div className="flex flex-col gap-1 mt-1 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-destructive/80">
                    <ShieldAlert className="h-3 w-3" />
                    Contraparte: {caseData.opposition_party}
                  </div>
                </div>
              )}

              {caseData.notes && (
                <div className="mt-1 space-y-1">
                  <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Notas del Caso</span>
                  <p className="text-[10px] p-2 bg-background/50 rounded-lg border border-border/10 text-muted-foreground leading-relaxed italic">
                    "{caseData.notes}"
                  </p>
                </div>
              )}
            </div>

            <Button size="sm" className="w-full text-[10px] h-7 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all font-bold">
              Ver Expediente Completo
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/10">
          <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 bg-primary/5 text-primary font-medium">
            {ts(caseData.status)}
          </Badge>
          <div className="flex items-center gap-1">
             <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-muted opacity-40 hover:opacity-100 transition-opacity">
               <MoreVertical className="h-3 w-3" />
             </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
