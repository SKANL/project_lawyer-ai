'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { CustomFieldManager } from '../shared/custom-field-manager';
import { User, Hash, Gavel, Calendar as CalendarIcon, FileText, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const caseSchema = z.object({
  title: z.string().min(3, { message: "Mínimo 3 caracteres" }),
  client_id: z.string().uuid({ message: "Debe elegir un cliente" }),
  official_id: z.string().optional(),
  court_name: z.string().optional(),
  legal_area: z.string().optional(),
  legal_action: z.string().optional(),
  opposition_party: z.string().optional(),
  status: z.enum(['draft', 'active', 'review', 'suspended', 'closed']).default('active'),
  start_date: z.date().optional().nullable(),
  end_date: z.date().optional().nullable(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
});

type CaseFormValues = z.infer<typeof caseSchema>;

interface CaseFormProps {
  clients: { id: string; name: string }[];
  initialData?: Partial<CaseFormValues>;
  onSubmit: (data: CaseFormValues) => void;
  isLoading?: boolean;
}

export function CaseForm({ clients, initialData, onSubmit, isLoading }: CaseFormProps) {
  const t = useTranslations('cases.fields');
  const ts = useTranslations('cases.status');

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      client_id: initialData?.client_id || '',
      official_id: initialData?.official_id || '',
      court_name: initialData?.court_name || '',
      legal_area: initialData?.legal_area || '',
      legal_action: initialData?.legal_action || '',
      opposition_party: initialData?.opposition_party || '',
      status: initialData?.status || 'active',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
      notes: initialData?.notes || '',
      metadata: initialData?.metadata || {},
    } as any,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-4">
        
        {/* SECCIÓN 1: GENERAL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm text-foreground/80 tracking-wide uppercase">Información General</h3>
          </div>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel className="text-foreground/90">{t('title')} *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Divorcio Incausado Sr. Fernando..." className="bg-background/80" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">{t('client')} *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/80 w-full min-w-[200px]">
                        <SelectValue placeholder="Seleccionar cliente afectado">
                          {(val) => clients.find(c => c.id === val)?.name || "Seleccionar..."}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background/95 backdrop-blur-xl">
                      {clients.length > 0 ? (
                        clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-muted-foreground text-center">
                          No hay clientes registrados
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {clients.length === 0 && (
                    <p className="text-[10px] text-primary/80 mt-1.5 font-medium animate-pulse">
                      * Por favor, registre un cliente antes de crear el expediente.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">{t('status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/80">
                        <SelectValue placeholder={ts('review')}>
                          {(val) => ts(val as any)}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background/95 backdrop-blur-xl">
                      {['draft', 'active', 'review', 'suspended', 'closed'].map(s => (
                        <SelectItem key={s} value={s}>{ts(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-1.5 opacity-60">
              <Hash className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Información Extra</span>
            </div>
            <FormField
              control={form.control}
              name="metadata"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormControl>
                    <CustomFieldManager value={field.value} onChange={field.onChange} translationKey="cases" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECCIÓN 2: JUDICIAL */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Gavel className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm text-foreground/80 tracking-wide uppercase">Tribunales y Expediente</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="official_id"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">{t('official_id')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de Expediente..." className="bg-background/80" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="legal_area"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className="text-foreground/90">{t('legal_area')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/80">
                        <SelectValue placeholder="Seleccionar materia..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background/95 backdrop-blur-xl">
                      {['Civil', 'Familiar', 'Penal', 'Mercantil', 'Laboral', 'Administrativo', 'Amparo', 'Otro'].map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="court_name"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel className="text-foreground/90">{t('court_name')}</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Juzgado Tercero de lo Familiar..." className="bg-background/80" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        {/* SECCIÓN 3: FECHAS Y PLAZOS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <CalendarIcon className="w-4 h-4 text-primary" />
            <h3 className="font-medium text-sm text-foreground/80 tracking-wide uppercase">Plazos y Fechas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }: { field: any }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-foreground/90">{t('start_date')}</FormLabel>
                  <Popover>
                    <PopoverTrigger render={<Button variant="outline" className={cn("pl-3 text-left font-normal bg-background/80", !field.value && "text-muted-foreground")} />}>
                        {field.value ? format(field.value, "PP") : <span>Fecha de inicio</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur-xl" align="start">
                      <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <FormField
               control={form.control}
               name="end_date"
               render={({ field }: { field: any }) => (
                 <FormItem className="flex flex-col">
                   <FormLabel className="text-foreground/90">{t('end_date')}</FormLabel>
                   <Popover>
                     <PopoverTrigger render={<Button variant="outline" className={cn("pl-3 text-left font-normal bg-background/80", !field.value && "text-muted-foreground")} />}>
                         {field.value ? format(field.value, "PP") : <span>Fecha estimada</span>}
                         <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0 bg-background/95 backdrop-blur-xl" align="start">
                       <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                     </PopoverContent>
                   </Popover>
                 </FormItem>
               )}
             />
          </div>
        </div>

        {/* CONTROLES GLOBALES GUARDAR */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground hidden sm:block">
            Todos los expedientes están protegidos por cifrado y RLS.
          </p>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => window.history.back()}>
              Cerrar
            </Button>
            <Button type="submit" className="min-w-[150px] shadow-lg shadow-primary/20 font-semibold" disabled={isLoading}>
              {isLoading ? "Validando..." : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Concluir Registro
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
