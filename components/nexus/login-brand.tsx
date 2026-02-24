import { NexusLogo } from './nexus-logo'

const features = [
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    label: 'Dashboard en tiempo real',
    desc: 'Métricas y actividad actualizadas al instante.',
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: 'Gestión de usuarios y permisos',
    desc: 'Control granular sobre accesos y roles.',
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    label: 'Reportes y analíticas avanzadas',
    desc: 'Balanza, nómina, contabilidad y más.',
  },
  {
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
    label: 'Integraciones Wansoft & más',
    desc: 'Conectado con tu ERP sin fricción.',
  },
]

export function LoginBrand() {
  return (
    <div className="hidden lg:flex w-[500px] flex-shrink-0 flex-col relative overflow-hidden">
      {/* Deep navy background */}
      <div className="absolute inset-0" style={{ background: 'oklch(0.12 0.025 258)' }} />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(oklch(0.6 0.18 212) 1px, transparent 1px), linear-gradient(90deg, oklch(0.6 0.18 212) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow top-left */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.6 0.18 212), transparent 70%)' }}
      />
      {/* Glow bottom-right */}
      <div className="absolute -bottom-20 -right-10 w-72 h-72 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, oklch(0.44 0.22 290), transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col h-full p-12 justify-between">
        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-14">
            <NexusLogo size={40} />
            <div>
              <span
                className="text-2xl font-bold text-white leading-none"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Nexus
              </span>
              <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: 'oklch(0.58 0.018 245)' }}>
                by Montek
              </p>
            </div>
          </div>

          <h2
            className="text-[2.15rem] font-bold text-white leading-tight mb-4 text-balance"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Controla todo tu negocio desde un solo lugar
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'oklch(0.62 0.018 245)' }}>
            Plataforma administrativa integral con acceso a reportes, nómina, contabilidad e integraciones en tiempo real.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'oklch(0.6 0.175 212 / 0.12)', color: 'oklch(0.6 0.175 212)', border: '1px solid oklch(0.6 0.175 212 / 0.2)' }}
              >
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-white leading-snug">{f.label}</p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'oklch(0.55 0.018 245)' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-8">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'oklch(0.6 0.175 212)' }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: 'oklch(0.6 0.175 212)' }} />
          </span>
          <span className="text-xs tracking-wide" style={{ color: 'oklch(0.42 0.018 245)' }}>montek.com.mx</span>
        </div>
      </div>
    </div>
  )
}
