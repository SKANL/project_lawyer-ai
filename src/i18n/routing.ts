import { defineRouting } from 'next-intl/routing';

/**
 * Configuración de rutas i18n para next-intl.
 * Español es el idioma por defecto (LATAM primero).
 */
export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
});
