'use client'

import { cn } from '@/lib/utils'

/* ── Stat Card ──────────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: string
  change: string
  positive: boolean
  icon: React.ReactNode
  accent?: boolean
}

export function StatCard({ label, value, change, positive, icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border p-5 overflow-hidden transition-all duration-200 group',
        'hover:-translate-y-1 hover:shadow-lg',
        accent
          ? 'bg-gradient-to-br from-accent/10 via-card to-primary/5 border-accent/20 hover:shadow-accent/10'
          : 'bg-card border-border hover:border-accent/20 hover:shadow-accent/5'
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              accent
                ? 'bg-accent/15 text-accent'
                : 'bg-secondary text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-200'
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-1 rounded-lg',
              positive
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            )}
          >
            {positive ? '+' : ''}{change}
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground mb-0.5" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/* ── Activity Feed ──────────────────────────────────────── */
const activities = [
  { user: 'Carlos Mendoza', action: 'Exportó reporte de balanza', time: 'Hace 3 min', type: 'report' },
  { user: 'Ana Lucía Torres', action: 'Creó empresa "Dev Corp"', time: 'Hace 12 min', type: 'company' },
  { user: 'admin@sdk.local', action: 'Modificó permisos de usuario', time: 'Hace 28 min', type: 'permission' },
  { user: 'Roberto Silva', action: 'Sincronizó integración Wansoft', time: 'Hace 1 hr', type: 'integration' },
  { user: 'Sofía Ramírez', action: 'Descargó lista de raya', time: 'Hace 2 hrs', type: 'report' },
  { user: 'Miguel Ángel Vega', action: 'Actualizó configuración general', time: 'Hace 3 hrs', type: 'settings' },
]

const typeColors: Record<string, string> = {
  report: '#0DA2E7',
  company: '#6B26D9',
  permission: '#F59E0B',
  integration: '#10B981',
  settings: '#65758B',
}

export function ActivityFeed() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Actividad reciente
        </h3>
        <button className="text-xs text-accent hover:underline">Ver todo</button>
      </div>
      <div className="space-y-4">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="mt-0.5 w-2 h-2 rounded-full flex-shrink-0 mt-2"
              style={{ backgroundColor: typeColors[a.type] }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">
                <span className="font-medium">{a.user}</span>{' '}
                <span className="text-muted-foreground">{a.action}</span>
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Mini Bar Chart ─────────────────────────────────────── */
const chartData = [
  { day: 'L', value: 40 },
  { day: 'M', value: 65 },
  { day: 'X', value: 55 },
  { day: 'J', value: 80 },
  { day: 'V', value: 72 },
  { day: 'S', value: 45 },
  { day: 'D', value: 30 },
]

export function WeeklyChart() {
  const max = Math.max(...chartData.map((d) => d.value))

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Actividad semanal
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Reportes generados esta semana</p>
        </div>
        <span className="text-2xl font-bold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          387
        </span>
      </div>
      <div className="flex items-end gap-2 h-24">
        {chartData.map((d, i) => {
          const heightPct = (d.value / max) * 100
          const isToday = i === 3
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full relative rounded-t-md overflow-hidden" style={{ height: '72px' }}>
                <div
                  className={cn(
                    'absolute bottom-0 w-full rounded-t-md transition-all duration-500',
                    isToday
                      ? 'bg-gradient-to-t from-accent to-accent/60'
                      : 'bg-gradient-to-t from-accent/30 to-accent/10'
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className={cn('text-[10px] font-medium', isToday ? 'text-accent' : 'text-muted-foreground/60')}>
                {d.day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Permissions Grid ───────────────────────────────────── */
const permCategories = [
  { name: 'Empresas', count: 6, color: '#6B26D9' },
  { name: 'Reportes', count: 4, color: '#0DA2E7' },
  { name: 'Usuarios', count: 2, color: '#10B981' },
  { name: 'Nómina', count: 2, color: '#F59E0B' },
  { name: 'Contabilidad', count: 1, color: '#0DA2E7' },
  { name: 'Sistema', count: 10, color: '#6B26D9' },
]

export function PermissionsWidget() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Permisos activos
        </h3>
        <span className="text-xs font-bold text-white px-2 py-1 rounded-lg bg-gradient-to-r from-accent to-primary">
          29 total
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {permCategories.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-secondary border border-border/60 hover:border-accent/30 transition-colors"
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-foreground font-medium flex-1">{p.name}</span>
            <span className="text-xs font-bold text-muted-foreground">{p.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── System Status ──────────────────────────────────────── */
const services = [
  { name: 'API Gateway', status: 'online', latency: '12ms' },
  { name: 'Wansoft Sync', status: 'online', latency: '48ms' },
  { name: 'DB ContPAQi', status: 'offline', latency: '--' },
  { name: 'DB AdminPAQ', status: 'offline', latency: '--' },
  { name: 'Auth Service', status: 'online', latency: '8ms' },
]

export function SystemStatus() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          Estado del sistema
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">Operacional</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  s.status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                )}
              />
              <span className="text-sm text-foreground">{s.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{s.latency}</span>
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                  s.status === 'online'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {s.status === 'online' ? 'OK' : 'OFF'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
