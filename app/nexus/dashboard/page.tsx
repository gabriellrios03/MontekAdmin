'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, clearSession } from '@/lib/auth'
import type { NexusSession } from '@/lib/auth'
import { DashboardSidebar } from '@/components/nexus/dashboard-sidebar'
import type { DashboardView } from '@/components/nexus/dashboard-sidebar'
import { cn } from '@/lib/utils'
import {
  StatCard,
  ActivityFeed,
  LicenseUsageChart,
  PendingRequestsWidget,
  SystemStatus,
  type ActivityItem,
  type LicenseBarItem,
  type PendingRequestItem,
  type ServiceStatus,
} from '@/components/nexus/dashboard-widgets'

/* ── Shared primitives ─────────────────────────────────── */

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function ReloadButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all disabled:opacity-50"
    >
      <svg
        className={cn('w-3 h-3', loading && 'animate-spin')}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {loading ? 'Cargando...' : 'Recargar'}
    </button>
  )
}

function LoadingState({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm text-destructive font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-accent hover:underline">Intentar de nuevo</button>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm mb-4">
      <svg width="14" height="14" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-destructive/25 bg-destructive/8 text-destructive text-sm mb-4">
      <svg width="14" height="14" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </div>
  )
}

function InputField({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ── Types ─────────────────────────────────────────────── */

interface DevModeRequest {
  id: number
  empresaId: string
  empresaNombre: string
  requestedByEmail: string
  status: string
  requestNote: string | null
  requestedAt: string
}

interface DevModeResponse {
  result: boolean
  data: {
    rows: DevModeRequest[]
    total: number
    page: number
    limit: number
  }
}

interface LicenseSetupPayload {
  empresa_nombre: string
  empresa_rfc: string
  usuario_email: string
  max_usuarios: number
  max_usuarios_conectados: number
}

interface Anuncio {
  id: number
  titulo: string
  descripcion: string
  imagen_url: string | null
  enlace_url: string | null
  activo: number
  orden: number
  fecha_inicio: string
  fecha_fin: string
  created_at: string
  updated_at: string
}

interface Empresa {
  id: string
  nombre: string
  rfc: string
  db_nombre_contpaqi: string | null
  es_cliente_principal: boolean
  children: Empresa[]
  parent_id?: string
}

interface License {
  id: string
  license_id?: string
  empresa_id: string
  empresa_nombre?: string
  max_usuarios: number
  max_usuarios_conectados: number
  usuarios_activos?: number
  usuarios_disponibles?: number
  sesiones_activas?: number
  sesiones_disponibles?: number
  session_idle_seconds?: number
  created_at?: string
  updated_at?: string
}

interface EmpresaDevMode {
  id: string
  nombre: string
  rfc: string
  dev_mode_enabled: boolean
  children: Empresa[]
}

/* ── Dashboard Stats ────────────────────────────────────── */
interface DashboardStats {
  empresas: number
  usuariosActivos: number
  sesionesActivas: number
  requestsPendientes: number
}

/* ── Page ────────────────────�����──────────────────────────── */

/* ── Anuncios toggle ────────────────────────────────────── */
function AnuncioToggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center w-11 h-6 rounded-full border-2 transition-all duration-300 disabled:opacity-50 flex-shrink-0',
        checked ? 'bg-emerald-500 border-emerald-500' : 'bg-secondary border-border'
      )}
    >
      <span className={cn('absolute w-4 h-4 rounded-full bg-card shadow-sm transition-all duration-300', checked ? 'left-6' : 'left-1')} />
    </button>
  )
}

/* ── License helpers ────────────────────────────────────── */
function getLicenseStatus(pct: number): 'critical' | 'warning' | 'ok' {
  if (pct >= 90) return 'critical'
  if (pct >= 70) return 'warning'
  return 'ok'
}
const licenseStatusMeta = {
  critical: { label: 'Critico',     bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     bar: 'bg-red-500',   dot: 'bg-red-500'    },
  warning:  { label: 'Advertencia', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   bar: 'bg-amber-500', dot: 'bg-amber-500'  },
  ok:       { label: 'Normal',      bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-accent',    dot: 'bg-emerald-500'},
}

export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<NexusSession | null>(null)
  const [greeting, setGreeting] = useState('Bienvenido')
  const [activeView, setActiveView] = useState<DashboardView>('dashboard')

  // Dashboard overview (real data)
  const [dashStats, setDashStats] = useState<DashboardStats | null>(null)
  const [dashStatsLoading, setDashStatsLoading] = useState(false)
  const [dashActivityItems, setDashActivityItems] = useState<ActivityItem[]>([])
  const [dashActivityLoading, setDashActivityLoading] = useState(false)
  const [dashLicenseItems, setDashLicenseItems] = useState<LicenseBarItem[]>([])
  const [dashLicenseLoading, setDashLicenseLoading] = useState(false)
  const [dashPendingItems, setDashPendingItems] = useState<PendingRequestItem[]>([])
  const [dashPendingLoading, setDashPendingLoading] = useState(false)
  const [dashServices, setDashServices] = useState<ServiceStatus[]>([
    { name: 'API Gateway', status: 'checking' },
    { name: 'Auth Service', status: 'checking' },
    { name: 'Dev Mode API', status: 'checking' },
    { name: 'Anuncios API', status: 'checking' },
  ])
  const [dashServicesLoading, setDashServicesLoading] = useState(false)

  // Dev requests
  const [devRequests, setDevRequests] = useState<DevModeRequest[]>([])
  const [devRequestsMeta, setDevRequestsMeta] = useState({ total: 0, page: 1, limit: 50 })
  const [devRequestsLoading, setDevRequestsLoading] = useState(false)
  const [devRequestsError, setDevRequestsError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [devRequestsFilter, setDevRequestsFilter] = useState<'pending' | 'all'>('pending')
  const [selectedRequest, setSelectedRequest] = useState<DevModeRequest | null>(null)
  const [confirmingId, setConfirmingId] = useState<{ id: number; action: 'authorize' | 'reject' } | null>(null)

  // License
  const defaultLicenseForm: LicenseSetupPayload = { empresa_nombre: '', empresa_rfc: '', usuario_email: '', max_usuarios: 5, max_usuarios_conectados: 3 }
  const [licenseForm, setLicenseForm] = useState<LicenseSetupPayload>(defaultLicenseForm)
  const [licenseLoading, setLicenseLoading] = useState(false)
  const [licenseSuccess, setLicenseSuccess] = useState<{ empresa_nombre: string; usuario_email: string } | null>(null)
  const [licenseError, setLicenseError] = useState<string | null>(null)
  const [licenseStep, setLicenseStep] = useState<1 | 2>(1)
  const [licenseFieldErrors, setLicenseFieldErrors] = useState<Partial<Record<keyof LicenseSetupPayload, string>>>({})
  const [licenseTouched, setLicenseTouched] = useState<Partial<Record<keyof LicenseSetupPayload, boolean>>>({})

  // Anuncios
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [anunciosLoading, setAnunciosLoading] = useState(false)
  const [anunciosError, setAnunciosError] = useState<string | null>(null)
  const defaultAnuncioForm = { titulo: '', descripcion: '', enlace_url: '', activo: true }
  const [anuncioForm, setAnuncioForm] = useState(defaultAnuncioForm)
  const [anuncioFormLoading, setAnuncioFormLoading] = useState(false)
  const [anuncioFormErrors, setAnuncioFormErrors] = useState<{ titulo?: string; descripcion?: string }>({})
  const [anuncioToast, setAnuncioToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [anuncioDeleteConfirmId, setAnuncioDeleteConfirmId] = useState<number | null>(null)
  const [anuncioDeleteLoading, setAnuncioDeleteLoading] = useState<number | null>(null)
  const [editingAnuncioId, setEditingAnuncioId] = useState<number | null>(null)
  const [editingAnuncioForm, setEditingAnuncioForm] = useState({ titulo: '', descripcion: '', enlace_url: '', activo: true })
  const [editingAnuncioLoading, setEditingAnuncioLoading] = useState(false)
  const [togglingAnuncioId, setTogglingAnuncioId] = useState<number | null>(null)
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  // Empresas
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresasLoading, setEmpresasLoading] = useState(false)
  const [empresasError, setEmpresasError] = useState<string | null>(null)
  const [empresasSearch, setEmpresasSearch] = useState('')
  const [expandedEmpresaId, setExpandedEmpresaId] = useState<string | null>(null)

  // Licenses
  const [licenses, setLicenses] = useState<License[]>([])
  const [licensesLoading, setLicensesLoading] = useState(false)
  const [licensesError, setLicensesError] = useState<string | null>(null)
  const [licensesSearch, setLicensesSearch] = useState('')
  const [licensesFilter, setLicensesFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all')

  // Dev mode
  const [empresasDevMode, setEmpresasDevMode] = useState<EmpresaDevMode[]>([])
  const [devModeLoading, setDevModeLoading] = useState(false)
  const [devModeError, setDevModeError] = useState<string | null>(null)
  const [togglingDevModeId, setTogglingDevModeId] = useState<string | null>(null)
  const [devModeMessage, setDevModeMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [devModeConfirmId, setDevModeConfirmId] = useState<string | null>(null)
  const [devModeSearch, setDevModeSearch] = useState('')

  useEffect(() => {
    const s = loadSession()
    if (!s) {
      router.replace('/nexus/login')
      return
    }
    setSession(s)
    const h = new Date().getHours()
    if (h < 12) setGreeting('Buenos días')
    else if (h < 19) setGreeting('Buenas tardes')
    else setGreeting('Buenas noches')
    // Load dashboard data on mount
    void loadDashboardData(s.token)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  function handleLogout() {
    clearSession()
    router.replace('/nexus/login')
  }

  async function loadDashboardData(token: string) {
    // ── Stats: empresas count + license aggregates ──────────
    setDashStatsLoading(true)
    try {
      const compRes = await fetch('https://montekvps.cloud/api/companies', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const compPayload = compRes.ok ? await compRes.json() : []
      const companies: Empresa[] = Array.isArray(compPayload)
        ? compPayload
        : Array.isArray(compPayload?.data) ? compPayload.data : []

      const parentCompanies = companies.filter(c => !c.parent_id)

      // Fetch all capacities in parallel
      const capacities = await Promise.allSettled(
        parentCompanies.map((emp) =>
          fetch(`https://montekvps.cloud/api/licenses/empresa/${emp.id}/capacity`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(r => r.ok ? r.json() : null)
        )
      )

      let totalActivos = 0
      let totalSesiones = 0
      const licenseBarItems: LicenseBarItem[] = []

      parentCompanies.forEach((emp, idx) => {
        const cap = capacities[idx].status === 'fulfilled' ? capacities[idx].value : null
        const activos = cap?.usuarios_activos ?? 0
        const max = cap?.max_usuarios ?? 0
        const sesiones = cap?.sesiones_activas ?? 0
        totalActivos += activos
        totalSesiones += sesiones
        if (max > 0) {
          licenseBarItems.push({ name: emp.nombre, activos, max })
        }
      })

      setDashStats({
        empresas: parentCompanies.length,
        usuariosActivos: totalActivos,
        sesionesActivas: totalSesiones,
        requestsPendientes: 0, // will update after
      })
      setDashLicenseItems(licenseBarItems)
    } catch {
      // silently fail — stats stay null
    } finally {
      setDashStatsLoading(false)
      setDashLicenseLoading(false)
    }

    // ── Activity: recent dev-mode requests ──────────────────
    setDashActivityLoading(true)
    setDashPendingLoading(true)
    try {
      const reqRes = await fetch(
        'https://montekvps.cloud/api/dev-mode/requests?page=1&limit=20',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (reqRes.ok) {
        const reqPayload = await reqRes.json()
        const rows: DevModeRequest[] = Array.isArray(reqPayload?.data?.rows)
          ? reqPayload.data.rows
          : []

        const allRows = rows.slice(0, 8)
        const activityItems: ActivityItem[] = allRows.map((r) => ({
          user: r.empresaNombre || `Empresa ${r.empresaId}`,
          action: `Dev-mode request · ${r.requestedByEmail}`,
          time: r.requestedAt ? (() => {
            const date = new Date(r.requestedAt)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMin = Math.floor(diffMs / 60000)
            if (diffMin < 1) return 'Ahora'
            if (diffMin < 60) return `Hace ${diffMin} min`
            const diffHrs = Math.floor(diffMin / 60)
            if (diffHrs < 24) return `Hace ${diffHrs} hr${diffHrs !== 1 ? 's' : ''}`
            return `Hace ${Math.floor(diffHrs / 24)} día${Math.floor(diffHrs / 24) !== 1 ? 's' : ''}`
          })() : '',
          type: r.status === 'pending' ? 'request' : 'devmode',
        }))
        setDashActivityItems(activityItems)

        const pending: PendingRequestItem[] = rows
          .filter(r => r.status === 'pending')
          .slice(0, 5)
          .map(r => ({
            empresaNombre: r.empresaNombre || `Empresa ${r.empresaId}`,
            requestedByEmail: r.requestedByEmail,
            requestedAt: r.requestedAt,
          }))
        setDashPendingItems(pending)

        // Update pending count in stats
        const pendingCount = rows.filter(r => r.status === 'pending').length
        setDashStats(prev => prev ? { ...prev, requestsPendientes: pendingCount } : prev)
      }
    } catch {
      // silently fail
    } finally {
      setDashActivityLoading(false)
      setDashPendingLoading(false)
    }

    // ── System status: ping each endpoint ───────────────────
    setDashServicesLoading(true)
    const endpoints: { name: string; url: string }[] = [
      { name: 'API Gateway', url: 'https://montekvps.cloud/api/companies' },
      { name: 'Auth Service', url: 'https://montekvps.cloud/api/companies' },
      { name: 'Dev Mode API', url: 'https://montekvps.cloud/api/dev-mode/requests?page=1&limit=1' },
      { name: 'Anuncios API', url: 'https://montekvps.cloud/api/anuncios' },
    ]

    const serviceResults = await Promise.allSettled(
      endpoints.map(async (ep) => {
        const start = Date.now()
        const res = await fetch(ep.url, { headers: { Authorization: `Bearer ${token}` } })
        const latency = Date.now() - start
        return { name: ep.name, ok: res.ok || res.status === 401 || res.status === 403, latency }
      })
    )

    setDashServices(
      serviceResults.map((r, i) => ({
        name: endpoints[i].name,
        status: (r.status === 'fulfilled' && r.value.ok) ? 'online' : 'offline',
        latency: r.status === 'fulfilled' ? `${r.value.latency}ms` : undefined,
      }))
    )
    setDashServicesLoading(false)
  }

  async function loadDevRequests() {
    if (!session?.token) return
    setDevRequestsLoading(true)
    setDevRequestsError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/dev-mode/requests?page=1&limit=50', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      const payload = (await res.json()) as DevModeResponse
      const rows = Array.isArray(payload?.data?.rows) ? payload.data.rows : []
      setDevRequests(rows)
      setDevRequestsMeta({ total: Number(payload?.data?.total ?? rows.length), page: Number(payload?.data?.page ?? 1), limit: Number(payload?.data?.limit ?? 50) })
    } catch (e) {
      setDevRequestsError(e instanceof Error ? e.message : 'No se pudieron cargar los requests')
    } finally {
      setDevRequestsLoading(false)
    }
  }

  async function loadAnuncios() {
    if (!session?.token) return
    setAnunciosLoading(true)
    setAnunciosError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/anuncios', { headers: { Authorization: `Bearer ${session.token}` } })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setAnuncios(data.filter((item): item is Anuncio => typeof item === 'object' && item !== null))
    } catch (e) {
      setAnunciosError(e instanceof Error ? e.message : 'No se pudieron cargar los anuncios')
    } finally {
      setAnunciosLoading(false)
    }
  }

  async function handleCreateAnuncio() {
    if (!session?.token) return
    const errors: { titulo?: string; descripcion?: string } = {}
    if (!anuncioForm.titulo.trim()) errors.titulo = 'El título es requerido'
    if (!anuncioForm.descripcion.trim()) errors.descripcion = 'La descripción es requerida'
    if (Object.keys(errors).length > 0) { setAnuncioFormErrors(errors); return }
    setAnuncioFormErrors({})
    setAnuncioFormLoading(true)
    try {
      const body: Record<string, unknown> = { titulo: anuncioForm.titulo, descripcion: anuncioForm.descripcion, activo: anuncioForm.activo }
      if (anuncioForm.enlace_url.trim()) body.enlace_url = anuncioForm.enlace_url.trim()
      const res = await fetch('https://montekvps.cloud/api/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(body),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setAnuncioToast({ text: `Anuncio "${anuncioForm.titulo}" publicado correctamente.`, type: 'success' })
      setAnuncioForm(defaultAnuncioForm)
      await loadAnuncios()
    } catch (e) {
      setAnuncioToast({ text: e instanceof Error ? e.message : 'No se pudo crear el anuncio', type: 'error' })
    } finally {
      setAnuncioFormLoading(false)
    }
  }

  async function handleDeleteAnuncio(id: number) {
    if (!session?.token) return
    setAnuncioDeleteLoading(id)
    setAnuncioDeleteConfirmId(null)
    try {
      const res = await fetch(`https://montekvps.cloud/api/anuncios/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      setAnuncioToast({ text: 'Anuncio eliminado.', type: 'success' })
      setAnuncios(prev => prev.filter(a => a.id !== id))
    } catch (e) {
      setAnuncioToast({ text: e instanceof Error ? e.message : 'No se pudo eliminar el anuncio', type: 'error' })
    } finally {
      setAnuncioDeleteLoading(null)
    }
  }

  async function handleUpdateAnuncio(id: number) {
    if (!session?.token) return
    setEditingAnuncioLoading(true)
    try {
      const body: Record<string, unknown> = { titulo: editingAnuncioForm.titulo, descripcion: editingAnuncioForm.descripcion, activo: editingAnuncioForm.activo }
      if (editingAnuncioForm.enlace_url.trim()) body.enlace_url = editingAnuncioForm.enlace_url.trim()
      const res = await fetch(`https://montekvps.cloud/api/anuncios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(body),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setEditingAnuncioId(null)
      setAnuncioToast({ text: 'Cambios guardados.', type: 'success' })
      await loadAnuncios()
    } catch (e) {
      setAnuncioToast({ text: e instanceof Error ? e.message : 'No se pudo actualizar el anuncio', type: 'error' })
    } finally {
      setEditingAnuncioLoading(false)
    }
  }

  async function handleToggleAnuncioActivo(anuncio: Anuncio) {
    if (!session?.token) return
    setTogglingAnuncioId(anuncio.id)
    const newActivo = !anuncio.activo
    // Optimistic update
    setAnuncios(prev => prev.map(a => a.id === anuncio.id ? { ...a, activo: newActivo ? 1 : 0 } : a))
    try {
      const res = await fetch(`https://montekvps.cloud/api/anuncios/${anuncio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ activo: newActivo }),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) {
        // Rollback
        setAnuncios(prev => prev.map(a => a.id === anuncio.id ? { ...a, activo: anuncio.activo } : a))
        throw new Error(`Error HTTP ${res.status}`)
      }
      setAnuncioToast({ text: newActivo ? `"${anuncio.titulo}" activado.` : `"${anuncio.titulo}" desactivado.`, type: 'success' })
    } catch (e) {
      setAnuncioToast({ text: e instanceof Error ? e.message : 'No se pudo cambiar el estado', type: 'error' })
    } finally {
      setTogglingAnuncioId(null)
    }
  }
    setAnuncioFormLoading(true)
    setAnuncioFormMessage(null)
    setAnunciosError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/anuncios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(anuncioForm),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setAnuncioFormMessage('Anuncio creado correctamente.')
      setAnuncioForm({ titulo: '', descripcion: '', activo: true })
      await loadAnuncios()
    } catch (e) {
      setAnunciosError(e instanceof Error ? e.message : 'No se pudo crear el anuncio')
    } finally {
      setAnuncioFormLoading(false)
    }
  }

  async function handleDeleteAnuncio(id: number) {
    if (!session?.token || !confirm('¿Estás seguro de que deseas eliminar este anuncio?')) return
    setAnuncioDeleteLoading(id)
    setAnunciosError(null)
    try {
      const res = await fetch(`https://montekvps.cloud/api/anuncios/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      await loadAnuncios()
    } catch (e) {
      setAnunciosError(e instanceof Error ? e.message : 'No se pudo eliminar el anuncio')
    } finally {
      setAnuncioDeleteLoading(null)
    }
  }

  async function handleUpdateAnuncio(id: number) {
    if (!session?.token) return
    setEditingAnuncioLoading(true)
    setAnunciosError(null)
    try {
      const res = await fetch(`https://montekvps.cloud/api/anuncios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(editingAnuncioForm),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setEditingAnuncioId(null)
      await loadAnuncios()
    } catch (e) {
      setAnunciosError(e instanceof Error ? e.message : 'No se pudo actualizar el anuncio')
    } finally {
      setEditingAnuncioLoading(false)
    }
  }

  async function handleUploadAnuncioImage(id: number, file: File) {
    if (!session?.token || !file) return
    setUploadingImageId(id)
    setAnunciosError(null)
    try {
      const formData = new FormData()
      formData.append('imagen', file)
      const res = await fetch(`https://montekvps.cloud/api/anuncios/${id}/imagen`, { method: 'POST', headers: { Authorization: `Bearer ${session.token}` }, body: formData })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      await loadAnuncios()
    } catch (e) {
      setAnunciosError(e instanceof Error ? e.message : 'No se pudo subir la imagen')
    } finally {
      setUploadingImageId(null)
    }
  }

  async function handleDeleteAnuncioImage(id: number) {
    if (!session?.token) return
    setDeletingImageId(id)
    setAnunciosError(null)
    try {
      const res = await fetch(`https://montekvps.cloud/api/anuncios/${id}/imagen`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.token}` } })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      await loadAnuncios()
    } catch (e) {
      setAnunciosError(e instanceof Error ? e.message : 'No se pudo eliminar la imagen')
    } finally {
      setDeletingImageId(null)
    }
  }

  async function loadEmpresas() {
    if (!session?.token) return
    setEmpresasLoading(true)
    setEmpresasError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/companies', { headers: { Authorization: `Bearer ${session.token}` } })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setEmpresas(data.filter((item): item is Empresa => typeof item === 'object' && item !== null))
    } catch (e) {
      setEmpresasError(e instanceof Error ? e.message : 'No se pudieron cargar las empresas')
    } finally {
      setEmpresasLoading(false)
    }
  }

  async function loadLicenses() {
    if (!session?.token) return
    setLicensesLoading(true)
    setLicensesError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/companies', { headers: { Authorization: `Bearer ${session.token}` } })
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      const licensesData = await Promise.all(
        data
          .filter((item): item is Empresa => typeof item === 'object' && item !== null)
          .map(async (empresa) => {
            const license: License = { id: empresa.id, empresa_id: empresa.id, empresa_nombre: empresa.nombre, max_usuarios: 0, max_usuarios_conectados: 0 }
            try {
              const capRes = await fetch(`https://montekvps.cloud/api/licenses/empresa/${empresa.id}/capacity`, { headers: { Authorization: `Bearer ${session.token}` } })
              if (capRes.ok) {
                const cap = await capRes.json()
                license.license_id = cap?.license_id
                license.max_usuarios = cap?.max_usuarios ?? 0
                license.max_usuarios_conectados = cap?.max_usuarios_conectados ?? 0
                license.usuarios_activos = cap?.usuarios_activos ?? 0
                license.usuarios_disponibles = cap?.usuarios_disponibles ?? 0
                license.sesiones_activas = cap?.sesiones_activas ?? 0
                license.sesiones_disponibles = cap?.sesiones_disponibles ?? 0
                license.session_idle_seconds = cap?.session_idle_seconds
              }
            } catch {}
            return license
          })
      )
      setLicenses(licensesData)
    } catch (e) {
      setLicensesError(e instanceof Error ? e.message : 'No se pudieron cargar las licencias')
    } finally {
      setLicensesLoading(false)
    }
  }

  function validateLicenseField(field: keyof LicenseSetupPayload, value: string | number): string {
    if (field === 'empresa_nombre') return String(value).trim().length < 2 ? 'Ingresa el nombre de la empresa (mín. 2 caracteres)' : ''
    if (field === 'empresa_rfc') {
      const rfc = String(value).trim().toUpperCase()
      return rfc.length < 12 || rfc.length > 13 ? 'El RFC debe tener 12 o 13 caracteres' : ''
    }
    if (field === 'usuario_email') return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)) ? 'Ingresa un correo electrónico válido' : ''
    if (field === 'max_usuarios') return Number(value) < 1 ? 'Debe ser al menos 1 usuario' : ''
    if (field === 'max_usuarios_conectados') return Number(value) < 1 ? 'Debe ser al menos 1' : Number(value) > licenseForm.max_usuarios ? 'No puede superar el máximo de usuarios' : ''
    return ''
  }

  function handleLicenseBlur(field: keyof LicenseSetupPayload) {
    setLicenseTouched(prev => ({ ...prev, [field]: true }))
    const err = validateLicenseField(field, licenseForm[field] as string | number)
    setLicenseFieldErrors(prev => ({ ...prev, [field]: err }))
  }

  function handleLicenseFieldChange(field: keyof LicenseSetupPayload, value: string | number) {
    setLicenseForm(prev => ({ ...prev, [field]: value }))
    if (licenseTouched[field]) {
      const err = validateLicenseField(field, value)
      setLicenseFieldErrors(prev => ({ ...prev, [field]: err }))
    }
  }

  function handleLicenseStepNext() {
    const fields: (keyof LicenseSetupPayload)[] = ['empresa_nombre', 'empresa_rfc', 'usuario_email']
    const touched = Object.fromEntries(fields.map(f => [f, true])) as Partial<Record<keyof LicenseSetupPayload, boolean>>
    const errors = Object.fromEntries(fields.map(f => [f, validateLicenseField(f, licenseForm[f] as string | number)])) as Partial<Record<keyof LicenseSetupPayload, string>>
    setLicenseTouched(prev => ({ ...prev, ...touched }))
    setLicenseFieldErrors(prev => ({ ...prev, ...errors }))
    if (Object.values(errors).every(e => !e)) setLicenseStep(2)
  }

  async function handleCreateLicense() {
    if (!session?.token) return
    setLicenseLoading(true)
    setLicenseError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/licenses/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ ...licenseForm, max_usuarios: Number(licenseForm.max_usuarios), max_usuarios_conectados: Number(licenseForm.max_usuarios_conectados) }),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setLicenseSuccess({ empresa_nombre: licenseForm.empresa_nombre, usuario_email: licenseForm.usuario_email })
      setLicenseForm(defaultLicenseForm)
      setLicenseStep(1)
      setLicenseTouched({})
      setLicenseFieldErrors({})
    } catch (e) {
      setLicenseError(e instanceof Error ? e.message : 'No se pudo crear la licencia')
    } finally {
      setLicenseLoading(false)
    }
  }

  async function handleAuthorizeRequest(request: DevModeRequest) {
    if (!session?.token) return
    setActionLoadingId(request.id)
    setConfirmingId(null)
    setActionMessage(null)
    setDevRequestsError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/dev-mode/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ empresaId: request.empresaId, enabled: true, requestId: String(request.id), note: 'Activación gestionada desde Nexus Admin' }),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setActionMessage({ text: `Dev mode autorizado para ${request.empresaNombre}.`, type: 'success' })
      setSelectedRequest(null)
      await loadDevRequests()
    } catch (e) {
      setActionMessage({ text: e instanceof Error ? e.message : 'No se pudo autorizar la request', type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDeactivateRequest(request: DevModeRequest) {
    if (!session?.token) return
    setActionLoadingId(request.id)
    setConfirmingId(null)
    setActionMessage(null)
    setDevRequestsError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/dev-mode/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ empresaId: request.empresaId, enabled: false, requestId: String(request.id), note: 'Solicitud rechazada desde Nexus Admin' }),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setActionMessage({ text: `Solicitud de ${request.empresaNombre} rechazada.`, type: 'success' })
      setSelectedRequest(null)
      await loadDevRequests()
    } catch (e) {
      setActionMessage({ text: e instanceof Error ? e.message : 'No se pudo rechazar la request', type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  async function loadDevModeEmpresas() {
    if (!session?.token) return
    setDevModeLoading(true)
    setDevModeError(null)
    try {
      const compRes = await fetch('https://montekvps.cloud/api/companies', { headers: { Authorization: `Bearer ${session.token}` } })
      if (compRes.status === 401 || compRes.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!compRes.ok) throw new Error(`Error HTTP ${compRes.status}`)
      const compPayload = await compRes.json()
      const companies = Array.isArray(compPayload) ? compPayload : Array.isArray(compPayload?.data) ? compPayload.data : []
      const parentCompanies = companies.filter((item): item is Empresa => typeof item === 'object' && item !== null && !item.parent_id)
      const empresasWithDevMode: EmpresaDevMode[] = await Promise.all(
        parentCompanies.map(async (empresa) => {
          try {
            const statusRes = await fetch(`https://montekvps.cloud/api/dev-mode/status?empresaId=${empresa.id}`, { headers: { Authorization: `Bearer ${session.token}` } })
            if (statusRes.ok) {
              const statusData = await statusRes.json()
              return { id: empresa.id, nombre: empresa.nombre, rfc: empresa.rfc, dev_mode_enabled: statusData?.has_permission ?? statusData?.enabled ?? false, children: empresa.children || [] }
            }
          } catch {}
          return { id: empresa.id, nombre: empresa.nombre, rfc: empresa.rfc, dev_mode_enabled: false, children: empresa.children || [] }
        })
      )
      setEmpresasDevMode(empresasWithDevMode)
    } catch (e) {
      setDevModeError(e instanceof Error ? e.message : 'No se pudieron cargar las empresas')
    } finally {
      setDevModeLoading(false)
    }
  }

  async function handleToggleDevMode(empresaId: string, currentStatus: boolean) {
    if (!session?.token) return
    setDevModeConfirmId(null)
    setTogglingDevModeId(empresaId)
    setDevModeMessage(null)
    const empresa = empresasDevMode.find(e => e.id === empresaId)
    try {
      const res = await fetch('https://montekvps.cloud/api/dev-mode/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ empresaId, enabled: !currentStatus, note: 'Toggle gestionado desde Nexus Admin - Dev Mode' }),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      // Optimistic update
      setEmpresasDevMode(prev => prev.map(e => e.id === empresaId ? { ...e, dev_mode_enabled: !currentStatus } : e))
      setDevModeMessage({
        text: !currentStatus
          ? `Dev mode activado para ${empresa?.nombre ?? empresaId}.`
          : `Dev mode desactivado para ${empresa?.nombre ?? empresaId}.`,
        type: 'success',
      })
    } catch (e) {
      setDevModeMessage({ text: e instanceof Error ? e.message : 'No se pudo cambiar el estado de dev-mode', type: 'error' })
    } finally {
      setTogglingDevModeId(null)
    }
  }

  function handleSelectView(view: DashboardView) {
    setActiveView(view)
    if (view === 'dashboard' && session?.token) void loadDashboardData(session.token)
    if (view === 'devs-request') void loadDevRequests()
    if (view === 'anuncios') void loadAnuncios()
    if (view === 'empresas') void loadEmpresas()
    if (view === 'licenses') void loadLicenses()
    if (view === 'dev-mode') void loadDevModeEmpresas()
  }

  /* ── Anuncios derived ── */
  const anunciosActiveCount = anuncios.filter(a => a.activo).length

  /* ── Empresas derived ── */
  const parentEmpresas = empresas.filter(e => !e.parent_id)
  const filteredEmpresas = parentEmpresas.filter(e =>
    !empresasSearch ||
    e.nombre.toLowerCase().includes(empresasSearch.toLowerCase()) ||
    e.rfc.toLowerCase().includes(empresasSearch.toLowerCase()) ||
    (e.db_nombre_contpaqi ?? '').toLowerCase().includes(empresasSearch.toLowerCase())
  )

  /* ── Licenses derived ── */
  const licensesWithPct = licenses.map(l => {
    const pct = l.max_usuarios > 0 ? Math.round(((l.usuarios_activos ?? 0) / l.max_usuarios) * 100) : 0
    return { ...l, pct, status: getLicenseStatus(pct) as 'critical' | 'warning' | 'ok' }
  })
  const licensesCriticalCount = licensesWithPct.filter(l => l.status === 'critical').length
  const licensesWarningCount  = licensesWithPct.filter(l => l.status === 'warning').length
  const filteredLicenses = licensesWithPct.filter(l => {
    const matchSearch = !licensesSearch ||
      (l.empresa_nombre ?? '').toLowerCase().includes(licensesSearch.toLowerCase()) ||
      l.empresa_id.toLowerCase().includes(licensesSearch.toLowerCase())
    const matchFilter = licensesFilter === 'all' || l.status === licensesFilter
    return matchSearch && matchFilter
  })

  /* ── Session loading ── */
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const viewMeta: Record<DashboardView, { title: string; description: string }> = {
    dashboard: { title: 'Dashboard', description: dateStr },
    'devs-request': { title: 'Devs Request', description: 'Solicitudes pendientes de activación' },
    'dev-mode': { title: 'Dev Mode', description: 'Control de modo desarrollador por empresa' },
    'license-setup': { title: 'Alta de Licencia', description: 'Registra una nueva empresa y licencia' },
    anuncios: { title: 'Anuncios', description: 'Gestiona los anuncios del sistema' },
    empresas: { title: 'Empresas', description: 'Directorio de empresas registradas' },
    licenses: { title: 'Licencias', description: 'Capacidad y uso de licencias' },
  }

  const { title: pageTitle, description: pageDesc } = viewMeta[activeView]

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar session={session} onLogout={handleLogout} activeView={activeView} onSelectView={handleSelectView} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-16 bg-background/90 backdrop-blur-md border-b border-border flex-shrink-0">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {pageTitle}
            </h1>
            <p className="text-xs text-muted-foreground capitalize truncate">{pageDesc}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {/* Notification */}
            <button className="relative w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/40 transition-all" aria-label="Notificaciones">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
            </button>
            {/* User */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:border-accent/40 transition-all cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                {(session.usuario.nombre || session.usuario.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">{session.usuario.empresa_nombre}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">{session.usuario.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── DASHBOARD ─────────────────────────────── */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 max-w-7xl">
              {/* Welcome */}
              <div className="rounded-xl border border-accent/20 bg-card p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-accent/3 pointer-events-none" />
                <div
                  className="absolute right-0 top-0 bottom-0 w-40 opacity-[0.035] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle, oklch(0.6 0.18 212) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
                />
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">{greeting}</p>
                  <h2 className="text-2xl font-bold text-foreground leading-tight text-balance" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Bienvenido al panel{' '}
                    <span className="text-accent">Nexus</span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-lg leading-relaxed">
                    Accediste como <strong className="text-foreground font-semibold">{session.usuario.email}</strong> en{' '}
                    <strong className="text-foreground font-semibold">{session.usuario.empresa_nombre}</strong>. Sesión válida por{' '}
                    <strong className="text-accent">{Math.round(session.expires_in / 60)} min</strong>.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      Sesión activa
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-secondary border border-border text-muted-foreground">
                      ID: {session.session_id.slice(0, 8)}…
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats — real data */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Empresas registradas"
                  value={dashStats?.empresas ?? '—'}
                  loading={dashStatsLoading}
                  accent
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  }
                />
                <StatCard
                  label="Usuarios activos"
                  value={dashStats?.usuariosActivos ?? '—'}
                  loading={dashStatsLoading}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  }
                />
                <StatCard
                  label="Sesiones activas"
                  value={dashStats?.sesionesActivas ?? '—'}
                  loading={dashStatsLoading}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  }
                />
                <StatCard
                  label="Requests pendientes"
                  value={dashStats?.requestsPendientes ?? '—'}
                  sub={dashStats?.requestsPendientes ? `${dashStats.requestsPendientes} sin revisar` : undefined}
                  positive={dashStats?.requestsPendientes === 0}
                  loading={dashStatsLoading}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  }
                />
              </div>

              {/* Middle row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <ActivityFeed items={dashActivityItems} loading={dashActivityLoading} />
                </div>
                <LicenseUsageChart items={dashLicenseItems} loading={dashLicenseLoading} />
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PendingRequestsWidget
                  items={dashPendingItems}
                  loading={dashPendingLoading}
                  onGoToRequests={() => handleSelectView('devs-request')}
                />
                <SystemStatus services={dashServices} loading={dashServicesLoading} />
              </div>
            </div>
          )}

          {/* ── DEVS REQUEST ──────────────────────────── */}
          {activeView === 'devs-request' && (() => {
            const pendingList = devRequests.filter(r => r.status === 'pending')
            const displayList = devRequestsFilter === 'pending' ? pendingList : devRequests

            function relativeTime(iso: string) {
              const date = new Date(iso)
              const now = new Date()
              const diffMs = now.getTime() - date.getTime()
              const diffMin = Math.floor(diffMs / 60000)
              if (diffMin < 1) return 'Ahora mismo'
              if (diffMin < 60) return `Hace ${diffMin} min`
              const diffHrs = Math.floor(diffMin / 60)
              if (diffHrs < 24) return `Hace ${diffHrs} hr${diffHrs !== 1 ? 's' : ''}`
              const diffDays = Math.floor(diffHrs / 24)
              return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
            }

            function statusBadge(status: string) {
              if (status === 'pending') {
                return (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pendiente
                  </span>
                )
              }
              if (status === 'approved' || status === 'authorized') {
                return (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Aprobada
                  </span>
                )
              }
              return (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                  {status}
                </span>
              )
            }

            return (
              <div className="max-w-6xl space-y-5">
                {/* Toast feedback */}
                {actionMessage && (
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm',
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-destructive/8 border-destructive/25 text-destructive'
                  )}>
                    {actionMessage.type === 'success' ? (
                      <svg width="15" height="15" className="flex-shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="15" height="15" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    )}
                    {actionMessage.text}
                    <button onClick={() => setActionMessage(null)} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                )}

                {/* Header + stats */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Devs Request
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Solicitudes de activación de modo desarrollador</p>
                  </div>
                  <ReloadButton onClick={() => void loadDevRequests()} loading={devRequestsLoading} />
                </div>

                {/* Summary stat pills */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-700">{pendingList.length} pendientes</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border border-border">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <span className="text-xs font-semibold text-muted-foreground">{devRequests.length} en total</span>
                  </div>
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl border border-border w-fit">
                  {(['pending', 'all'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setDevRequestsFilter(f)}
                      className={cn(
                        'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
                        devRequestsFilter === f
                          ? 'bg-card text-foreground shadow-sm border border-border'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {f === 'pending' ? `Pendientes · ${pendingList.length}` : `Todas · ${devRequests.length}`}
                    </button>
                  ))}
                </div>

                {/* Content */}
                {devRequestsLoading ? (
                  <LoadingState text="Cargando solicitudes..." />
                ) : devRequestsError ? (
                  <ErrorState message={devRequestsError} onRetry={() => void loadDevRequests()} />
                ) : displayList.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-20 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Todo al dia</p>
                      <p className="text-sm text-muted-foreground mt-0.5">No hay solicitudes pendientes de revision.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {displayList.map((request) => {
                      const isActioning = actionLoadingId === request.id
                      const isConfirming = confirmingId?.id === request.id
                      const isPending = request.status === 'pending'

                      return (
                        <div
                          key={request.id}
                          className={cn(
                            'bg-card rounded-xl border transition-all duration-200',
                            selectedRequest?.id === request.id
                              ? 'border-accent/50 shadow-sm shadow-accent/10'
                              : 'border-border hover:border-border/80 hover:shadow-sm'
                          )}
                        >
                          {/* Main row */}
                          <div
                            className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                            onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                          >
                            {/* Avatar */}
                            <div className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                              isPending
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            )}>
                              {(request.empresaNombre || 'E').charAt(0).toUpperCase()}
                            </div>

                            {/* Main info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground text-sm leading-tight truncate">
                                  {request.empresaNombre || `Empresa ID ${request.empresaId}`}
                                </p>
                                {statusBadge(request.status)}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                  {request.requestedByEmail}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                  {relativeTime(request.requestedAt)}
                                </span>
                                {request.requestNote && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground max-w-xs truncate" title={request.requestNote}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    {request.requestNote}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quick actions (only pending) */}
                            {isPending && !isConfirming && (
                              <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingId({ id: request.id, action: 'authorize' })}
                                  disabled={isActioning}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40 whitespace-nowrap"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                  Autorizar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingId({ id: request.id, action: 'reject' })}
                                  disabled={isActioning}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40 whitespace-nowrap"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                  Rechazar
                                </button>
                              </div>
                            )}

                            {/* Chevron */}
                            <svg
                              width="14" height="14"
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              className={cn('flex-shrink-0 text-muted-foreground transition-transform duration-200', selectedRequest?.id === request.id && 'rotate-180')}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>

                          {/* Confirm strip */}
                          {isConfirming && (
                            <div className={cn(
                              'mx-5 mb-4 rounded-xl border px-4 py-3 flex items-center justify-between gap-4',
                              confirmingId?.action === 'authorize'
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-red-50 border-red-200'
                            )}>
                              <p className={cn('text-xs font-medium', confirmingId?.action === 'authorize' ? 'text-emerald-800' : 'text-red-800')}>
                                {confirmingId?.action === 'authorize'
                                  ? `Confirmar activacion de dev mode para ${request.empresaNombre}?`
                                  : `Confirmar rechazo de la solicitud de ${request.empresaNombre}?`}
                              </p>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setConfirmingId(null)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={isActioning}
                                  onClick={() => {
                                    if (confirmingId?.action === 'authorize') void handleAuthorizeRequest(request)
                                    else void handleDeactivateRequest(request)
                                  }}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50',
                                    confirmingId?.action === 'authorize'
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-red-600 text-white hover:bg-red-700'
                                  )}
                                >
                                  {isActioning ? (
                                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
                                  ) : null}
                                  {confirmingId?.action === 'authorize' ? 'Si, activar' : 'Si, rechazar'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Expanded detail panel */}
                          {selectedRequest?.id === request.id && !isConfirming && (
                            <div className="border-t border-border mx-0">
                              <div className="px-5 py-4 bg-secondary/30 rounded-b-xl">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Request ID</p>
                                    <p className="text-sm font-mono text-foreground">#{request.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Empresa ID</p>
                                    <p className="text-sm font-mono text-foreground truncate">{request.empresaId}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Solicitante</p>
                                    <p className="text-sm text-foreground truncate">{request.requestedByEmail}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Fecha exacta</p>
                                    <p className="text-sm text-foreground">{new Date(request.requestedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Nota de la solicitud</p>
                                    <p className="text-sm text-foreground">{request.requestNote || <span className="italic text-muted-foreground/60">Sin nota proporcionada</span>}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── ALTA LICENCIA ─────────────────────────── */}
          {activeView === 'license-setup' && (
            <div className="max-w-2xl space-y-5">

              {/* Success state */}
              {licenseSuccess && (
                <div className="bg-card rounded-xl border border-emerald-200 p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                      Licencia creada exitosamente
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-sm mx-auto">
                      La empresa <strong className="text-foreground">{licenseSuccess.empresa_nombre}</strong> fue registrada. Las credenciales de acceso fueron enviadas a{' '}
                      <strong className="text-foreground">{licenseSuccess.usuario_email}</strong>.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setLicenseSuccess(null); setLicenseStep(1) }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Alta de otra licencia
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectView('licenses')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      Ver todas las licencias
                    </button>
                  </div>
                </div>
              )}

              {!licenseSuccess && (
                <>
                  {/* Header */}
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Alta de Licencia</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Registra una nueva empresa y genera sus credenciales de acceso</p>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center gap-0">
                    {[
                      { n: 1, label: 'Datos de empresa' },
                      { n: 2, label: 'Capacidad y confirmar' },
                    ].map((step, idx) => (
                      <div key={step.n} className="flex items-center flex-1">
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200',
                            licenseStep > step.n
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : licenseStep === step.n
                              ? 'bg-accent border-accent text-white'
                              : 'bg-secondary border-border text-muted-foreground'
                          )}>
                            {licenseStep > step.n ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : step.n}
                          </div>
                          <span className={cn(
                            'text-xs font-medium hidden sm:block',
                            licenseStep === step.n ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {step.label}
                          </span>
                        </div>
                        {idx < 1 && (
                          <div className={cn(
                            'h-px flex-1 mx-3 transition-colors duration-300',
                            licenseStep > 1 ? 'bg-emerald-400' : 'bg-border'
                          )} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Error banner */}
                  {licenseError && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/25 bg-destructive/8 text-sm font-medium text-destructive">
                      <svg width="15" height="15" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      {licenseError}
                      <button onClick={() => setLicenseError(null)} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  )}

                  {/* ── PASO 1: Datos ── */}
                  {licenseStep === 1 && (
                    <div className="bg-card rounded-xl border border-border p-6 space-y-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Informacion de la empresa</p>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground">Nombre de la empresa <span className="text-destructive">*</span></label>
                            <input
                              type="text"
                              value={licenseForm.empresa_nombre}
                              onChange={e => handleLicenseFieldChange('empresa_nombre', e.target.value)}
                              onBlur={() => handleLicenseBlur('empresa_nombre')}
                              placeholder="Mi Empresa SA de CV"
                              className={cn(
                                'w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-accent transition-all duration-150',
                                licenseFieldErrors.empresa_nombre && licenseTouched.empresa_nombre
                                  ? 'border-destructive/50 focus:ring-destructive/20'
                                  : 'border-border focus:ring-accent/30'
                              )}
                            />
                            {licenseFieldErrors.empresa_nombre && licenseTouched.empresa_nombre && (
                              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                {licenseFieldErrors.empresa_nombre}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-foreground">RFC <span className="text-destructive">*</span></label>
                              <input
                                type="text"
                                value={licenseForm.empresa_rfc}
                                onChange={e => handleLicenseFieldChange('empresa_rfc', e.target.value.toUpperCase())}
                                onBlur={() => handleLicenseBlur('empresa_rfc')}
                                placeholder="ABC123456789"
                                maxLength={13}
                                className={cn(
                                  'w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-accent transition-all duration-150 uppercase',
                                  licenseFieldErrors.empresa_rfc && licenseTouched.empresa_rfc
                                    ? 'border-destructive/50 focus:ring-destructive/20'
                                    : 'border-border focus:ring-accent/30'
                                )}
                              />
                              {licenseFieldErrors.empresa_rfc && licenseTouched.empresa_rfc && (
                                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                  {licenseFieldErrors.empresa_rfc}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-sm font-medium text-foreground">Correo del administrador <span className="text-destructive">*</span></label>
                              <input
                                type="email"
                                value={licenseForm.usuario_email}
                                onChange={e => handleLicenseFieldChange('usuario_email', e.target.value)}
                                onBlur={() => handleLicenseBlur('usuario_email')}
                                placeholder="admin@empresa.com"
                                className={cn(
                                  'w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-accent transition-all duration-150',
                                  licenseFieldErrors.usuario_email && licenseTouched.usuario_email
                                    ? 'border-destructive/50 focus:ring-destructive/20'
                                    : 'border-border focus:ring-accent/30'
                                )}
                              />
                              {licenseFieldErrors.usuario_email && licenseTouched.usuario_email && (
                                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                  {licenseFieldErrors.usuario_email}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">Las credenciales de acceso se enviarán a este correo</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleLicenseStepNext}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
                        >
                          Siguiente
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── PASO 2: Capacidad + Preview + Confirmar ── */}
                  {licenseStep === 2 && (
                    <div className="space-y-4">
                      {/* Capacity card */}
                      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacidad de la licencia</p>

                        {/* Usuarios stepper */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">Total de usuarios</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Cuantos usuarios pueden registrarse en el sistema</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleLicenseFieldChange('max_usuarios', Math.max(1, licenseForm.max_usuarios - 1))}
                                className="w-8 h-8 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 flex items-center justify-center transition-colors disabled:opacity-40"
                                disabled={licenseForm.max_usuarios <= 1}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                              <span className="w-10 text-center text-lg font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                {licenseForm.max_usuarios}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleLicenseFieldChange('max_usuarios', licenseForm.max_usuarios + 1)}
                                className="w-8 h-8 rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 flex items-center justify-center transition-colors"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                            </div>
                          </div>
                          {/* Visual indicator */}
                          <div className="flex gap-1 flex-wrap">
                            {Array.from({ length: Math.min(licenseForm.max_usuarios, 20) }).map((_, i) => (
                              <div key={i} className="w-5 h-5 rounded bg-accent/20 border border-accent/30 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent/70"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                              </div>
                            ))}
                            {licenseForm.max_usuarios > 20 && (
                              <div className="w-5 h-5 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-accent/70">+{licenseForm.max_usuarios - 20}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="h-px bg-border" />

                        {/* Conectados stepper */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">Sesiones simultaneas</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Cuantos usuarios pueden estar conectados al mismo tiempo</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleLicenseFieldChange('max_usuarios_conectados', Math.max(1, licenseForm.max_usuarios_conectados - 1))}
                                className="w-8 h-8 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 flex items-center justify-center transition-colors disabled:opacity-40"
                                disabled={licenseForm.max_usuarios_conectados <= 1}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                              <span className="w-10 text-center text-lg font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                {licenseForm.max_usuarios_conectados}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleLicenseFieldChange('max_usuarios_conectados', Math.min(licenseForm.max_usuarios, licenseForm.max_usuarios_conectados + 1))}
                                disabled={licenseForm.max_usuarios_conectados >= licenseForm.max_usuarios}
                                className="w-8 h-8 rounded-lg border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 flex items-center justify-center transition-colors disabled:opacity-40"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {licenseForm.max_usuarios_conectados} de {licenseForm.max_usuarios} usuarios podrán conectarse a la vez ({Math.round((licenseForm.max_usuarios_conectados / licenseForm.max_usuarios) * 100)}%)
                          </p>
                        </div>
                      </div>

                      {/* Preview card */}
                      <div className="bg-card rounded-xl border border-accent/30 p-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vista previa de la licencia</p>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
                            {licenseForm.empresa_nombre.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground leading-tight">{licenseForm.empresa_nombre || '—'}</p>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">{licenseForm.empresa_rfc || '—'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-1">
                          <div className="bg-secondary rounded-lg px-3 py-2.5 text-center border border-border">
                            <p className="text-xs text-muted-foreground">Admin</p>
                            <p className="text-xs font-medium text-foreground mt-0.5 truncate" title={licenseForm.usuario_email}>{licenseForm.usuario_email || '—'}</p>
                          </div>
                          <div className="bg-secondary rounded-lg px-3 py-2.5 text-center border border-border">
                            <p className="text-xs text-muted-foreground">Max usuarios</p>
                            <p className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{licenseForm.max_usuarios}</p>
                          </div>
                          <div className="bg-secondary rounded-lg px-3 py-2.5 text-center border border-border">
                            <p className="text-xs text-muted-foreground">Max sesiones</p>
                            <p className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{licenseForm.max_usuarios_conectados}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => { setLicenseStep(1); setLicenseError(null) }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                          Regresar
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleCreateLicense()}
                          disabled={licenseLoading}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          style={{ fontFamily: 'var(--font-space-grotesk)' }}
                        >
                          {licenseLoading ? (
                            <>
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
                              Creando licencia...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                              Confirmar y dar de alta
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── ANUNCIOS ──────────────────────────────── */}
          {activeView === 'anuncios' && (
              <div className="max-w-5xl space-y-5">

                {/* Toast */}
                {anuncioToast && (
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm',
                    anuncioToast.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-destructive/8 border-destructive/25 text-destructive'
                  )}>
                    {anuncioToast.type === 'success'
                      ? <svg width="15" height="15" className="flex-shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      : <svg width="15" height="15" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    }
                    {anuncioToast.text}
                    <button onClick={() => setAnuncioToast(null)} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                )}

                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Anuncios</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Gestiona los avisos visibles para los usuarios del sistema</p>
                  </div>
                  <ReloadButton onClick={() => void loadAnuncios()} loading={anunciosLoading} />
                </div>

                {/* Stat pills */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn('flex items-center gap-2 px-3.5 py-2 rounded-xl border', anunciosActiveCount > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-secondary border-border')}>
                    <span className={cn('w-2 h-2 rounded-full', anunciosActiveCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30')} />
                    <span className={cn('text-xs font-semibold', anunciosActiveCount > 0 ? 'text-emerald-700' : 'text-muted-foreground')}>{anunciosActiveCount} activo{anunciosActiveCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border border-border">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    <span className="text-xs font-semibold text-muted-foreground">{anuncios.length} en total</span>
                  </div>
                </div>

                {/* Two-column layout on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-5 items-start">

                  {/* ── CREATE FORM ── */}
                  <div className="bg-card rounded-xl border border-border p-5 space-y-4 sticky top-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      </div>
                      <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Nuevo anuncio</p>
                    </div>

                    <div className="space-y-3.5">
                      {/* Titulo */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titulo <span className="text-destructive">*</span></label>
                        <input
                          type="text"
                          value={anuncioForm.titulo}
                          onChange={e => { setAnuncioForm(p => ({ ...p, titulo: e.target.value })); if (anuncioFormErrors.titulo) setAnuncioFormErrors(p => ({ ...p, titulo: '' })) }}
                          placeholder="Ej: Aviso de mantenimiento"
                          className={cn(
                            'w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-accent transition-all duration-150',
                            anuncioFormErrors.titulo ? 'border-destructive/50 focus:ring-destructive/20' : 'border-border focus:ring-accent/30'
                          )}
                        />
                        {anuncioFormErrors.titulo && <p className="text-xs text-destructive">{anuncioFormErrors.titulo}</p>}
                      </div>

                      {/* Descripcion */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripcion <span className="text-destructive">*</span></label>
                        <textarea
                          value={anuncioForm.descripcion}
                          onChange={e => { setAnuncioForm(p => ({ ...p, descripcion: e.target.value })); if (anuncioFormErrors.descripcion) setAnuncioFormErrors(p => ({ ...p, descripcion: '' })) }}
                          placeholder="Describe el aviso para los usuarios..."
                          rows={3}
                          className={cn(
                            'w-full rounded-lg border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-accent transition-all duration-150 resize-none',
                            anuncioFormErrors.descripcion ? 'border-destructive/50 focus:ring-destructive/20' : 'border-border focus:ring-accent/30'
                          )}
                        />
                        {anuncioFormErrors.descripcion && <p className="text-xs text-destructive">{anuncioFormErrors.descripcion}</p>}
                      </div>

                      {/* Enlace */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enlace <span className="text-muted-foreground/50 font-normal normal-case">(opcional)</span></label>
                        <div className="relative">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                          <input
                            type="url"
                            value={anuncioForm.enlace_url}
                            onChange={e => setAnuncioForm(p => ({ ...p, enlace_url: e.target.value }))}
                            placeholder="https://..."
                            className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-border bg-secondary/40 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
                          />
                        </div>
                      </div>

                      {/* Activo toggle */}
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <p className="text-sm font-medium text-foreground">Publicar inmediatamente</p>
                          <p className="text-xs text-muted-foreground">Visible para los usuarios al crearse</p>
                        </div>
                        <AnuncioToggle
                          checked={anuncioForm.activo}
                          onChange={() => setAnuncioForm(p => ({ ...p, activo: !p.activo }))}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleCreateAnuncio()}
                      disabled={anuncioFormLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-sm"
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    >
                      {anuncioFormLoading ? (
                        <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg> Publicando...</>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Publicar anuncio</>
                      )}
                    </button>
                  </div>

                  {/* ── ANUNCIOS LIST ── */}
                  <div className="space-y-3">
                    {anunciosLoading ? (
                      <LoadingState text="Cargando anuncios..." />
                    ) : anuncios.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-16 text-center bg-card rounded-xl border border-border">
                        <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Sin anuncios</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Crea tu primer anuncio con el formulario.</p>
                        </div>
                      </div>
                    ) : (
                      anuncios.map((anuncio) => {
                        const isEditing = editingAnuncioId === anuncio.id
                        const isDelConfirm = anuncioDeleteConfirmId === anuncio.id
                        const isDeleting = anuncioDeleteLoading === anuncio.id
                        const isToggling = togglingAnuncioId === anuncio.id
                        const enabled = Boolean(anuncio.activo)

                        return (
                          <div
                            key={anuncio.id}
                            className={cn(
                              'bg-card rounded-xl border transition-all duration-200',
                              enabled ? 'border-emerald-200/50' : 'border-border',
                              isEditing && 'ring-2 ring-accent/20 border-accent/40'
                            )}
                          >
                            {/* Image */}
                            {anuncio.imagen_url && !isEditing && (
                              <div className="relative">
                                <img
                                  src={`https://montekvps.cloud${anuncio.imagen_url}`}
                                  alt={anuncio.titulo}
                                  className="w-full h-32 object-cover rounded-t-xl"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteAnuncioImage(anuncio.id)}
                                  disabled={deletingImageId === anuncio.id}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-foreground/75 text-background flex items-center justify-center hover:bg-foreground transition-colors disabled:opacity-50 backdrop-blur-sm"
                                  aria-label="Eliminar imagen"
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                              </div>
                            )}

                            <div className="p-4 space-y-3">
                              {isEditing ? (
                                /* ── EDIT MODE ── */
                                <div className="space-y-3.5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-accent uppercase tracking-wider">Editando anuncio</p>
                                    <button onClick={() => setEditingAnuncioId(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Titulo</label>
                                    <input
                                      type="text"
                                      value={editingAnuncioForm.titulo}
                                      onChange={e => setEditingAnuncioForm(p => ({ ...p, titulo: e.target.value }))}
                                      className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripcion</label>
                                    <textarea
                                      value={editingAnuncioForm.descripcion}
                                      onChange={e => setEditingAnuncioForm(p => ({ ...p, descripcion: e.target.value }))}
                                      rows={3}
                                      className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enlace <span className="font-normal normal-case">(opcional)</span></label>
                                    <div className="relative">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                      <input
                                        type="url"
                                        value={editingAnuncioForm.enlace_url}
                                        onChange={e => setEditingAnuncioForm(p => ({ ...p, enlace_url: e.target.value }))}
                                        placeholder="https://..."
                                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-border bg-secondary/40 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all duration-150"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between py-0.5">
                                    <p className="text-sm font-medium text-foreground">Activo</p>
                                    <AnuncioToggle checked={editingAnuncioForm.activo} onChange={() => setEditingAnuncioForm(p => ({ ...p, activo: !p.activo }))} />
                                  </div>
                                  <div className="flex gap-2 justify-end pt-1">
                                    <button type="button" onClick={() => setEditingAnuncioId(null)} disabled={editingAnuncioLoading} className="text-xs px-3.5 py-2 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors font-medium">
                                      Cancelar
                                    </button>
                                    <button type="button" onClick={() => void handleUpdateAnuncio(anuncio.id)} disabled={editingAnuncioLoading} className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 font-semibold">
                                      {editingAnuncioLoading
                                        ? <><svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg> Guardando...</>
                                        : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> Guardar cambios</>
                                      }
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* ── VIEW MODE ── */
                                <>
                                  {/* Header row: title + status toggle */}
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground text-sm leading-snug" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{anuncio.titulo}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(anuncio.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {' '}&mdash;{' '}
                                        {new Date(anuncio.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <AnuncioToggle
                                      checked={enabled}
                                      onChange={() => void handleToggleAnuncioActivo(anuncio)}
                                      disabled={isToggling}
                                    />
                                  </div>

                                  {/* Description */}
                                  <p className="text-xs text-muted-foreground leading-relaxed">{anuncio.descripcion}</p>

                                  {/* Link */}
                                  {anuncio.enlace_url && (
                                    <a href={anuncio.enlace_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors font-medium">
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                      Ver enlace
                                    </a>
                                  )}

                                  {/* Image upload zone */}
                                  {!anuncio.imagen_url && (
                                    <label className={cn(
                                      'flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                                      uploadingImageId === anuncio.id
                                        ? 'border-accent/40 bg-accent/5'
                                        : 'border-border hover:border-accent/40 hover:bg-accent/3'
                                    )}>
                                      <input type="file" accept="image/*" className="sr-only" disabled={uploadingImageId === anuncio.id} onChange={e => { const f = e.currentTarget.files?.[0]; if (f) void handleUploadAnuncioImage(anuncio.id, f) }} />
                                      {uploadingImageId === anuncio.id
                                        ? <><svg className="animate-spin w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg><span className="text-xs text-accent font-medium">Subiendo imagen...</span></>
                                        : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg><span className="text-xs text-muted-foreground">Subir imagen</span></>
                                      }
                                    </label>
                                  )}

                                  {/* Divider + actions */}
                                  <div className="pt-2 border-t border-border/60">
                                    {isDelConfirm ? (
                                      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                                        <p className="text-xs font-medium text-red-800">Eliminar este anuncio permanentemente?</p>
                                        <div className="flex gap-2 flex-shrink-0">
                                          <button type="button" onClick={() => setAnuncioDeleteConfirmId(null)} className="text-xs px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground transition-colors font-medium">Cancelar</button>
                                          <button
                                            type="button"
                                            disabled={isDeleting}
                                            onClick={() => void handleDeleteAnuncio(anuncio.id)}
                                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold"
                                          >
                                            {isDeleting ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg> : null}
                                            Si, eliminar
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <span className={cn(
                                            'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                                            enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-secondary text-muted-foreground border-border'
                                          )}>
                                            {enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                            {enabled ? 'Activo' : 'Inactivo'}
                                          </span>
                                          {anuncio.imagen_url && (
                                            <button
                                              type="button"
                                              onClick={() => void handleDeleteAnuncioImage(anuncio.id)}
                                              disabled={deletingImageId === anuncio.id}
                                              className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                                            >
                                              {deletingImageId === anuncio.id ? 'Quitando...' : 'Quitar imagen'}
                                            </button>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => { setEditingAnuncioId(anuncio.id); setEditingAnuncioForm({ titulo: anuncio.titulo, descripcion: anuncio.descripcion ?? '', enlace_url: anuncio.enlace_url ?? '', activo: Boolean(anuncio.activo) }) }}
                                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent/40 transition-colors"
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setAnuncioDeleteConfirmId(anuncio.id)}
                                            disabled={isDeleting}
                                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                                          >
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                            Eliminar
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* ── EMPRESAS ──────────────────────────────── */}
          {activeView === 'empresas' && (
              <div className="max-w-5xl space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Empresas</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Directorio de empresas registradas en el sistema</p>
                  </div>
                  <ReloadButton onClick={() => void loadEmpresas()} loading={empresasLoading} />
                </div>

                {/* Stats + search */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border border-border">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                    <span className="text-xs font-semibold text-muted-foreground">{parentEmpresas.length} empresa{parentEmpresas.length !== 1 ? 's' : ''}</span>
                  </div>
                  {parentEmpresas.some(e => e.children?.length > 0) && (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/8 border border-primary/20">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                      <span className="text-xs font-semibold text-primary">{parentEmpresas.reduce((acc, e) => acc + (e.children?.length ?? 0), 0)} sucursales</span>
                    </div>
                  )}
                  <div className="relative ml-auto">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, RFC o DB..."
                      value={empresasSearch}
                      onChange={e => setEmpresasSearch(e.target.value)}
                      className="pl-8 pr-8 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all w-60"
                    />
                    {empresasSearch && (
                      <button onClick={() => setEmpresasSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Error */}
                {empresasError && <ErrorState message={empresasError} onRetry={() => void loadEmpresas()} />}

                {/* Content */}
                {empresasLoading ? (
                  <LoadingState text="Cargando empresas..." />
                ) : filteredEmpresas.length === 0 && !empresasError ? (
                  empresasSearch ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      </div>
                      <p className="text-sm text-muted-foreground">Sin resultados para <strong className="text-foreground">&ldquo;{empresasSearch}&rdquo;</strong></p>
                    </div>
                  ) : (
                    <EmptyState text="No hay empresas registradas." />
                  )
                ) : (
                  <div className="grid gap-3">
                    {filteredEmpresas.map((empresa) => {
                      const isExpanded = expandedEmpresaId === empresa.id
                      const hasSucursales = empresa.children && empresa.children.length > 0
                      const hasDB = Boolean(empresa.db_nombre_contpaqi)

                      return (
                        <div
                          key={empresa.id}
                          className={cn(
                            'bg-card rounded-xl border transition-all duration-200',
                            isExpanded ? 'border-accent/40 shadow-sm shadow-accent/5' : 'border-border hover:border-border/80 hover:shadow-sm'
                          )}
                        >
                          {/* Main row */}
                          <button
                            type="button"
                            className="w-full flex items-center gap-4 px-5 py-4 text-left"
                            onClick={() => setExpandedEmpresaId(isExpanded ? null : empresa.id)}
                          >
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                              {empresa.nombre.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-foreground truncate" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{empresa.nombre}</p>
                                {empresa.es_cliente_principal && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                                    Principal
                                  </span>
                                )}
                                {hasSucursales && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/20">
                                    {empresa.children.length} sucursal{empresa.children.length !== 1 ? 'es' : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="font-mono text-xs text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded">{empresa.rfc}</span>
                                {hasDB && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                                    {empresa.db_nombre_contpaqi}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chevron */}
                            <svg
                              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              className={cn('flex-shrink-0 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="border-t border-border bg-secondary/30 rounded-b-xl px-5 py-4 space-y-4">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">ID</p>
                                  <p className="text-xs font-mono text-foreground truncate" title={empresa.id}>{empresa.id}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">RFC</p>
                                  <p className="text-sm font-mono font-semibold text-foreground">{empresa.rfc}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">DB ContPAQi</p>
                                  <p className="text-sm text-foreground">{empresa.db_nombre_contpaqi || <span className="text-muted-foreground/50 italic">No configurada</span>}</p>
                                </div>
                              </div>

                              {/* Sucursales */}
                              {hasSucursales && (
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Sucursales</p>
                                  <div className="flex flex-wrap gap-2">
                                    {empresa.children.map(child => (
                                      <div key={child.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                                        <div className="w-6 h-6 rounded-md bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                          {child.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="text-xs font-semibold text-foreground leading-tight">{child.nombre}</p>
                                          <p className="text-[10px] font-mono text-muted-foreground">{child.rfc}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

          {/* ── DEV MODE ──────────────────────────────── */}
          {activeView === 'dev-mode' && (() => {
            const activeCount = empresasDevMode.filter(e => e.dev_mode_enabled).length
            const filtered = empresasDevMode.filter(e =>
              !devModeSearch ||
              e.nombre.toLowerCase().includes(devModeSearch.toLowerCase()) ||
              e.rfc.toLowerCase().includes(devModeSearch.toLowerCase())
            )

            return (
              <div className="max-w-4xl space-y-5">

                {/* Toast */}
                {devModeMessage && (
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-sm',
                    devModeMessage.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-destructive/8 border-destructive/25 text-destructive'
                  )}>
                    {devModeMessage.type === 'success' ? (
                      <svg width="15" height="15" className="flex-shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="15" height="15" className="flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    )}
                    {devModeMessage.text}
                    <button onClick={() => setDevModeMessage(null)} className="ml-auto flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Dev Mode</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Control de modo desarrollador por empresa</p>
                  </div>
                  <ReloadButton onClick={() => void loadDevModeEmpresas()} loading={devModeLoading} />
                </div>

                {/* Stat pills + search */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl border',
                    activeCount > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-secondary border-border'
                  )}>
                    <span className={cn('w-2 h-2 rounded-full', activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30')} />
                    <span className={cn('text-xs font-semibold', activeCount > 0 ? 'text-emerald-700' : 'text-muted-foreground')}>
                      {activeCount} activo{activeCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border border-border">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                    <span className="text-xs font-semibold text-muted-foreground">{empresasDevMode.length} empresas</span>
                  </div>

                  {/* Search */}
                  <div className="relative ml-auto">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={devModeSearch}
                      onChange={e => setDevModeSearch(e.target.value)}
                      className="pl-8 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all w-52"
                    />
                    {devModeSearch && (
                      <button
                        onClick={() => setDevModeSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                {devModeLoading ? (
                  <LoadingState text="Cargando empresas..." />
                ) : devModeError ? (
                  <ErrorState message={devModeError} onRetry={() => void loadDevModeEmpresas()} />
                ) : filtered.length === 0 ? (
                  devModeSearch ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      </div>
                      <p className="text-sm text-muted-foreground">Sin resultados para <strong className="text-foreground">&ldquo;{devModeSearch}&rdquo;</strong></p>
                    </div>
                  ) : (
                    <EmptyState text="No hay empresas disponibles." />
                  )
                ) : (
                  <div className="grid gap-3">
                    {filtered.map((empresa) => {
                      const isToggling = togglingDevModeId === empresa.id
                      const isConfirming = devModeConfirmId === empresa.id
                      const enabled = empresa.dev_mode_enabled

                      return (
                        <div
                          key={empresa.id}
                          className={cn(
                            'bg-card rounded-xl border transition-all duration-200',
                            enabled
                              ? 'border-emerald-200/60 shadow-sm shadow-emerald-500/5'
                              : 'border-border'
                          )}
                        >
                          <div className="flex items-center gap-4 px-5 py-4">
                            {/* Avatar */}
                            <div className={cn(
                              'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 relative',
                              enabled
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-secondary text-muted-foreground border border-border'
                            )}>
                              {empresa.nombre.charAt(0).toUpperCase()}
                              {enabled && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-foreground truncate">{empresa.nombre}</p>
                                <span className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                                  enabled
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-secondary text-muted-foreground border-border'
                                )}>
                                  {enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                  {enabled ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="font-mono text-xs text-muted-foreground bg-secondary border border-border px-1.5 py-0.5 rounded">
                                  {empresa.rfc}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]" title={empresa.id}>
                                  ID: {empresa.id.slice(0, 8)}...
                                </span>
                                {empresa.children && empresa.children.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {empresa.children.length} sub-empresa{empresa.children.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Toggle switch */}
                            {!isConfirming && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (enabled) setDevModeConfirmId(empresa.id)
                                  else void handleToggleDevMode(empresa.id, false)
                                }}
                                disabled={isToggling}
                                className="flex items-center gap-3 flex-shrink-0 group disabled:opacity-50"
                                aria-label={enabled ? 'Desactivar dev mode' : 'Activar dev mode'}
                              >
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block">
                                  {isToggling ? 'Aplicando...' : enabled ? 'Desactivar' : 'Activar'}
                                </span>
                                {/* Visual toggle */}
                                <span className={cn(
                                  'relative inline-flex items-center w-11 h-6 rounded-full border transition-all duration-300',
                                  enabled
                                    ? 'bg-emerald-500 border-emerald-500'
                                    : 'bg-secondary border-border',
                                  isToggling && 'opacity-50'
                                )}>
                                  <span className={cn(
                                    'absolute w-4 h-4 rounded-full bg-card shadow-sm transition-all duration-300',
                                    enabled ? 'left-6' : 'left-1'
                                  )}>
                                    {isToggling && (
                                      <span className="absolute inset-0 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                    )}
                                  </span>
                                </span>
                              </button>
                            )}
                          </div>

                          {/* Confirmation strip for deactivation */}
                          {isConfirming && (
                            <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 flex-shrink-0">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <p className="text-xs font-medium text-red-800">
                                  Desactivar dev mode para <strong>{empresa.nombre}</strong>?
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setDevModeConfirmId(null)}
                                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={isToggling}
                                  onClick={() => void handleToggleDevMode(empresa.id, true)}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  {isToggling ? (
                                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>
                                  ) : null}
                                  Si, desactivar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── LICENSES ──────────────────────────────── */}
          {activeView === 'licenses' && (
              <div className="max-w-5xl space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Licencias</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Capacidad y uso de licencias por empresa</p>
                  </div>
                  <ReloadButton onClick={() => void loadLicenses()} loading={licensesLoading} />
                </div>

                {/* Stats + filters + search */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status filter pills */}
                  {(['all', 'critical', 'warning', 'ok'] as const).map(f => {
                    const counts = { all: licensesWithPct.length, critical: licensesCriticalCount, warning: licensesWarningCount, ok: licensesWithPct.length - licensesCriticalCount - licensesWarningCount }
                    const labels = { all: 'Todas', critical: 'Critico', warning: 'Advertencia', ok: 'Normal' }
                    const active = licensesFilter === f
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setLicensesFilter(f)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150',
                          active
                            ? f === 'critical' ? 'bg-red-100 border-red-300 text-red-700' :
                              f === 'warning'  ? 'bg-amber-100 border-amber-300 text-amber-700' :
                              f === 'ok'       ? 'bg-emerald-100 border-emerald-300 text-emerald-700' :
                              'bg-accent text-white border-accent'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                        )}
                      >
                        {f === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        {f === 'warning'  && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {f === 'ok'       && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {labels[f]}
                        <span className={cn(
                          'ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold',
                          active ? 'bg-white/30' : 'bg-secondary/80'
                        )}>{counts[f]}</span>
                      </button>
                    )
                  })}

                  {/* Search */}
                  <div className="relative ml-auto">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={licensesSearch}
                      onChange={e => setLicensesSearch(e.target.value)}
                      className="pl-8 pr-8 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 transition-all w-52"
                    />
                    {licensesSearch && (
                      <button onClick={() => setLicensesSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Alerts banner */}
                {(licensesCriticalCount > 0 || licensesWarningCount > 0) && !licensesLoading && (
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium',
                    licensesCriticalCount > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  )}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    {licensesCriticalCount > 0
                      ? `${licensesCriticalCount} empresa${licensesCriticalCount !== 1 ? 's' : ''} con uso critico de licencias (90%+)`
                      : `${licensesWarningCount} empresa${licensesWarningCount !== 1 ? 's' : ''} con uso elevado de licencias (70%+)`
                    }
                  </div>
                )}

                {/* Error */}
                {licensesError && <ErrorState message={licensesError} onRetry={() => void loadLicenses()} />}

                {/* Content */}
                {licensesLoading ? (
                  <LoadingState text="Cargando licencias..." />
                ) : filteredLicenses.length === 0 && !licensesError ? (
                  licensesSearch || licensesFilter !== 'all' ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      </div>
                      <p className="text-sm text-muted-foreground">Sin resultados para el filtro seleccionado.</p>
                    </div>
                  ) : (
                    <EmptyState text="No hay licencias disponibles." />
                  )
                ) : (
                  <div className="grid gap-3">
                    {filteredLicenses.map((license) => {
                      const meta = licenseStatusMeta[license.status]
                      const sesionPct = license.max_usuarios_conectados > 0
                        ? Math.round(((license.sesiones_activas ?? 0) / license.max_usuarios_conectados) * 100)
                        : 0
                      const idleMin = license.session_idle_seconds ? Math.round(license.session_idle_seconds / 60) : null

                      return (
                        <div
                          key={license.id}
                          className={cn(
                            'bg-card rounded-xl border transition-all duration-200 hover:shadow-sm',
                            license.status === 'critical' ? 'border-red-200/70' :
                            license.status === 'warning'  ? 'border-amber-200/60' :
                            'border-border'
                          )}
                        >
                          <div className="p-5">
                            <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <div className={cn(
                                'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border',
                                license.status === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                license.status === 'warning'  ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                'bg-primary/10 text-primary border-primary/20'
                              )}>
                                {(license.empresa_nombre ?? 'E').charAt(0).toUpperCase()}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                    {license.empresa_nombre || `Empresa ${license.empresa_id.slice(0, 8)}`}
                                  </p>
                                  <span className={cn(
                                    'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                                    meta.bg, meta.border, meta.text
                                  )}>
                                    <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot, license.status === 'critical' && 'animate-pulse')} />
                                    {meta.label}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate" title={license.empresa_id}>{license.empresa_id}</p>
                              </div>

                              {/* Big usage number */}
                              <div className="flex-shrink-0 text-right">
                                <p className={cn('text-2xl font-bold tabular-nums leading-none', license.pct >= 90 ? 'text-red-600' : license.pct >= 70 ? 'text-amber-600' : 'text-foreground')} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                  {license.pct}%
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">de capacidad</p>
                              </div>
                            </div>

                            {/* Usage bar */}
                            <div className="mt-4 space-y-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Usuarios activos</p>
                                <p className="text-xs font-semibold text-foreground tabular-nums">
                                  {license.usuarios_activos ?? 0} <span className="text-muted-foreground font-normal">/ {license.max_usuarios}</span>
                                </p>
                              </div>
                              <div className="w-full h-2 rounded-full bg-secondary border border-border overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full transition-all duration-500', meta.bar)}
                                  style={{ width: `${Math.min(license.pct, 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Metrics grid */}
                            <div className="mt-4 grid grid-cols-3 gap-3">
                              {/* Sesiones */}
                              <div className="bg-secondary/50 border border-border rounded-lg px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Sesiones</p>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-base font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{license.sesiones_activas ?? 0}</span>
                                  <span className="text-xs text-muted-foreground">/ {license.max_usuarios_conectados}</span>
                                </div>
                                <div className="mt-1.5 w-full h-1 rounded-full bg-secondary border border-border overflow-hidden">
                                  <div className={cn('h-full rounded-full', sesionPct >= 90 ? 'bg-red-500' : sesionPct >= 70 ? 'bg-amber-500' : 'bg-accent')} style={{ width: `${Math.min(sesionPct, 100)}%` }} />
                                </div>
                              </div>

                              {/* Disponibles */}
                              <div className="bg-secondary/50 border border-border rounded-lg px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Disponibles</p>
                                <div className="flex items-baseline gap-1">
                                  <span className={cn('text-base font-bold tabular-nums', (license.usuarios_disponibles ?? 0) === 0 ? 'text-red-600' : 'text-foreground')} style={{ fontFamily: 'var(--font-space-grotesk)' }}>{license.usuarios_disponibles ?? 0}</span>
                                  <span className="text-xs text-muted-foreground">usr</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">slots libres</p>
                              </div>

                              {/* Idle / Sesiones disp. */}
                              <div className="bg-secondary/50 border border-border rounded-lg px-3 py-2.5">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Ses. libres</p>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-base font-bold text-foreground tabular-nums" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{license.sesiones_disponibles ?? 0}</span>
                                  <span className="text-xs text-muted-foreground">slots</span>
                                </div>
                                {idleMin !== null && (
                                  <p className="text-[10px] text-muted-foreground mt-1">idle: {idleMin}m</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
        </div>
      </main>
    </div>
  )
}
