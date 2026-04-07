import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Abogado-Sala — Tu despacho, en digital.',
    template: '%s | Abogado-Sala',
  },
  description:
    'Plataforma de gestión legal para abogados independientes y despachos en Latinoamérica. Gestiona clientes, expedientes, documentos y más.',
  keywords: ['abogado', 'despacho legal', 'gestión legal', 'software legal', 'expedientes'],
  robots: 'noindex, nofollow', // App privada — sin indexación
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
