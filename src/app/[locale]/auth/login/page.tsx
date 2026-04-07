'use client';

import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { loginAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const params = useParams();
  const locale = params.locale as string;
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, isPending] = useActionState(loginAction, undefined);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Error global */}
      {state?.error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Formulario */}
      <form action={action} className="space-y-5">
        {/* Campo oculto para redirect */}
        <input type="hidden" name="redirectTo" value="/dashboard" />

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              {t('password')}
            </Label>
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              autoComplete="current-password"
              required
              disabled={isPending}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground pr-10 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all"
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

      {/* Link a registro */}
      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link
          href={`/${locale}/auth/register`}
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t('register')}
        </Link>
      </p>
    </div>
  );
}
