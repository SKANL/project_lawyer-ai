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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Hash, Gavel, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const caseSchema = z.object({
  title: z.string().min(3, { message: "Min 3 characters" }),
  client_id: z.string().uuid({ message: "Select a client" }),
  official_id: z.string().optional(),
  court_name: z.string().optional(),
  legal_area: z.string().optional(),
  legal_action: z.string().optional(),
  opposition_party: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'pending_docs', 'review', 'suspended', 'completed', 'cancelled', 'archived']).default('in_progress'),
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
      status: initialData?.status || 'in_progress',
      start_date: initialData?.start_date ? new Date(initialData.start_date) : null,
      end_date: initialData?.end_date ? new Date(initialData.end_date) : null,
      notes: initialData?.notes || '',
      metadata: initialData?.metadata || {},
    } as any,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Información del Caso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t('title')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Divorcio Incausado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_id"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t('client')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t('status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['draft', 'in_progress', 'pending_docs', 'review', 'suspended', 'completed', 'cancelled', 'archived'].map(s => (
                          <SelectItem key={s} value={s}>{ts(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gavel className="h-5 w-5 text-primary" />
                Detalles Legales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="official_id"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t('official_id')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Exp. N°" {...field} />
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
                      <FormLabel>{t('legal_area')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Familiar" {...field} />
                      </FormControl>
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
                    <FormLabel>{t('court_name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Juzgado..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }: { field: any }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('start_date')}</FormLabel>
                      <Popover>
                        <PopoverTrigger render={<Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} />}>
                          {field.value ? format(field.value, "PP") : <span>Fecha</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
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
                       <FormLabel>{t('end_date')}</FormLabel>
                       <Popover>
                         <PopoverTrigger render={<Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")} />}>
                           {field.value ? format(field.value, "PP") : <span>Estimada</span>}
                           <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                         </PopoverTrigger>
                         <PopoverContent className="w-auto p-0" align="start">
                           <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                         </PopoverContent>
                       </Popover>
                     </FormItem>
                   )}
                 />
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
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

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button type="button" variant="ghost" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button type="submit" className="min-w-[120px]" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Expediente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
