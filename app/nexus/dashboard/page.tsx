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

/* ── Page ────────────────────���──────────────────────────── */

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
  const [licenseForm, setLicenseForm] = useState<LicenseSetupPayload>({
    empresa_nombre: '',
    empresa_rfc: '',
    usuario_email: '',
    max_usuarios: 5,
    max_usuarios_conectados: 3,
  })
  const [licenseLoading, setLicenseLoading] = useState(false)
  const [licenseMessage, setLicenseMessage] = useState<string | null>(null)
  const [licenseError, setLicenseError] = useState<string | null>(null)

  // Anuncios
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [anunciosLoading, setAnunciosLoading] = useState(false)
  const [anunciosError, setAnunciosError] = useState<string | null>(null)
  const [anuncioForm, setAnuncioForm] = useState({ titulo: '', descripcion: '', activo: true })
  const [anuncioFormLoading, setAnuncioFormLoading] = useState(false)
  const [anuncioFormMessage, setAnuncioFormMessage] = useState<string | null>(null)
  const [anuncioDeleteLoading, setAnuncioDeleteLoading] = useState<number | null>(null)
  const [editingAnuncioId, setEditingAnuncioId] = useState<number | null>(null)
  const [editingAnuncioForm, setEditingAnuncioForm] = useState({ titulo: '', activo: true })
  const [editingAnuncioLoading, setEditingAnuncioLoading] = useState(false)
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null)
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)

  // Empresas
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresasLoading, setEmpresasLoading] = useState(false)
  const [empresasError, setEmpresasError] = useState<string | null>(null)

  // Licenses
  const [licenses, setLicenses] = useState<License[]>([])
  const [licensesLoading, setLicensesLoading] = useState(false)
  const [licensesError, setLicensesError] = useState<string | null>(null)

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
    if (!session?.token || !anuncioForm.titulo || !anuncioForm.descripcion) {
      setAnunciosError('Completa título y descripción')
      return
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

  async function handleCreateLicense() {
    if (!session?.token) return
    if (!licenseForm.empresa_nombre || !licenseForm.empresa_rfc || !licenseForm.usuario_email) {
      setLicenseError('Completa empresa, RFC y correo del usuario')
      return
    }
    setLicenseLoading(true)
    setLicenseMessage(null)
    setLicenseError(null)
    try {
      const res = await fetch('https://montekvps.cloud/api/licenses/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ ...licenseForm, max_usuarios: Number(licenseForm.max_usuarios), max_usuarios_conectados: Number(licenseForm.max_usuarios_conectados) }),
      })
      if (res.status === 401 || res.status === 403) { clearSession(); router.replace('/nexus/login'); return }
      if (!res.ok) { const ep = await res.json().catch(() => ({} as { message?: string })); throw new Error(ep?.message || `Error HTTP ${res.status}`) }
      setLicenseMessage('Licencia creada correctamente.')
      setLicenseForm({ empresa_nombre: '', empresa_rfc: '', usuario_email: '', max_usuarios: 5, max_usuarios_conectados: 3 })
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
            <div className="max-w-2xl">
              <div className="bg-card rounded-xl border border-border p-6">
                <SectionHeader title="Crear nueva licencia" description="Registra una empresa y genera sus credenciales de acceso." />

                {licenseMessage && <SuccessBanner message={licenseMessage} />}
                {licenseError && <ErrorBanner message={licenseError} />}

                <div className="space-y-5">
                  {/* Empresa section */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Datos de la empresa</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <InputField
                          label="Nombre de la empresa"
                          value={licenseForm.empresa_nombre}
                          onChange={(e) => setLicenseForm((prev) => ({ ...prev, empresa_nombre: e.target.value }))}
                          placeholder="Mi Empresa SA de CV"
                        />
                      </div>
                      <InputField
                        label="RFC"
                        value={licenseForm.empresa_rfc}
                        onChange={(e) => setLicenseForm((prev) => ({ ...prev, empresa_rfc: e.target.value }))}
                        placeholder="ABC123456789"
                      />
                      <InputField
                        label="Correo del usuario"
                        type="email"
                        value={licenseForm.usuario_email}
                        onChange={(e) => setLicenseForm((prev) => ({ ...prev, usuario_email: e.target.value }))}
                        placeholder="admin@empresa.com"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  {/* Capacity section */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Capacidad de licencia</p>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Máx. usuarios"
                        type="number"
                        min={1}
                        value={licenseForm.max_usuarios}
                        onChange={(e) => setLicenseForm((prev) => ({ ...prev, max_usuarios: Number(e.target.value) || 0 }))}
                        hint="Total de usuarios que pueden registrarse"
                      />
                      <InputField
                        label="Máx. conectados"
                        type="number"
                        min={1}
                        value={licenseForm.max_usuarios_conectados}
                        onChange={(e) => setLicenseForm((prev) => ({ ...prev, max_usuarios_conectados: Number(e.target.value) || 0 }))}
                        hint="Sesiones simultáneas permitidas"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleCreateLicense()}
                    disabled={licenseLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {licenseLoading ? (
                      <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" /></svg>Creando...</>
                    ) : (
                      <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 18.56l-6.18 3.44L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>Dar de alta licencia</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── ANUNCIOS ──────────────────────────────── */}
          {activeView === 'anuncios' && (
            <div className="max-w-4xl space-y-6">
              {/* Create form */}
              <div className="bg-card rounded-xl border border-border p-6">
                <SectionHeader title="Crear anuncio" description="Publica un nuevo aviso para los usuarios del sistema." />
                {anuncioFormMessage && <SuccessBanner message={anuncioFormMessage} />}
                {anunciosError && !anuncioFormMessage && <ErrorBanner message={anunciosError} />}
                <div className="space-y-4">
                  <InputField
                    label="Título"
                    value={anuncioForm.titulo}
                    onChange={(e) => setAnuncioForm((prev) => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ej: Aviso de mantenimiento"
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Descripción</label>
                    <textarea
                      value={anuncioForm.descripcion}
                      onChange={(e) => setAnuncioForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-150 resize-none"
                      placeholder="Describe el aviso para los usuarios..."
                      rows={3}
                    />
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      className={cn(
                        'relative w-9 h-5 rounded-full border-2 transition-all duration-200',
                        anuncioForm.activo
                          ? 'bg-accent border-accent'
                          : 'bg-secondary border-border'
                      )}
                      onClick={() => setAnuncioForm((prev) => ({ ...prev, activo: !prev.activo }))}
                      role="checkbox"
                      aria-checked={anuncioForm.activo}
                    >
                      <div className={cn('absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200', anuncioForm.activo && 'translate-x-4')} />
                    </div>
                    <span className="text-sm text-foreground font-medium">Publicar inmediatamente</span>
                  </label>
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleCreateAnuncio()}
                    disabled={anuncioFormLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-sm"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    {anuncioFormLoading ? 'Creando...' : 'Publicar anuncio'}
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="bg-card rounded-xl border border-border p-6">
                <SectionHeader
                  title="Anuncios publicados"
                  description={`${anuncios.length} anuncio${anuncios.length !== 1 ? 's' : ''} en el sistema`}
                  action={<ReloadButton onClick={() => void loadAnuncios()} loading={anunciosLoading} />}
                />
                {anunciosLoading ? (
                  <LoadingState text="Cargando anuncios..." />
                ) : anuncios.length === 0 ? (
                  <EmptyState text="No hay anuncios publicados." />
                ) : (
                  <div className="space-y-3">
                    {anuncios.map((anuncio) => (
                      <div key={anuncio.id} className="rounded-lg border border-border bg-secondary/30 p-4 hover:border-accent/30 transition-colors">
                        {editingAnuncioId === anuncio.id ? (
                          <div className="space-y-3">
                            <InputField
                              label="Título"
                              value={editingAnuncioForm.titulo}
                              onChange={(e) => setEditingAnuncioForm((prev) => ({ ...prev, titulo: e.target.value }))}
                            />
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <div
                                className={cn('relative w-9 h-5 rounded-full border-2 transition-all duration-200', editingAnuncioForm.activo ? 'bg-accent border-accent' : 'bg-secondary border-border')}
                                onClick={() => setEditingAnuncioForm((prev) => ({ ...prev, activo: !prev.activo }))}
                                role="checkbox"
                                aria-checked={editingAnuncioForm.activo}
                              >
                                <div className={cn('absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200', editingAnuncioForm.activo && 'translate-x-4')} />
                              </div>
                              <span className="text-sm text-foreground">Activo</span>
                            </label>
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => setEditingAnuncioId(null)} disabled={editingAnuncioLoading} className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                                Cancelar
                              </button>
                              <button type="button" onClick={() => void handleUpdateAnuncio(anuncio.id)} disabled={editingAnuncioLoading} className="text-xs px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50">
                                {editingAnuncioLoading ? 'Guardando...' : 'Guardar cambios'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {anuncio.imagen_url && (
                              <div className="relative mb-3">
                                <img src={`https://montekvps.cloud${anuncio.imagen_url}`} alt={anuncio.titulo} className="w-full h-36 object-cover rounded-lg" />
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteAnuncioImage(anuncio.id)}
                                  disabled={deletingImageId === anuncio.id}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-md bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors disabled:opacity-50"
                                  aria-label="Eliminar imagen"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-foreground text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{anuncio.titulo}</p>
                                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded border', anuncio.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-secondary text-muted-foreground border-border')}>
                                    {anuncio.activo ? 'ACTIVO' : 'INACTIVO'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(anuncio.fecha_inicio).toLocaleDateString('es-MX')} — {new Date(anuncio.fecha_fin).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{anuncio.descripcion}</p>
                            {anuncio.enlace_url && (
                              <a href={anuncio.enlace_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5 text-xs text-accent hover:underline">
                                Ver enlace →
                              </a>
                            )}

                            {/* Image upload */}
                            <div className="mt-3 pt-3 border-t border-border/60">
                              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                                {anuncio.imagen_url ? 'Reemplazar imagen' : 'Subir imagen'}
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) void handleUploadAnuncioImage(anuncio.id, f) }}
                                disabled={uploadingImageId === anuncio.id}
                                className="text-xs text-muted-foreground file:mr-2 file:text-xs file:font-medium file:py-1 file:px-2.5 file:rounded-md file:border file:border-border file:bg-secondary file:text-foreground hover:file:border-accent/40 cursor-pointer disabled:opacity-50"
                              />
                              {uploadingImageId === anuncio.id && <span className="text-xs text-accent ml-2">Subiendo...</span>}
                            </div>

                            {/* Actions */}
                            <div className="mt-3 flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => { setEditingAnuncioId(anuncio.id); setEditingAnuncioForm({ titulo: anuncio.titulo, activo: Boolean(anuncio.activo) }) }}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent/40 hover:text-foreground transition-colors"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteAnuncio(anuncio.id)}
                                disabled={anuncioDeleteLoading === anuncio.id}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                                {anuncioDeleteLoading === anuncio.id ? 'Eliminando...' : 'Eliminar'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── EMPRESAS ──────────────────────────────── */}
          {activeView === 'empresas' && (
            <div className="max-w-5xl">
              <div className="bg-card rounded-xl border border-border p-6">
                <SectionHeader
                  title="Empresas"
                  description={`${empresas.length} empresa${empresas.length !== 1 ? 's' : ''} registrada${empresas.length !== 1 ? 's' : ''}`}
                  action={<ReloadButton onClick={() => void loadEmpresas()} loading={empresasLoading} />}
                />
                {empresasError && <ErrorBanner message={empresasError} />}
                {empresasLoading ? (
                  <LoadingState text="Cargando empresas..." />
                ) : empresas.length === 0 && !empresasError ? (
                  <EmptyState text="No hay empresas registradas." />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/60">
                          <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Empresa</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">RFC</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">DB ContPAQi</th>
                          <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Sucursales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {empresas.map((empresa) => (
                          <tr key={empresa.id} className="hover:bg-accent/4 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{empresa.nombre}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">{empresa.id}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs bg-secondary border border-border px-2 py-0.5 rounded text-foreground">{empresa.rfc}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {empresa.db_nombre_contpaqi || <span className="italic text-muted-foreground/50">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {empresa.children && empresa.children.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/8 border border-primary/20 px-2 py-0.5 rounded-md">
                                  {empresa.children.length} sucursal{empresa.children.length !== 1 ? 'es' : ''}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
            <div className="max-w-5xl">
              <div className="bg-card rounded-xl border border-border p-6">
                <SectionHeader
                  title="Licencias"
                  description="Capacidad y uso de licencias por empresa"
                  action={<ReloadButton onClick={() => void loadLicenses()} loading={licensesLoading} />}
                />
                {licensesError && <ErrorBanner message={licensesError} />}
                {licensesLoading ? (
                  <LoadingState text="Cargando licencias..." />
                ) : licenses.length === 0 && !licensesError ? (
                  <EmptyState text="No hay licencias disponibles." />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/60">
                          <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Empresa</th>
                          <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Usuarios</th>
                          <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Sesiones</th>
                          <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Disponibles</th>
                          <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Uso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {licenses.map((license) => {
                          const usagePct = license.max_usuarios > 0
                            ? Math.round(((license.usuarios_activos ?? 0) / license.max_usuarios) * 100)
                            : 0
                          return (
                            <tr key={license.id} className="hover:bg-accent/4 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium text-foreground">{license.empresa_nombre || `Empresa ${license.empresa_id}`}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{license.empresa_id}</p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold text-foreground tabular-nums">
                                  {license.usuarios_activos ?? 0}
                                </span>
                                <span className="text-muted-foreground"> / {license.max_usuarios}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="font-semibold text-foreground tabular-nums">
                                  {license.sesiones_activas ?? 0}
                                </span>
                                <span className="text-muted-foreground"> / {license.max_usuarios_conectados}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="text-sm text-foreground tabular-nums">
                                  {license.usuarios_disponibles ?? 0} <span className="text-muted-foreground text-xs">usr</span>
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5 justify-center">
                                  <div className="w-20 h-1.5 rounded-full bg-secondary border border-border overflow-hidden">
                                    <div
                                      className={cn('h-full rounded-full transition-all', usagePct > 80 ? 'bg-amber-500' : 'bg-accent')}
                                      style={{ width: `${usagePct}%` }}
                                    />
                                  </div>
                                  <span className={cn('text-xs font-semibold tabular-nums w-8 text-right', usagePct > 80 ? 'text-amber-600' : 'text-muted-foreground')}>
                                    {usagePct}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
