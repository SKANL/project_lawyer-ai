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
import { User, Mail, Phone, Hash, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Definición del esquema con Zod
const clientSchema = z.object({
  full_name: z.string().min(3, { message: "Min 3 characters" }),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  tax_id: z.string().optional(),
  type: z.enum(['individual', 'company']).default('individual'),
  address: z.string().optional(),
  birthday: z.date().optional().nullable(),
  status: z.enum(['prospect', 'active', 'archived']).default('active'),
  metadata: z.record(z.string(), z.any()).default({}),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientFormProps {
  initialData?: Partial<ClientFormValues>;
  onSubmit: (data: ClientFormValues) => void;
  isLoading?: boolean;
}

export function ClientForm({ initialData, onSubmit, isLoading }: ClientFormProps) {
  const t = useTranslations('clients.fields');
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema) as any,
    defaultValues: {
      full_name: initialData?.full_name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      tax_id: initialData?.tax_id || '',
      type: initialData?.type || 'individual',
      address: initialData?.address || '',
      birthday: initialData?.birthday ? new Date(initialData.birthday) : null,
      status: initialData?.status || 'active',
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
                <User className="h-5 w-5 text-primary" />
                {t('full_name')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>{t('full_name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t('type')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo...">
                            {(val) => val ? t(val as any) : "Seleccionar tipo..."}
                          </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">{t('individual')}</SelectItem>
                          <SelectItem value="company">{t('company')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_id"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Hash className="h-3 w-3" /> {t('tax_id')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="RFC / NIT" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5 text-primary" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>{t('phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder="+52 55..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="birthday"
                render={({ field }: { field: any }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('birthday')}</FormLabel>
                    <Popover>
                      <PopoverTrigger 
                        render={
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          />
                        }
                      >
                        {field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
             <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" /> {t('address')}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Dirección completa..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
             </Card>

             <FormField
                control={form.control}
                name="metadata"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormControl>
                      <CustomFieldManager 
                        value={field.value} 
                        onChange={field.onChange} 
                        translationKey="clients"
                      />
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
            {isLoading ? "Guardando..." : "Guardar Cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
