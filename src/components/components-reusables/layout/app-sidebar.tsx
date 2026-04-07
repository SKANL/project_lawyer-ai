'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CheckSquare,
  FileText,
  BookTemplate,
  Settings,
  HelpCircle,
  ChevronDown,
  Gavel,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AppSidebarProps {
  locale: string;
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  organization: {
    name: string;
    planTier: string;
  };
  onSignOut: () => void;
}

/**
 * AppSidebar — menú lateral principal de Abogado-Sala.
 * Construido con shadcn/ui Sidebar v4. Bilingüe con next-intl.
 * Resalta automáticamente la ruta activa con usePathname.
 */
export function AppSidebar({ locale, user, organization, onSignOut }: AppSidebarProps) {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  const isActive = (path: string) => {
    const fullPath = `/${locale}${path}`;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  const mainNav = [
    {
      label: t('dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: t('cases'),
      href: '/cases',
      icon: FolderOpen,
    },
    {
      label: t('clients'),
      href: '/clients',
      icon: Users,
    },
    {
      label: t('tasks'),
      href: '/tasks',
      icon: CheckSquare,
    },
  ];

  const studioNav = [
    {
      label: t('documents'),
      href: '/studio',
      icon: FileText,
    },
    {
      label: t('templates'),
      href: '/templates',
      icon: BookTemplate,
    },
  ];

  const bottomNav = [
    {
      label: t('settings'),
      href: '/settings',
      icon: Settings,
    },
    {
      label: t('help'),
      href: '/help',
      icon: HelpCircle,
    },
  ];

  const getPlanLabel = (tier: string) => {
    const map: Record<string, string> = {
      trial: 'Prueba',
      starter: 'Básico',
      pro: 'Profesional',
      firm: 'Despacho',
    };
    return map[tier] ?? tier;
  };

  const getPlanVariant = (tier: string): 'default' | 'secondary' | 'outline' => {
    if (tier === 'pro' || tier === 'firm') return 'default';
    if (tier === 'starter') return 'secondary';
    return 'outline';
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header: Logo + nombre del despacho */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Gavel className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{organization.name}</p>
            <Badge
              variant={getPlanVariant(organization.planTier)}
              className="mt-0.5 h-4 px-1.5 text-[10px]"
            >
              {getPlanLabel(organization.planTier)}
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {/* Navegación principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground/60">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={`/${locale}${item.href}`} />}
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className="transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Studio Jurídico */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase text-muted-foreground/60">
            Studio Jurídico
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {studioNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={`/${locale}${item.href}`} />}
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className="transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: ajustes + perfil */}
      <SidebarFooter className="gap-0 p-2">
        <SidebarMenu>
          {bottomNav.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton render={<Link href={`/${locale}${item.href}`} />} tooltip={item.label} className="transition-colors">
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        {/* Tarjeta de perfil con dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <SidebarMenuButton
              size="lg"
              className="w-full cursor-pointer data-[state=open]:bg-sidebar-accent"
            />
          }>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium leading-tight">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-[--radix-popper-anchor-width] min-w-56"
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={`/${locale}/settings/profile`} />}>
              <Settings className="mr-2 h-4 w-4" />
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/${locale}/settings`} />}>
              <Settings className="mr-2 h-4 w-4" />
              {t('organization')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onSignOut}
              className="text-destructive focus:text-destructive"
            >
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
