import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Toaster } from '@/components/ui/sonner';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

/** Genera metadata dinámica por locale */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: {
      default: locale === 'es' ? 'Abogado-Sala — Tu despacho, en digital.' : 'Abogado-Sala — Your firm, digitized.',
      template: '%s | Abogado-Sala',
    },
    description:
      locale === 'es'
        ? 'Plataforma de gestión legal para abogados en Latinoamérica.'
        : 'Legal practice management for attorneys in Latin America.',
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validar locale
  if (!routing.locales.includes(locale as 'es' | 'en')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster richColors position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
