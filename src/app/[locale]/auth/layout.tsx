import { BRAND } from '@/config/brand';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Panel izquierdo — Branding (solo escritorio) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
        {/* Orbes de fondo decorativos */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              {BRAND.name}
            </span>
          </div>
        </div>

        {/* Quote central */}
        <div className="relative z-10 space-y-6">
          <blockquote className="text-3xl font-serif text-white/90 leading-snug italic">
            &ldquo;Organiza tu despacho.<br />Recupera tu tiempo.<br />Sirve mejor a tus clientes.&rdquo;
          </blockquote>

          {/* Social proof */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['AB', 'MR', 'CL', 'JV'].map((initials) => (
                <div
                  key={initials}
                  className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-900"
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-slate-300 text-sm">
              Únete a <strong className="text-white">+500 abogados</strong> que ya digitalizaron su práctica
            </p>
          </div>
        </div>

        {/* Footer del panel */}
        <p className="relative z-10 text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} {BRAND.name} · {BRAND.tagline.es}
        </p>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <span className="text-foreground font-semibold text-base">{BRAND.name}</span>
        </div>

        <div className="w-full max-w-sm animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
