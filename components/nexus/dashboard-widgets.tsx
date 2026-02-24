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
        'relative rounded-xl border p-5 overflow-hidden transition-all duration-200 group bg-card',
        'hover:shadow-md hover:-translate-y-0.5',
        accent
          ? 'border-accent/30 shadow-accent/5'
          : 'border-border hover:border-accent/20'
      )}
    >
      {accent && (
        <div className="absolute inset-0 bg-accent/4 pointer-events-none rounded-xl" />
      )}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              accent
                ? 'bg-accent/12 text-accent'
                : 'bg-secondary text-muted-foreground group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-200'
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-md border',
              positive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-600 border-red-200'
            )}
          >
            {positive ? '+' : ''}{change}
          </span>
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
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
  company: '#7C3AED',
  permission: '#F59E0B',
  integration: '#10B981',
  settings: '#94A3B8',
}

const typeLabels: Record<string, string> = {
  report: 'Reporte',
  company: 'Empresa',
  permission: 'Permiso',
  integration: 'Integración',
  settings: 'Config',
}

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Actividad reciente
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimas acciones del sistema</p>
        </div>
        <button className="text-xs text-accent hover:text-accent/80 font-medium transition-colors">Ver todo</button>
      </div>
      <div className="space-y-3">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-3 group">
            <div
              className="mt-1.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold"
              style={{ backgroundColor: typeColors[a.type] + '25', color: typeColors[a.type] }}
            >
              {typeLabels[a.type].charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug truncate">
                <span className="font-medium">{a.user}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{a.action}</p>
            </div>
            <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap flex-shrink-0 mt-0.5">{a.time}</span>
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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Actividad semanal
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Reportes generados</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            387
          </span>
          <p className="text-[11px] text-emerald-600 font-medium">+12.1%</p>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {chartData.map((d, i) => {
          const heightPct = (d.value / max) * 100
          const isToday = i === 3
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative" style={{ height: '60px' }}>
                <div
                  className={cn(
                    'absolute bottom-0 w-full rounded-t transition-all duration-500',
                    isToday ? 'bg-accent' : 'bg-accent/20'
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className={cn('text-[10px] font-medium', isToday ? 'text-accent font-bold' : 'text-muted-foreground/50')}>
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
  { name: 'Empresas', count: 6, color: '#7C3AED' },
  { name: 'Reportes', count: 4, color: '#0DA2E7' },
  { name: 'Usuarios', count: 2, color: '#10B981' },
  { name: 'Nómina', count: 2, color: '#F59E0B' },
  { name: 'Contabilidad', count: 1, color: '#0DA2E7' },
  { name: 'Sistema', count: 10, color: '#7C3AED' },
]

export function PermissionsWidget() {
  const total = permCategories.reduce((a, b) => a + b.count, 0)
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Permisos activos
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Por categoría</p>
        </div>
        <span className="text-xs font-bold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-md">
          {total} total
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {permCategories.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary border border-border/60 hover:border-accent/25 transition-colors"
          >
            <div className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-foreground font-medium flex-1 truncate">{p.name}</span>
            <span className="text-xs font-bold text-muted-foreground tabular-nums">{p.count}</span>
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
  const onlineCount = services.filter(s => s.status === 'online').length
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Estado del sistema
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{onlineCount}/{services.length} servicios activos</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-600 font-medium">Operacional</span>
        </div>
      </div>
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.name} className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                s.status === 'online' ? 'bg-emerald-500' : 'bg-border'
              )}
            />
            <span className="text-sm text-foreground flex-1">{s.name}</span>
            <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{s.latency}</span>
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded border w-10 text-center',
                s.status === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-secondary text-muted-foreground border-border'
              )}
            >
              {s.status === 'online' ? 'OK' : 'OFF'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
