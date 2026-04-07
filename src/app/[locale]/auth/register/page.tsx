'use client';

import { useTranslations } from 'next-intl';
import { useActionState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { registerAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const params = useParams();
  const locale = params.locale as string;
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [state, action, isPending] = useActionState(registerAction, undefined);

  const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 4 ? 'medium' : 'weak';

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
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
      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
            {t('fullName')}
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder={t('fullNamePlaceholder')}
            autoComplete="name"
            autoFocus
            required
            disabled={isPending}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

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
            required
            disabled={isPending}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            {t('password')}
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordPlaceholder')}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {/* Indicador de fortaleza de contraseña */}
          {password.length > 0 && (
            <div className="flex gap-1.5 mt-1.5">
              {['weak', 'medium', 'strong'].map((level, i) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    (passwordStrength === 'weak' && i === 0) ||
                    (passwordStrength === 'medium' && i <= 1) ||
                    (passwordStrength === 'strong' && i <= 2)
                      ? passwordStrength === 'weak'
                        ? 'bg-destructive'
                        : passwordStrength === 'medium'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      : 'bg-border'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all mt-2"
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

      {/* Terms */}
      <p className="text-center text-xs text-muted-foreground">
        {t('terms')}{' '}
        <Link href="/legal/terms" className="underline hover:text-foreground transition-colors">
          {t('termsLink')}
        </Link>
      </p>

      {/* Link a login */}
      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link
          href={`/${locale}/auth/login`}
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t('login')}
        </Link>
      </p>
    </div>
  );
}
