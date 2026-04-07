'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { ClientList } from '@/components/components-reusables/clients/client-list';
import { ClientForm } from '@/components/components-reusables/clients/client-form';
import { createClient } from '@/lib/supabase/client';
import { createClientMutation, updateClient } from '@/actions/clients';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  type: 'individual' | 'company';
  status: 'prospect' | 'active' | 'archived';
  tax_id: string | null;
  birthday: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface ClientsClientProps {
  initialClients: Client[];
  orgId: string;
  userId: string;
}

/**
 * ClientsClient — Controlador de UI para el CRM.
 * Gestiona el estado de apertura de diálogos y las mutaciones en Supabase.
 */
export function ClientsClient({ initialClients, orgId, userId }: ClientsClientProps) {
  const t = useTranslations('clients');
  const router = useRouter();
  const supabase = createClient();
  
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenNew = () => {
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, values);
        toast.success("Cliente actualizado con éxito");
      } else {
        await createClientMutation(values, orgId, userId);
        toast.success("Nuevo cliente registrado");
      }

      setIsDialogOpen(false);
      router.refresh(); // Refrescar datos del server
      
      // Actualización local temporal para UX inmediata
      const { data: updatedClients } = await supabase
        .from('clients')
        .select('*')
        .eq('org_id', orgId)
        .order('full_name');
      
      if (updatedClients) setClients(updatedClients as any);
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al procesar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este cliente? Se perderá el historial asociado.")) return;

    try {
       const { error } = await supabase.from('clients').delete().eq('id', id);
       if (error) throw error;
       toast.success("Cliente eliminado");
       setClients(clients.filter(c => c.id !== id));
    } catch (error: any) {
       toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={handleOpenNew} className="shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" />
          {t('new_client')}
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="flex h-[450px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 backdrop-blur-sm text-center p-8 animate-in fade-in duration-700">
          <div className="mb-4 rounded-full bg-primary/10 p-6">
            <UserPlus className="h-12 w-12 text-primary/60" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t('empty_state')}</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            {t('empty_description')}
          </p>
          <Button size="lg" onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            {t('new_client')}
          </Button>
        </div>
      ) : (
        <ClientList 
          clients={clients} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          onViewDetails={(id) => router.push(`/${window.location.pathname.split('/')[1]}/clients/${id}`)}
        />
      )}

      {/* DIÁLOGO CREAR/EDITAR */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <DialogHeader>
            <DialogTitle>{editingClient ? t('edit_client') : t('new_client')}</DialogTitle>
            <DialogDescription>
              Complete la información legal del cliente. Podrá agregar campos personalizados al final.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
              <ClientForm 
                initialData={editingClient ? {
                   ...editingClient,
                   email: editingClient.email ?? undefined,
                   phone: editingClient.phone ?? undefined,
                   tax_id: editingClient.tax_id ?? undefined,
                   birthday: editingClient.birthday ? new Date(editingClient.birthday) : undefined
                } : {}} 
                onSubmit={handleSubmit} 
                isLoading={isSubmitting} 
              />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
