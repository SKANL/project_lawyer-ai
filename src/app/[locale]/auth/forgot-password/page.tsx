'use client';

import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { forgotPasswordAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, Loader2, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const params = useParams();
  const locale = params.locale as string;
  const [state, action, isPending] = useActionState(forgotPasswordAction, undefined);

  if (state?.success) {
    return (
      <div className="space-y-6 text-center animate-fade-in">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <Mail className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">{t('success')}</h1>
          <p className="text-sm text-muted-foreground">{t('successMessage', { email: '...' })}</p>
        </div>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {state?.error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={action} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            {t('email')}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            autoFocus
            required
            disabled={isPending}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('submitting')}
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </form>

      <Link
        href={`/${locale}/auth/login`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToLogin')}
      </Link>
    </div>
  );
}
