'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { BRAND } from '@/config/brand';
import { PLANS } from '@/config/plans';
import { createOrganizationAction, completeOnboardingAction } from '@/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  CreditCard,
  Users,
  FileText,
  Sparkles,
  Check,
  Loader2,
  ChevronRight,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Tipos ─────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual';

interface WizardState {
  orgName: string;
  countryCode: string;
  selectedPlan: 'trial' | 'starter' | 'pro' | 'firm';
  billingCycle: BillingCycle;
  orgId?: string;
}

// ── Constantes ────────────────────────────────────────────────

const TOTAL_STEPS = 5;
const STEPS = [
  { icon: Building2, labelEs: 'Tu despacho',  labelEn: 'Your firm' },
  { icon: CreditCard, labelEs: 'Elige tu plan', labelEn: 'Choose plan' },
  { icon: Users,      labelEs: 'Equipo',         labelEn: 'Team' },
  { icon: FileText,   labelEs: 'Plantilla',       labelEn: 'Template' },
  { icon: Sparkles,   labelEs: '¡Listo!',         labelEn: 'Done!' },
];

const COUNTRIES = [
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'OTHER', name: 'Otro' },
];

// ── Componente principal ──────────────────────────────────────

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<WizardState>({
    orgName: '',
    countryCode: 'MX',
    selectedPlan: 'pro', // Pro preseleccionado (plan target)
    billingCycle: 'annual',
  });

  const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  // ── Handlers ───────────────────────────────────────────────

  async function handleOrgStep() {
    if (!state.orgName.trim()) {
      toast.error('El nombre del despacho es requerido');
      return;
    }
    setIsLoading(true);
    try {
      const result = await createOrganizationAction({
        orgName: state.orgName.trim(),
        countryCode: state.countryCode,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        setState((prev) => ({ ...prev, orgId: result.orgId }));
        setCurrentStep(2);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleComplete() {
    setIsLoading(true);
    try {
      if (state.orgId) {
        await completeOnboardingAction(state.orgId);
      }
      router.push(`/${locale}/dashboard`);
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header con logo y progress */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">{BRAND.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {t('stepOf', { current: currentStep, total: TOTAL_STEPS })}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="max-w-2xl mx-auto">
          <Progress value={progress} className="h-1 bg-border" />
        </div>
      </div>

      {/* Steps indicator */}
      <div className="px-6 py-4 border-b border-border/30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {STEPS.map((step, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const Icon = step.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {locale === 'es' ? step.labelEs : step.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido del paso */}
      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-2xl animate-fade-in" key={currentStep}>
          {/* ── PASO 1: Nombre del despacho ─────────────────── */}
          {currentStep === 1 && (
            <StepOrganization
              state={state}
              setState={setState}
              onNext={handleOrgStep}
              isLoading={isLoading}
            />
          )}

          {/* ── PASO 2: Selección de plan ───────────────────── */}
          {currentStep === 2 && (
            <StepPlan
              state={state}
              setState={setState}
              onNext={() => setCurrentStep(3)}
            />
          )}

          {/* ── PASO 3: Equipo ──────────────────────────────── */}
          {currentStep === 3 && (
            <StepTeam
              onNext={() => setCurrentStep(4)}
              onSkip={() => setCurrentStep(4)}
            />
          )}

          {/* ── PASO 4: Plantilla ───────────────────────────── */}
          {currentStep === 4 && (
            <StepTemplate
              onNext={() => setCurrentStep(5)}
              onSkip={() => setCurrentStep(5)}
            />
          )}

          {/* ── PASO 5: Bienvenida ──────────────────────────── */}
          {currentStep === 5 && (
            <StepWelcome
              orgName={state.orgName}
              onComplete={handleComplete}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sub-componentes por paso ──────────────────────────────────

function StepOrganization({
  state,
  setState,
  onNext,
  isLoading,
}: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Tu despacho</h2>
        <p className="text-muted-foreground">¿Cómo se llama tu despacho o práctica legal?</p>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="orgName">Nombre del despacho</Label>
          <Input
            id="orgName"
            autoFocus
            placeholder="Ej: Pérez & Asociados, S.C."
            value={state.orgName}
            onChange={(e) => setState((prev) => ({ ...prev, orgName: e.target.value }))}
            className="text-base bg-input h-12"
            onKeyDown={(e) => e.key === 'Enter' && onNext()}
          />
          <p className="text-xs text-muted-foreground">
            Puedes cambiarlo después desde la configuración.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="countryCode">País</Label>
          <select
            id="countryCode"
            value={state.countryCode}
            onChange={(e) => setState((prev) => ({ ...prev, countryCode: e.target.value }))}
            className="w-full h-12 rounded-md border border-border bg-input px-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={isLoading || !state.orgName.trim()}
        className="w-full h-11 bg-primary hover:bg-primary/90 font-medium"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Continuar <ChevronRight className="ml-1 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

function StepPlan({
  state,
  setState,
  onNext,
}: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
}) {
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Elige tu plan</h2>
        <p className="text-muted-foreground">Comienza gratis 14 días. Sin tarjeta de crédito.</p>
      </div>

      {/* Toggle mensual / anual */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setState((prev) => ({ ...prev, billingCycle: 'monthly' }))}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            state.billingCycle === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Mensual
        </button>
        <button
          onClick={() => setState((prev) => ({ ...prev, billingCycle: 'annual' }))}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
            state.billingCycle === 'annual'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Anual
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
            {tCommon('savePercent', { percent: '20' })}
          </span>
        </button>
      </div>

      {/* Cards de planes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map((plan) => {
          const price = state.billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
          const isSelected = state.selectedPlan === plan.tier;
          return (
            <button
              key={plan.tier}
              onClick={() => setState((prev) => ({ ...prev, selectedPlan: plan.tier }))}
              className={`relative text-left p-5 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                  : 'border-border bg-card hover:border-border/70'
              }`}
            >
              {/* Badge "Más Popular" */}
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3 shadow">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {tCommon('mostPopular')}
                  </Badge>
                </div>
              )}

              {/* Check de selección */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground">{plan.name.es}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description.es}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">
                    {price === 0 ? 'Gratis' : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-xs text-muted-foreground">{tCommon('perMonth')}</span>
                  )}
                </div>

                <ul className="space-y-1.5">
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary shrink-0" />
                      {feature.es}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      <Button
        onClick={onNext}
        className="w-full h-11 bg-primary hover:bg-primary/90 font-medium"
      >
        Continuar con {PLANS.find((p) => p.tier === state.selectedPlan)?.name.es}
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function StepTeam({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [email, setEmail] = useState<string>('');
  const [invited, setInvited] = useState<string[]>([]);

  function handleInvite() {
    if (email.trim() && !invited.includes(email.trim())) {
      setInvited((prev) => [...prev, email.trim()]);
      setEmail('');
      toast.success(`Invitación enviada a ${email.trim()}`);
    }
  }

  function useState<T>(initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    return (window as never as { React: typeof import('react') }).React.useState(initialValue);
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Invita a tu equipo</h2>
        <p className="text-muted-foreground">¿Trabajas con alguien más? Puedes invitarlos ahora o después.</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="colega@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
          />
          <Button onClick={handleInvite} variant="outline" className="border-border">
            Agregar
          </Button>
        </div>

        {invited.length > 0 && (
          <div className="space-y-2">
            {invited.map((inv) => (
              <div key={inv} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                {inv}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onSkip} className="flex-1 text-muted-foreground">
          Omitir por ahora
        </Button>
        <Button onClick={onNext} className="flex-1 bg-primary hover:bg-primary/90">
          Continuar <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepTemplate({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const SAMPLE_TEMPLATES = [
    { id: '1', name: 'Contrato de Prestación de Servicios', category: 'Contratos', icon: '📄' },
    { id: '2', name: 'Poder Notarial General', category: 'Poderes', icon: '✍️' },
    { id: '3', name: 'Convenio de Confidencialidad', category: 'Corporativo', icon: '🔒' },
    { id: '4', name: 'Demanda Civil', category: 'Litigios', icon: '⚖️' },
  ];

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Tu primera plantilla</h2>
        <p className="text-muted-foreground">Elige una plantilla para empezar tu primer expediente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SAMPLE_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setSelected(tmpl.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              selected === tmpl.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-border/70'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{tmpl.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{tmpl.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tmpl.category}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onSkip} className="flex-1 text-muted-foreground">
          Omitir por ahora
        </Button>
        <Button onClick={onNext} className="flex-1 bg-primary hover:bg-primary/90">
          {selected ? 'Usar esta plantilla' : 'Continuar'}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepWelcome({
  orgName,
  onComplete,
  isLoading,
}: {
  orgName: string;
  onComplete: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-8 text-center">
      {/* Icono animado */}
      <div className="mx-auto w-20 h-20 rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
        <Sparkles className="h-10 w-10 text-white" />
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-foreground">
          ¡Todo listo!
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          Tu despacho <strong className="text-foreground">{orgName || 'Abogado-Sala'}</strong> está
          configurado. Comienza a gestionar tus expedientes, clientes y documentos.
        </p>
      </div>

      {/* Features que tienen disponibles */}
      <div className="grid grid-cols-3 gap-4 py-4">
        {[
          { icon: FileText, label: 'Expedientes' },
          { icon: Users, label: 'Clientes' },
          { icon: Building2, label: 'Despacho' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={onComplete}
        disabled={isLoading}
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 font-medium h-12 text-base"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Ir al dashboard
            <ChevronRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
}
