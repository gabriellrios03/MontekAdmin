export const NEXUS_API = 'https://montekvps.cloud/api'
export const NEXUS_API_KEY = 'mtk_fb31f5f360eca1742acaca95c099de95375af5892f1d78ec'

export interface NexusUser {
  id: number
  usuario: string
  nombre: string
  email: string
  permissions: string[]
  empresa_id: string
  empresa_nombre: string
  db_nombre_contpaqi: string | null
  db_nombre_adminpaq: string | null
}

export interface NexusSession {
  token: string
  expires_in: number
  usuario: NexusUser
  permissions: string[]
  require_password_reset: boolean
  onboarding_completed: boolean
  session_id: string
  logged_at: number // timestamp ms
}

const SESSION_KEY = 'nexus_session'

export function saveSession(data: NexusSession) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  // also persist to localStorage for page reloads
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export function loadSession(): NexusSession | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const s: NexusSession = JSON.parse(raw)
    // check expiry (expires_in seconds from logged_at)
    const now = Date.now()
    if (now - s.logged_at > s.expires_in * 1000) {
      clearSession()
      return null
    }
    return s
  } catch {
    return null
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export async function loginApi(usuario: string, password: string): Promise<NexusSession> {
  const res = await fetch(`${NEXUS_API}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': NEXUS_API_KEY,
    },
    body: JSON.stringify({ usuario, password }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.message || `Error ${res.status}: Credenciales inválidas`)
  }

  const data = await res.json()
  const session: NexusSession = { ...data, logged_at: Date.now() }
  saveSession(session)
  return session
}
