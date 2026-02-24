'use client'

import { cn } from '@/lib/utils'

/* ── Stat Card ──────────────────────────────────────────── */
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  positive?: boolean
  icon: React.ReactNode
  accent?: boolean
  loading?: boolean
}

export function StatCard({ label, value, sub, positive, icon, accent, loading }: StatCardProps) {
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
          {sub && !loading && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-md border',
                positive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              )}
            >
              {sub}
            </span>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-16 bg-secondary animate-pulse rounded-md" />
            <div className="h-3 w-24 bg-secondary animate-pulse rounded-md" />
          </div>
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Activity Feed ──────────────────────────────────────── */
export interface ActivityItem {
  user: string
  action: string
  time: string
  type: 'request' | 'company' | 'permission' | 'devmode' | 'license' | 'other'
}

const typeColors: Record<string, string> = {
  request: '#F59E0B',
  company: '#7C3AED',
  permission: '#7C3AED',
  devmode: '#0DA2E7',
  license: '#10B981',
  other: '#94A3B8',
}

const typeLabels: Record<string, string> = {
  request: 'Request',
  company: 'Empresa',
  permission: 'Permiso',
  devmode: 'Dev',
  license: 'Licencia',
  other: 'Sistema',
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin} min`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `Hace ${diffHrs} hr${diffHrs !== 1 ? 's' : ''}`
  const diffDays = Math.floor(diffHrs / 24)
  return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
}

export function ActivityFeed({ items, loading }: { items: ActivityItem[]; loading?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Actividad reciente
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimas solicitudes dev-mode</p>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-secondary animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-secondary animate-pulse rounded" />
                <div className="h-3 w-40 bg-secondary animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Sin actividad reciente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="mt-1 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                style={{ backgroundColor: typeColors[a.type] + '22', color: typeColors[a.type] }}
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
      )}
    </div>
  )
}

/* ── License Usage Chart ────────────────────────────────── */
export interface LicenseBarItem {
  name: string
  activos: number
  max: number
}

export function LicenseUsageChart({ items, loading }: { items: LicenseBarItem[]; loading?: boolean }) {
  const top = items.slice(0, 6)
  const maxVal = Math.max(...top.map((d) => d.max), 1)

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Uso de licencias
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Usuarios activos por empresa</p>
        </div>
        {!loading && top.length > 0 && (
          <div className="text-right">
            <span className="text-xl font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {top.reduce((a, b) => a + b.activos, 0)}
            </span>
            <p className="text-[11px] text-muted-foreground">usuarios totales</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-28 bg-secondary animate-pulse rounded" />
              <div className="h-2 bg-secondary animate-pulse rounded-full" style={{ width: `${40 + i * 15}%` }} />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">Sin datos de licencias</div>
      ) : (
        <div className="space-y-3">
          {top.map((d) => {
            const pct = Math.round((d.activos / Math.max(d.max, 1)) * 100)
            const isHigh = pct > 80
            return (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-foreground font-medium truncate max-w-[140px]">{d.name}</span>
                  <span className={cn('text-xs font-semibold tabular-nums ml-2', isHigh ? 'text-amber-600' : 'text-muted-foreground')}>
                    {d.activos}/{d.max}
                  </span>
                </div>
                <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', isHigh ? 'bg-amber-500' : 'bg-accent')}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Pending Requests Summary ───────────────────────────── */
export interface PendingRequestItem {
  empresaNombre: string
  requestedByEmail: string
  requestedAt: string
}

export function PendingRequestsWidget({
  items,
  loading,
  onGoToRequests,
}: {
  items: PendingRequestItem[]
  loading?: boolean
  onGoToRequests?: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Requests pendientes
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Dev mode sin revisar</p>
        </div>
        {items.length > 0 && (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-secondary animate-pulse rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-xs text-muted-foreground">Sin pendientes</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{item.empresaNombre}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.requestedByEmail}</p>
              </div>
            </div>
          ))}
          {onGoToRequests && items.length > 0 && (
            <button
              onClick={onGoToRequests}
              className="w-full mt-1 text-xs text-accent hover:text-accent/80 font-medium py-1.5 transition-colors text-center"
            >
              Ver todas las solicitudes →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── System Status ──────────────────────────────────────── */
export interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'checking'
  latency?: string
}

export function SystemStatus({ services, loading }: { services: ServiceStatus[]; loading?: boolean }) {
  const onlineCount = services.filter(s => s.status === 'online').length
  const allOnline = onlineCount === services.length && services.length > 0

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Estado del sistema
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? 'Verificando...' : `${onlineCount}/${services.length} servicios activos`}
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {allOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />}
              <span className={cn('relative inline-flex rounded-full h-2 w-2', allOnline ? 'bg-emerald-500' : 'bg-amber-500')} />
            </span>
            <span className={cn('text-xs font-medium', allOnline ? 'text-emerald-600' : 'text-amber-600')}>
              {allOnline ? 'Operacional' : 'Degradado'}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse flex-shrink-0" />
              <div className="h-3 flex-1 bg-secondary animate-pulse rounded" />
              <div className="h-3 w-8 bg-secondary animate-pulse rounded" />
            </div>
          ))
        ) : (
          services.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  s.status === 'online' ? 'bg-emerald-500' :
                  s.status === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-muted-foreground/30'
                )}
              />
              <span className="text-sm text-foreground flex-1">{s.name}</span>
              {s.latency && (
                <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{s.latency}</span>
              )}
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded border w-10 text-center',
                  s.status === 'online'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : s.status === 'checking'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-secondary text-muted-foreground border-border'
                )}
              >
                {s.status === 'online' ? 'OK' : s.status === 'checking' ? '...' : 'OFF'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
