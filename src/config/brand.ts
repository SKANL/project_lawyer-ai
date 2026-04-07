/**
 * Configuración central de marca — Abogado-Sala
 * Para cambiar la marca completa de la plataforma, solo modifica este archivo.
 * @see implementation_plan.md §9
 */
export const BRAND = {
  name: 'Abogado-Sala',
  shortName: 'AbogadoSala',
  tagline: {
    es: 'Tu despacho, en digital.',
    en: 'Your firm, digitized.',
  },
  supportEmail: 'soporte@abogado-sala.com',
  docsUrl: 'https://docs.abogado-sala.com',
  twitterHandle: '@AbogadoSala',
  /** URL de la landing pública */
  marketingUrl: 'https://abogado-sala.com',
} as const;

export type BrandConfig = typeof BRAND;
