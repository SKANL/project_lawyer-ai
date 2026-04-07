'use client';

import { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MoreHorizontal, User, Mail, Phone, Briefcase, Edit, Trash2, Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const clientSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  type: z.enum(['individual', 'company']),
  status: z.enum(['active', 'prospect', 'archived']),
  tax_id: z.string().nullable(),
  birthday: z.string().nullable(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string(),
});

type Client = z.infer<typeof clientSchema>;

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

/**
 * ClientList — Visualización de CRM con filtros rápidos.
 */
export function ClientList({ clients, onEdit, onDelete, onViewDetails }: ClientListProps) {
  const t = useTranslations('clients');
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.tax_id?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: Client['status']) => {
    const variants = {
      active: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
      prospect: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
      archived: "bg-muted text-muted-foreground"
    };
    return <Badge variant="outline" className={variants[status]}>{t(`status.${status}`)}</Badge>;
  };

  const getTypeIcon = (type: Client['type']) => {
    return type === 'company' ? <Briefcase className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y acciones */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 border-border/50 bg-background/50 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Contenedor de la tabla */}
      <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[30%]">{t('fields.full_name')}</TableHead>
              <TableHead>{t('fields.type')}</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>{t('fields.status')}</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {t('empty_state')}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {getTypeIcon(client.type)}
                      </div>
                      <div className="flex flex-col">
                        <span className="truncate max-w-[200px]">{client.full_name}</span>
                        {client.tax_id && (
                          <span className="text-[10px] text-muted-foreground uppercase">{client.tax_id}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                       {t(`fields.${client.type}`)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(client.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 group-hover:bg-background" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetails(client.id)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Expedientes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" /> {t('edit_client')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(client.id)}
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
