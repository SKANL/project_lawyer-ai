'use client';

import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

interface DashboardHeaderProps {
  locale: string;
}

/**
 * DashboardHeader — barra superior fija con SidebarTrigger + breadcrumbs dinámicos.
 * Los breadcrumbs se generan automáticamente a partir de la ruta actual.
 */
export function DashboardHeader({ locale }: DashboardHeaderProps) {
  const pathname = usePathname();

  /** Genera segmentos de ruta sin el locale, ni segmentos vacíos */
  const segments = pathname
    .replace(`/${locale}`, '')
    .split('/')
    .filter(Boolean);

  /** Mapa de segmentos a etiquetas legibles en español */
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    cases: 'Expedientes',
    clients: 'Clientes',
    tasks: 'Tareas',
    studio: 'Studio Jurídico',
    templates: 'Plantillas',
    settings: 'Configuración',
    help: 'Ayuda',
    profile: 'Mi perfil',
    new: 'Nuevo',
  };

  const buildHref = (index: number) =>
    `/${locale}/${segments.slice(0, index + 1).join('/')}`;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />

        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const label = labelMap[segment] ?? segment;
              const href = buildHref(index);

              return (
                <Fragment key={segment}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href} className="text-muted-foreground">
                        {label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
