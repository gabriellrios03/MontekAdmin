'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, clearSession } from '@/lib/auth'
import type { NexusSession } from '@/lib/auth'
import { DashboardSidebar } from '@/components/nexus/dashboard-sidebar'
import type { DashboardView } from '@/components/nexus/dashboard-sidebar'
import {
  StatCard,
  ActivityFeed,
  WeeklyChart,
  PermissionsWidget,
  SystemStatus,
} from '@/components/nexus/dashboard-widgets'

const stats = [
  {
    label: 'Empresas registradas',
    value: '12',
    change: '8.3%',
    positive: true,
    accent: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    label: 'Usuarios activos',
    value: '248',
    change: '12.1%',
    positive: true,
    accent: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Reportes este mes',
    value: '1,847',
    change: '3.2%',
    positive: false,
    accent: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: 'Jobs ejecutados',
    value: '5,293',
    change: '24.7%',
    positive: true,
    accent: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

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

interface LicenseCapacity {
  license_id: string
  empresa_id: string
  max_usuarios: number
  max_usuarios_conectados: number
  usuarios_activos: number
  usuarios_disponibles: number
  sesiones_activas: number
  sesiones_disponibles: number
  session_idle_seconds: number
}


export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<NexusSession | null>(null)
  const [greeting, setGreeting] = useState('Bienvenido')
  const [activeView, setActiveView] = useState<DashboardView>('dashboard')
  const [devRequests, setDevRequests] = useState<DevModeRequest[]>([])
  const [devRequestsMeta, setDevRequestsMeta] = useState({ total: 0, page: 1, limit: 20 })
  const [devRequestsLoading, setDevRequestsLoading] = useState(false)
  const [devRequestsError, setDevRequestsError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
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
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [empresasLoading, setEmpresasLoading] = useState(false)
  const [empresasError, setEmpresasError] = useState<string | null>(null)
  const [licenses, setLicenses] = useState<License[]>([])
  const [licensesLoading, setLicensesLoading] = useState(false)
  const [licensesError, setLicensesError] = useState<string | null>(null)
  const [empresasDevMode, setEmpresasDevMode] = useState<EmpresaDevMode[]>([])
  const [devModeLoading, setDevModeLoading] = useState(false)
  const [devModeError, setDevModeError] = useState<string | null>(null)
  const [togglingDevModeId, setTogglingDevModeId] = useState<string | null>(null)

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
  }, [router])

  function handleLogout() {
    clearSession()
    router.replace('/nexus/login')
  }

  async function loadDevRequests() {
    if (!session?.token) {
      setDevRequestsError('Sesión inválida: token no disponible')
      return
    }

    setDevRequestsLoading(true)
    setDevRequestsError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/dev-mode/requests?status=pending&page=1&limit=20', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`)
      }

      const payload = (await response.json()) as DevModeResponse
      const rows = Array.isArray(payload?.data?.rows) ? payload.data.rows : []

      setDevRequests(rows)
      setDevRequestsMeta({
        total: Number(payload?.data?.total ?? rows.length),
        page: Number(payload?.data?.page ?? 1),
        limit: Number(payload?.data?.limit ?? 20),
      })
      console.log('Devs Request API:', payload)
    } catch (error) {
      setDevRequestsError(error instanceof Error ? error.message : 'No se pudieron cargar los requests')
    } finally {
      setDevRequestsLoading(false)
    }
  }

  function handleSelectView(view: DashboardView) {
    setActiveView(view)
    if (view === 'devs-request') {
      void loadDevRequests()
    }
    if (view === 'anuncios') {
      void loadAnuncios()
    }
    if (view === 'empresas') {
      void loadEmpresas()
    }
    if (view === 'licenses') {
      void loadLicenses()
    }
    if (view === 'dev-mode') {
      void loadDevModeEmpresas()
    }
  }

  async function loadAnuncios() {
    if (!session?.token) {
      setAnunciosError('Sesión inválida: token no disponible')
      return
    }

    setAnunciosLoading(true)
    setAnunciosError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/anuncios', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`)
      }

      const payload = await response.json()
      const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setAnuncios(data.filter((item): item is Anuncio => typeof item === 'object' && item !== null))
    } catch (error) {
      setAnunciosError(error instanceof Error ? error.message : 'No se pudieron cargar los anuncios')
    } finally {
      setAnunciosLoading(false)
    }
  }

  async function handleCreateAnuncio() {
    if (!session?.token) {
      setAnunciosError('Sesión inválida: token no disponible')
      return
    }

    if (!anuncioForm.titulo || !anuncioForm.descripcion) {
      setAnunciosError('Completa título y descripción')
      return
    }

    setAnuncioFormLoading(true)
    setAnuncioFormMessage(null)
    setAnunciosError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/anuncios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          titulo: anuncioForm.titulo,
          descripcion: anuncioForm.descripcion,
          activo: anuncioForm.activo,
        }),
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      setAnuncioFormMessage('Anuncio creado correctamente.')
      setAnuncioForm({ titulo: '', descripcion: '', activo: true })
      await loadAnuncios()
    } catch (error) {
      setAnunciosError(error instanceof Error ? error.message : 'No se pudo crear el anuncio')
    } finally {
      setAnuncioFormLoading(false)
    }
  }

  async function handleDeleteAnuncio(id: number) {
    if (!session?.token) {
      setAnunciosError('Sesión inválida: token no disponible')
      return
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
      return
    }

    setAnuncioDeleteLoading(id)
    setAnunciosError(null)

    try {
      const response = await fetch(`https://montekvps.cloud/api/anuncios/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      await loadAnuncios()
    } catch (error) {
      setAnunciosError(error instanceof Error ? error.message : 'No se pudo eliminar el anuncio')
    } finally {
      setAnuncioDeleteLoading(null)
    }
  }

  async function handleUpdateAnuncio(id: number) {
    if (!session?.token) {
      setAnunciosError('Sesión inválida: token no disponible')
      return
    }

    setEditingAnuncioLoading(true)
    setAnunciosError(null)

    try {
      const response = await fetch(`https://montekvps.cloud/api/anuncios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          titulo: editingAnuncioForm.titulo,
          activo: editingAnuncioForm.activo,
        }),
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      setAnunciosError(null)
      setEditingAnuncioId(null)
      await loadAnuncios()
    } catch (error) {
      setAnunciosError(error instanceof Error ? error.message : 'No se pudo actualizar el anuncio')
    } finally {
      setEditingAnuncioLoading(false)
    }
  }

  async function handleUploadAnuncioImage(id: number, file: File) {
    if (!session?.token) {
      setAnunciosError('Sesión inválida: token no disponible')
      return
    }

    if (!file) {
      setAnunciosError('Por favor selecciona una imagen')
      return
    }

    setUploadingImageId(id)
    setAnunciosError(null)

    try {
      const formData = new FormData()
      formData.append('imagen', file)

      const response = await fetch(`https://montekvps.cloud/api/anuncios/${id}/imagen`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      await loadAnuncios()
    } catch (error) {
      setAnunciosError(error instanceof Error ? error.message : 'No se pudo subir la imagen')
    } finally {
      setUploadingImageId(null)
    }
  }

  async function handleDeleteAnuncioImage(id: number) {
    if (!session?.token) {
      setAnunciosError('Sesión inválida: token no disponible')
      return
    }

    setDeletingImageId(id)
    setAnunciosError(null)

    try {
      const response = await fetch(`https://montekvps.cloud/api/anuncios/${id}/imagen`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      await loadAnuncios()
    } catch (error) {
      setAnunciosError(error instanceof Error ? error.message : 'No se pudo eliminar la imagen')
    } finally {
      setDeletingImageId(null)
    }
  }

  async function loadEmpresas() {
    if (!session?.token) {
      setEmpresasError('Sesión inválida: token no disponible')
      return
    }

    setEmpresasLoading(true)
    setEmpresasError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/companies', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`)
      }

      const payload = await response.json()
      const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      setEmpresas(data.filter((item): item is Empresa => typeof item === 'object' && item !== null))
    } catch (error) {
      setEmpresasError(error instanceof Error ? error.message : 'No se pudieron cargar las empresas')
    } finally {
      setEmpresasLoading(false)
    }
  }

  async function loadLicenses() {
    if (!session?.token) {
      setLicensesError('Sesión inválida: token no disponible')
      return
    }

    setLicensesLoading(true)
    setLicensesError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/companies', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`)
      }

      const payload = await response.json()
      const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []
      
      // Obtener capacidad de licencias para cada empresa
      const licensesData = await Promise.all(
        data
          .filter((item): item is Empresa => typeof item === 'object' && item !== null)
          .map(async (empresa) => {
            const license: License = {
              id: empresa.id,
              empresa_id: empresa.id,
              empresa_nombre: empresa.nombre,
              max_usuarios: 0,
              max_usuarios_conectados: 0,
            }
            
            // Obtener capacidad de la empresa
            try {
              const capacityResponse = await fetch(
                `https://montekvps.cloud/api/licenses/empresa/${empresa.id}/capacity`,
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${session.token}`,
                  },
                }
              )
              
              if (capacityResponse.ok) {
                const capacityData = await capacityResponse.json()
                license.license_id = capacityData?.license_id
                license.max_usuarios = capacityData?.max_usuarios ?? 0
                license.max_usuarios_conectados = capacityData?.max_usuarios_conectados ?? 0
                license.usuarios_activos = capacityData?.usuarios_activos ?? 0
                license.usuarios_disponibles = capacityData?.usuarios_disponibles ?? 0
                license.sesiones_activas = capacityData?.sesiones_activas ?? 0
                license.sesiones_disponibles = capacityData?.sesiones_disponibles ?? 0
                license.session_idle_seconds = capacityData?.session_idle_seconds
              }
            } catch {}
            
            return license
          })
      )
      setLicenses(licensesData)
    } catch (error) {
      setLicensesError(error instanceof Error ? error.message : 'No se pudieron cargar las licencias')
    } finally {
      setLicensesLoading(false)
    }
  }

  async function handleCreateLicense() {
    if (!session?.token) {
      setLicenseError('Sesión inválida: token no disponible')
      return
    }

    if (!licenseForm.empresa_nombre || !licenseForm.empresa_rfc || !licenseForm.usuario_email) {
      setLicenseError('Completa empresa, RFC y correo del usuario')
      return
    }

    setLicenseLoading(true)
    setLicenseMessage(null)
    setLicenseError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/licenses/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          empresa_nombre: licenseForm.empresa_nombre,
          empresa_rfc: licenseForm.empresa_rfc,
          usuario_email: licenseForm.usuario_email,
          max_usuarios: Number(licenseForm.max_usuarios),
          max_usuarios_conectados: Number(licenseForm.max_usuarios_conectados),
        }),
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      setLicenseMessage('Licencia creada correctamente.')
      setLicenseForm({
        empresa_nombre: '',
        empresa_rfc: '',
        usuario_email: '',
        max_usuarios: 5,
        max_usuarios_conectados: 3,
      })
    } catch (error) {
      setLicenseError(error instanceof Error ? error.message : 'No se pudo crear la licencia')
    } finally {
      setLicenseLoading(false)
    }
  }

  async function handleAuthorizeRequest(request: DevModeRequest) {
    if (!session?.token) {
      setDevRequestsError('Sesión inválida: token no disponible')
      return
    }

    setActionLoadingId(request.id)
    setActionMessage(null)
    setDevRequestsError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/dev-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          empresaId: request.empresaId,
          enabled: true,
          requestId: String(request.id),
          note: 'Activación gestionada desde Nexus Admin',
        }),
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      setActionMessage('Request autorizada correctamente.')
      await loadDevRequests()
    } catch (error) {
      setDevRequestsError(error instanceof Error ? error.message : 'No se pudo autorizar la request')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleDeactivateRequest(request: DevModeRequest) {
    if (!session?.token) {
      setDevRequestsError('Sesión inválida: token no disponible')
      return
    }

    setActionLoadingId(request.id)
    setActionMessage(null)
    setDevRequestsError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/dev-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          empresaId: request.empresaId,
          enabled: false,
          requestId: String(request.id),
          note: 'Solicitud rechazada desde Nexus Admin',
        }),
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      setActionMessage('Request rechazada correctamente.')
      await loadDevRequests()
    } catch (error) {
      setDevRequestsError(error instanceof Error ? error.message : 'No se pudo rechazar la request')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function loadDevModeEmpresas() {
    if (!session?.token) {
      setDevModeError('Sesión inválida: token no disponible')
      return
    }

    setDevModeLoading(true)
    setDevModeError(null)

    try {
      // Primero obtenemos todas las empresas
      const companiesResponse = await fetch('https://montekvps.cloud/api/companies', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (companiesResponse.status === 401 || companiesResponse.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!companiesResponse.ok) {
        throw new Error(`Error HTTP ${companiesResponse.status}`)
      }

      const companiesPayload = await companiesResponse.json()
      const companies = Array.isArray(companiesPayload) 
        ? companiesPayload 
        : Array.isArray(companiesPayload?.data) 
          ? companiesPayload.data 
          : []
      
      // Filtrar solo empresas padre (sin parent_id)
      const parentCompanies = companies.filter(
        (item): item is Empresa => 
          typeof item === 'object' && item !== null && !item.parent_id
      )

      // Para cada empresa, obtener su estado dev-mode
      const empresasWithDevMode: EmpresaDevMode[] = await Promise.all(
        parentCompanies.map(async (empresa) => {
          try {
            const statusResponse = await fetch(
              `https://montekvps.cloud/api/dev-mode/status?empresaId=${empresa.id}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${session.token}`,
                },
              }
            )

            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              // Usar has_permission si está disponible, sino usar enabled
              const isEnabled = statusData?.has_permission ?? statusData?.enabled ?? false
              return {
                id: empresa.id,
                nombre: empresa.nombre,
                rfc: empresa.rfc,
                dev_mode_enabled: isEnabled,
                children: empresa.children || [],
              }
            } else {
              // Si falla el status, asumir que está deshabilitado
              return {
                id: empresa.id,
                nombre: empresa.nombre,
                rfc: empresa.rfc,
                dev_mode_enabled: false,
                children: empresa.children || [],
              }
            }
          } catch {
            // En caso de error, asumir deshabilitado
            return {
              id: empresa.id,
              nombre: empresa.nombre,
              rfc: empresa.rfc,
              dev_mode_enabled: false,
              children: empresa.children || [],
            }
          }
        })
      )

      setEmpresasDevMode(empresasWithDevMode)
    } catch (error) {
      setDevModeError(error instanceof Error ? error.message : 'No se pudieron cargar las empresas')
    } finally {
      setDevModeLoading(false)
    }
  }

  async function handleToggleDevMode(empresaId: string, currentStatus: boolean) {
    if (!session?.token) {
      setDevModeError('Sesión inválida: token no disponible')
      return
    }

    setTogglingDevModeId(empresaId)
    setDevModeError(null)

    try {
      const response = await fetch('https://montekvps.cloud/api/dev-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          empresaId: empresaId,
          enabled: !currentStatus,
          note: 'Toggle gestionado desde Nexus Admin - Dev Mode',
        }),
      })

      if (response.status === 401 || response.status === 403) {
        clearSession()
        router.replace('/nexus/login')
        return
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({} as { message?: string }))
        throw new Error(errorPayload?.message || `Error HTTP ${response.status}`)
      }

      // Recargar la lista después del toggle
      await loadDevModeEmpresas()
    } catch (error) {
      setDevModeError(error instanceof Error ? error.message : 'No se pudo cambiar el estado de dev-mode')
    } finally {
      setTogglingDevModeId(null)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const pageTitle =
    activeView === 'devs-request'
      ? 'Devs Request'
      : activeView === 'license-setup'
        ? 'Alta de Licencias'
        : activeView === 'anuncios'
          ? 'Anuncios'
          : 'Dashboard'

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        session={session}
        onLogout={handleLogout}
        activeView={activeView}
        onSelectView={handleSelectView}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border">
          <div>
            <h1
              className="text-xl font-bold text-foreground"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              {pageTitle}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
            </button>
            {/* Avatar */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-secondary border border-border hover:border-accent/30 transition-all cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold">
                {session.usuario.nombre?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-foreground leading-tight">{session.usuario.empresa_nombre}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{session.usuario.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {activeView === 'dashboard' ? (
            <>
              {/* Welcome banner */}
              <div className="relative rounded-2xl overflow-hidden border border-accent/20 bg-gradient-to-br from-accent/8 via-card to-primary/5 p-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-primary/10 pointer-events-none" />
                {/* Decorative dots */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-48 opacity-5"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #0DA2E7 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="relative z-10">
                  <p className="text-sm font-medium text-accent mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    {greeting},
                  </p>
                  <h2
                    className="text-3xl font-bold text-foreground leading-tight text-balance"
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  >
                    Bienvenido al panel
                    <span className="ml-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                      Nexus
                    </span>
                  </h2>
                  <p className="text-muted-foreground text-sm mt-2 max-w-lg leading-relaxed">
                    Tienes acceso como <strong className="text-foreground">{session.usuario.email}</strong> en{' '}
                    <strong className="text-foreground">{session.usuario.empresa_nombre}</strong>.
                    {' '}Tu sesión es válida por{' '}
                    <strong className="text-accent">{Math.round(session.expires_in / 60)} minutos</strong>.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent/12 text-accent border border-accent/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Sesión activa
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground">
                      ID: {session.session_id.slice(0, 8)}…
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </div>

              {/* Middle row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2">
                  <ActivityFeed />
                </div>
                <WeeklyChart />
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PermissionsWidget />
                <SystemStatus />
              </div>
            </>
          ) : activeView === 'devs-request' ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Requests pendientes
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Total: {devRequestsMeta.total} · Página: {devRequestsMeta.page}
                  </span>
                  <button
                    onClick={() => void loadDevRequests()}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent/30 transition-colors"
                  >
                    Recargar
                  </button>
                </div>
              </div>

              {actionMessage && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {actionMessage}
                </div>
              )}

              {devRequestsLoading ? (
                <p className="text-sm text-muted-foreground">Cargando requests...</p>
              ) : devRequestsError ? (
                <p className="text-sm text-red-600">{devRequestsError}</p>
              ) : devRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay requests pendientes.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="min-w-full text-sm">
                    <thead className="bg-secondary/70">
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Empresa</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Solicitante</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Estado</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Nota</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Fecha</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-4 py-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devRequests.map((request) => (
                        <tr key={request.id} className="border-b border-border/70 last:border-0 hover:bg-accent/5 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">{request.empresaNombre || `Request #${request.id}`}</p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{request.requestedByEmail}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              {request.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground max-w-[320px] truncate" title={request.requestNote || 'Sin nota'}>
                            {request.requestNote || 'Sin nota'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {new Date(request.requestedAt).toLocaleString('es-MX')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void handleAuthorizeRequest(request)}
                                disabled={actionLoadingId === request.id}
                                className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              >
                                {actionLoadingId === request.id ? 'Procesando...' : 'Autorizar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeactivateRequest(request)}
                                disabled={actionLoadingId === request.id}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                {actionLoadingId === request.id ? 'Procesando...' : 'Rechazar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeView === 'license-setup' ? (
            <div className="rounded-2xl border border-border bg-card p-5 max-w-3xl">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Crear nueva licencia
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Completa los datos para dar de alta una licencia.
                </p>
              </div>

              {licenseMessage && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {licenseMessage}
                </div>
              )}

              {licenseError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {licenseError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                  <input
                    type="text"
                    value={licenseForm.empresa_nombre}
                    onChange={(event) => setLicenseForm((prev) => ({ ...prev, empresa_nombre: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Mi Empresa SA de CV"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">RFC</label>
                  <input
                    type="text"
                    value={licenseForm.empresa_rfc}
                    onChange={(event) => setLicenseForm((prev) => ({ ...prev, empresa_rfc: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="ABC123456789"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Correo usuario</label>
                  <input
                    type="email"
                    value={licenseForm.usuario_email}
                    onChange={(event) => setLicenseForm((prev) => ({ ...prev, usuario_email: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="admin@miempresa.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Máx. usuarios</label>
                  <input
                    type="number"
                    min={1}
                    value={licenseForm.max_usuarios}
                    onChange={(event) =>
                      setLicenseForm((prev) => ({ ...prev, max_usuarios: Number(event.target.value) || 0 }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Máx. usuarios conectados</label>
                  <input
                    type="number"
                    min={1}
                    value={licenseForm.max_usuarios_conectados}
                    onChange={(event) =>
                      setLicenseForm((prev) => ({ ...prev, max_usuarios_conectados: Number(event.target.value) || 0 }))
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleCreateLicense()}
                  disabled={licenseLoading}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {licenseLoading ? 'Creando...' : 'Dar de alta licencia'}
                </button>
              </div>
            </div>
          ) : activeView === 'anuncios' ? (
            <div className="space-y-5">
              {/* Form para crear anuncio */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-lg font-semibold text-foreground mb-3" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Crear nuevo anuncio
                </h3>

                {anuncioFormMessage && (
                  <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {anuncioFormMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Título</label>
                    <input
                      type="text"
                      value={anuncioForm.titulo}
                      onChange={(event) => setAnuncioForm((prev) => ({ ...prev, titulo: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Ej: Aviso interno"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                    <textarea
                      value={anuncioForm.descripcion}
                      onChange={(event) => setAnuncioForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      placeholder="Ej: Mensaje operativo"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anuncio-activo"
                      checked={anuncioForm.activo}
                      onChange={(event) => setAnuncioForm((prev) => ({ ...prev, activo: event.target.checked }))}
                      className="rounded border-border"
                    />
                    <label htmlFor="anuncio-activo" className="text-sm text-foreground">
                      Activo
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleCreateAnuncio()}
                    disabled={anuncioFormLoading}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {anuncioFormLoading ? 'Creando...' : 'Crear anuncio'}
                  </button>
                </div>
              </div>

              {/* Lista de anuncios */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Anuncios
                  </h2>
                  <button
                    onClick={() => void loadAnuncios()}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent/30 transition-colors"
                  >
                    Recargar
                  </button>
                </div>

                {anunciosLoading ? (
                  <p className="text-sm text-muted-foreground">Cargando anuncios...</p>
                ) : anunciosError && !anuncioFormMessage ? (
                  <p className="text-sm text-red-600">{anunciosError}</p>
                ) : anuncios.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay anuncios.</p>
                ) : (
                  <div className="space-y-3">
                    {anuncios.map((anuncio) => (
                      <div
                        key={anuncio.id}
                        className="rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-accent/5 p-4"
                      >
                        {editingAnuncioId === anuncio.id ? (
                          // Edit form
                          <div className="space-y-3 mb-4">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Título</label>
                              <input
                                type="text"
                                value={editingAnuncioForm.titulo}
                                onChange={(e) => setEditingAnuncioForm((prev) => ({ ...prev, titulo: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`anuncio-activo-${anuncio.id}`}
                                checked={editingAnuncioForm.activo}
                                onChange={(e) => setEditingAnuncioForm((prev) => ({ ...prev, activo: e.target.checked }))}
                                className="rounded border-border"
                              />
                              <label htmlFor={`anuncio-activo-${anuncio.id}`} className="text-sm text-foreground">
                                Activo
                              </label>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setEditingAnuncioId(null)}
                                disabled={editingAnuncioLoading}
                                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleUpdateAnuncio(anuncio.id)}
                                disabled={editingAnuncioLoading}
                                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
                              >
                                {editingAnuncioLoading ? 'Guardando...' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {anuncio.imagen_url && (
                              <div className="relative mb-3">
                                <img
                                  src={`https://montekvps.cloud${anuncio.imagen_url}`}
                                  alt={anuncio.titulo}
                                  className="w-full h-40 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteAnuncioImage(anuncio.id)}
                                  disabled={deletingImageId === anuncio.id}
                                  className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                                >
                                  {deletingImageId === anuncio.id ? '...' : '✕'}
                                </button>
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                  {anuncio.titulo}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Vigente: {new Date(anuncio.fecha_inicio).toLocaleDateString('es-MX')} a {new Date(anuncio.fecha_fin).toLocaleDateString('es-MX')}
                                </p>
                              </div>
                              <span
                                className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                                  anuncio.activo
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}
                              >
                                {anuncio.activo ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{anuncio.descripcion}</p>
                            {anuncio.enlace_url && (
                              <a
                                href={anuncio.enlace_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-xs text-accent hover:underline"
                              >
                                Ver más →
                              </a>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Publicado: {new Date(anuncio.created_at).toLocaleString('es-MX')}
                            </p>

                            {/* Image upload */}
                            <div className="mt-3 mb-3">
                              <label className="text-xs font-medium text-muted-foreground block mb-2">
                                {anuncio.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.currentTarget.files?.[0]
                                  if (file) {
                                    void handleUploadAnuncioImage(anuncio.id, file)
                                  }
                                }}
                                disabled={uploadingImageId === anuncio.id}
                                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground cursor-pointer hover:border-accent/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>

                            {/* Action buttons */}
                            <div className="mt-3 flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAnuncioId(anuncio.id)
                                  setEditingAnuncioForm({ titulo: anuncio.titulo, activo: Boolean(anuncio.activo) })
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteAnuncio(anuncio.id)}
                                disabled={anuncioDeleteLoading === anuncio.id}
                                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
                              >
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
          ) : activeView === 'empresas' ? (
            // Empresas view
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Empresas
                </h2>
                <button
                  onClick={() => void loadEmpresas()}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent/30 transition-colors"
                >
                  Recargar
                </button>
              </div>

              {empresasLoading ? (
                <p className="text-sm text-muted-foreground">Cargando empresas...</p>
              ) : empresasError ? (
                <p className="text-sm text-red-600">{empresasError}</p>
              ) : empresas.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay empresas disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {empresas.map((empresa) => (
                    <div
                      key={empresa.id}
                      className="rounded-lg border border-border/80 bg-gradient-to-br from-card via-card to-accent/5 p-4 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                            {empresa.nombre}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              RFC: <span className="text-foreground font-medium">{empresa.rfc}</span>
                            </p>
                            {empresa.db_nombre_contpaqi && (
                              <p className="text-xs text-muted-foreground">
                                DB: <span className="text-foreground font-medium">{empresa.db_nombre_contpaqi}</span>
                              </p>
                            )}
                          </div>
                          {empresa.children && empresa.children.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Sucursales: <span className="text-primary font-semibold">{empresa.children.length}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeView === 'dev-mode' ? (
            // Dev Mode view
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Dev Mode
                </h2>
                <button
                  onClick={() => void loadDevModeEmpresas()}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent/30 transition-colors"
                >
                  Recargar
                </button>
              </div>

              {devModeLoading ? (
                <p className="text-sm text-muted-foreground">Cargando empresas...</p>
              ) : devModeError ? (
                <p className="text-sm text-red-600">{devModeError}</p>
              ) : empresasDevMode.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay empresas disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {empresasDevMode.map((empresa) => (
                    <div
                      key={empresa.id}
                      className="rounded-lg border border-border/80 bg-gradient-to-br from-card via-card to-accent/5 p-4 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                            {empresa.nombre}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              ID: <span className="text-foreground font-medium">{empresa.id}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              RFC: <span className="text-foreground font-medium">{empresa.rfc}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Estado: 
                              <span className={`ml-1 font-semibold ${empresa.dev_mode_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {empresa.dev_mode_enabled ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => void handleToggleDevMode(empresa.id, empresa.dev_mode_enabled)}
                          disabled={togglingDevModeId === empresa.id}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            togglingDevModeId === empresa.id
                              ? 'opacity-50 cursor-not-allowed'
                              : empresa.dev_mode_enabled
                                ? 'border-red-500 bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                : 'border-green-500 bg-green-500/10 text-green-600 hover:bg-green-500/20'
                          }`}
                        >
                          {togglingDevModeId === empresa.id ? (
                            <span className="inline-block animate-spin">⟳</span>
                          ) : empresa.dev_mode_enabled ? (
                            'Desactivar'
                          ) : (
                            'Activar'
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Licenses view
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Licencias
                </h2>
                <button
                  onClick={() => void loadLicenses()}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground hover:border-accent/30 transition-colors"
                >
                  Recargar
                </button>
              </div>

              {licensesLoading ? (
                <p className="text-sm text-muted-foreground">Cargando licencias...</p>
              ) : licensesError ? (
                <p className="text-sm text-red-600">{licensesError}</p>
              ) : licenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay licencias disponibles.</p>
              ) : (
                <div className="space-y-2">
                  {licenses.map((license) => (
                    <div
                      key={license.id}
                      className="rounded-lg border border-border/80 bg-gradient-to-br from-card via-card to-accent/5 p-4 hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                            {license.empresa_nombre || `Empresa ${license.empresa_id}`}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              ID: <span className="text-foreground font-medium">{license.empresa_id}</span>
                            </p>
                            {license.max_usuarios !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Usuarios: <span className="text-foreground font-medium">{license.usuarios_activos ?? 0} / {license.max_usuarios}</span>
                              </p>
                            )}
                            {license.max_usuarios_conectados !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Conectados: <span className="text-foreground font-medium">{license.sesiones_activas ?? 0} / {license.max_usuarios_conectados}</span>
                              </p>
                            )}
                            {license.usuarios_disponibles !== undefined && (
                              <p className="text-xs text-muted-foreground">
                                Disponibles: <span className="text-foreground font-medium">{license.usuarios_disponibles} usuarios, {license.sesiones_disponibles} sesiones</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
