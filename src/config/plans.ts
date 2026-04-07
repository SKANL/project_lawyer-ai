/**
 * Configuración de los planes de suscripción.
 * Refleja el modelo de precios del implementation_plan.md §3
 * Psicología de precios: Pro es el target, Firm es el decoy.
 */

export type PlanTier = 'trial' | 'starter' | 'pro' | 'firm';

export interface PlanConfig {
  tier: PlanTier;
  /** Nombre público */
  name: { es: string; en: string };
  /** Descripción corta */
  description: { es: string; en: string };
  /** Precio mensual en USD */
  priceMonthly: number;
  /** Precio anual en USD (por mes) */
  priceAnnual: number;
  /** Límites del plan */
  limits: {
    clients: number;
    members: number;
    storageBytes: number;
  };
  /** Features incluidas */
  features: { es: string; en: string }[];
  /** Si es el plan "más popular" (badge visual) */
  featured: boolean;
  /** Color del badge/highlight */
  highlightColor: string;
}

export const PLANS: PlanConfig[] = [
  {
    tier: 'trial',
    name: { es: 'Prueba Gratuita', en: 'Free Trial' },
    description: { es: '14 días sin tarjeta de crédito', en: '14 days, no credit card' },
    priceMonthly: 0,
    priceAnnual: 0,
    limits: { clients: 10, members: 1, storageBytes: 524_288_000 },
    features: [
      { es: 'Hasta 10 clientes', en: 'Up to 10 clients' },
      { es: '1 usuario', en: '1 user' },
      { es: '500 MB de almacenamiento', en: '500 MB storage' },
      { es: 'Plantillas de expediente', en: 'Case templates' },
      { es: 'Portal de cliente', en: 'Client portal' },
    ],
    featured: false,
    highlightColor: 'text-slate-500',
  },
  {
    tier: 'starter',
    name: { es: 'Básico', en: 'Starter' },
    description: { es: 'Para el abogado independiente', en: 'For the solo attorney' },
    priceMonthly: 19,
    priceAnnual: 15, // ~20% descuento
    limits: { clients: 50, members: 1, storageBytes: 1_073_741_824 },
    features: [
      { es: 'Hasta 50 clientes', en: 'Up to 50 clients' },
      { es: '1 usuario', en: '1 user' },
      { es: '1 GB de almacenamiento', en: '1 GB storage' },
      { es: 'Plantillas de expediente', en: 'Case templates' },
      { es: 'Portal de cliente', en: 'Client portal' },
      { es: 'Facturación básica', en: 'Basic billing' },
    ],
    featured: false,
    highlightColor: 'text-slate-400',
  },
  {
    tier: 'pro',
    name: { es: 'Profesional', en: 'Professional' },
    description: { es: 'El preferido por abogados en crecimiento', en: 'Preferred by growing attorneys' },
    priceMonthly: 49,
    priceAnnual: 39, // ~20% descuento
    limits: { clients: 500, members: 5, storageBytes: 5_368_709_120 },
    features: [
      { es: 'Hasta 500 clientes', en: 'Up to 500 clients' },
      { es: 'Hasta 5 usuarios', en: 'Up to 5 users' },
      { es: '5 GB de almacenamiento', en: '5 GB storage' },
      { es: 'Plantillas de expediente', en: 'Case templates' },
      { es: 'Portal de cliente', en: 'Client portal' },
      { es: 'Facturación completa', en: 'Full billing' },
      { es: 'White label del portal', en: 'Portal white label' },
      { es: 'Reportes y estadísticas', en: 'Reports & analytics' },
      { es: 'Soporte prioritario', en: 'Priority support' },
    ],
    featured: true, // ← EL PLAN TARGET
    highlightColor: 'text-indigo-400',
  },
  {
    tier: 'firm',
    name: { es: 'Despacho', en: 'Firm' },
    description: { es: 'Para despachos con equipo grande', en: 'For large legal teams' },
    priceMonthly: 149,
    priceAnnual: 119,
    limits: { clients: 9999, members: 50, storageBytes: 21_474_836_480 },
    features: [
      { es: 'Clientes ilimitados', en: 'Unlimited clients' },
      { es: 'Hasta 50 usuarios', en: 'Up to 50 users' },
      { es: '20 GB de almacenamiento', en: '20 GB storage' },
      { es: 'Todo lo del plan Profesional', en: 'Everything in Professional' },
      { es: 'Reportes avanzados', en: 'Advanced reports' },
      { es: 'Soporte dedicado', en: 'Dedicated support' },
      { es: 'Acceso a API', en: 'API access' },
    ],
    featured: false, // ← DECOY (hace que Pro parezca barato)
    highlightColor: 'text-amber-400',
  },
];

/** Obtiene un plan por tier */
export function getPlan(tier: PlanTier): PlanConfig {
  const plan = PLANS.find((p) => p.tier === tier);
  if (!plan) throw new Error(`Plan no encontrado: ${tier}`);
  return plan;
}
