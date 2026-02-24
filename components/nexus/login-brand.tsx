import { NexusLogo } from './nexus-logo'

const features = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: 'Dashboard en tiempo real',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: 'Gestión de usuarios y permisos',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    label: 'Reportes y analíticas avanzadas',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
    label: 'Integraciones Wansoft & más',
  },
]

export function LoginBrand() {
  return (
    <div className="hidden lg:flex w-[520px] flex-shrink-0 flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-foreground" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-primary/30" />
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #0DA2E7 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-accent/20 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/25 blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full p-12 justify-between">
        {/* Top: logo + brand */}
        <div>
          <div className="flex items-center gap-3 mb-16">
            <NexusLogo size={44} />
            <div>
              <span
                className="text-3xl font-bold bg-gradient-to-r from-accent via-accent to-primary bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Nexus
              </span>
              <p className="text-xs text-white/40 tracking-widest uppercase mt-0.5">by Montek</p>
            </div>
          </div>

          <h2
            className="text-4xl font-bold text-white leading-tight mb-4 text-balance"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Controla todo tu negocio desde un solo lugar
          </h2>
          <p className="text-white/50 text-base leading-relaxed">
            Plataforma administrativa integral con acceso a reportes, nómina, contabilidad e integraciones en tiempo real.
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                {f.icon}
              </div>
              <span className="text-white/70 text-sm">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom label */}
        <div className="flex items-center gap-2 mt-12">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-white/30 text-xs tracking-wide">montek.com.mx/nexus</span>
        </div>
      </div>
    </div>
  )
}
