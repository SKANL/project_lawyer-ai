import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import {
  Users,
  FolderOpen,
  CheckSquare,
  FileText,
  TrendingUp,
  ArrowRight,
  Clock,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

/**
 * Obtiene métricas básicas del despacho para el dashboard.
 * Ejecuta queries en paralelo para máxima performance.
 */
async function getDashboardStats(orgId: string) {
  const supabase = await createClient();

  const [clientsRes, casesRes, tasksRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active'),
    supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .not('status', 'eq', 'closed'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'pending'),
  ]);

  return {
    activeClients: clientsRes.count ?? 0,
    openCases: casesRes.count ?? 0,
    pendingTasks: tasksRes.count ?? 0,
  };
}

/**
 * Obtiene los expedientes más recientes para la sección de actividad.
 */
async function getRecentCases(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('cases')
    .select('id, title, status, created_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })
    .limit(5);
  return data ?? [];
}

const caseStatusColors: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  active: 'bg-primary/10 text-primary border-primary/20 font-bold',
  review: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  suspended: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

const caseStatusLabels: Record<string, string> = {
  draft: 'Borrador',
  active: 'En Trámite',
  review: 'En Revisión',
  suspended: 'Pausado',
  closed: 'Finalizado',
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard');
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile?.org_id) redirect(`/${locale}/onboarding`);

  const [stats, recentCases] = await Promise.all([
    getDashboardStats(profile.org_id),
    getRecentCases(profile.org_id),
  ]);

  const statCards = [
    {
      title: t('stats.activeClients'),
      value: stats.activeClients,
      icon: Users,
      href: `/${locale}/clients`,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: t('stats.openCases'),
      value: stats.openCases,
      icon: FolderOpen,
      href: `/${locale}/cases`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: t('stats.pendingTasks'),
      value: stats.pendingTasks,
      icon: CheckSquare,
      href: `/${locale}/tasks`,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      title: t('stats.documentsThisMonth'),
      value: 0,
      icon: FileText,
      href: `/${locale}/studio`,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
  ];

  const quickActions = [
    {
      label: t('quickActions.newCase'),
      href: `/${locale}/cases/new`,
      icon: FolderOpen,
      primary: true,
    },
    { label: t('quickActions.newClient'), href: `/${locale}/clients/new`, icon: Users },
    { label: t('quickActions.newDocument'), href: `/${locale}/studio/new`, icon: FileText },
    { label: t('quickActions.newTask'), href: `/${locale}/tasks/new`, icon: CheckSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('welcome')}</h1>
          <p className="text-sm text-muted-foreground">{t('overview')}</p>
        </div>
        <Link href={`/${locale}/cases/new`} className={buttonVariants({ variant: 'default' })}>
          <Plus className="mr-2 h-4 w-4" />
          {t('quickActions.newCase')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href} className="group">
            <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-md p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    Ver detalles →
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base">{t('recentCases.title')}</CardTitle>
              <CardDescription>Últimas actualizaciones de tus expedientes</CardDescription>
            </div>
            <Link href={`/${locale}/cases`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              {t('recentCases.viewAll')}
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  {t('recentCases.empty')}
                </p>
                <Link href={`/${locale}/cases/new`} className={buttonVariants({ variant: 'outline', size: 'sm', className: "w-full justify-start mt-2" })}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('quickActions.newCase')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/${locale}/cases/${c.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-medium leading-tight">{c.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(c.created_at).toLocaleDateString(
                            locale === 'es' ? 'es-MX' : 'en-US',
                            { month: 'short', day: 'numeric' },
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`shrink-0 border text-xs ${caseStatusColors[c.status] ?? ''}`}
                      variant="outline"
                    >
                      {caseStatusLabels[c.status] ?? c.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{t('quickActions.title')}</CardTitle>
            <CardDescription>Crea nuevos elementos rápidamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <Link 
                key={action.href}
                href={action.href} 
                className={buttonVariants({ variant: action.primary ? 'default' : 'outline', className: "w-full justify-start h-12" })}
              >
                <action.icon className="mr-3 h-5 w-5 text-muted-foreground" />
                {action.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
