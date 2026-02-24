'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginApi } from '@/lib/auth'
import { NexusLogo } from '@/components/nexus/nexus-logo'
import { LoginForm } from '@/components/nexus/login-form'
import { LoginBrand } from '@/components/nexus/login-brand'

export default function NexusLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(usuario: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      await loginApi(usuario, password)
      router.push('/nexus/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left brand panel */}
      <LoginBrand />

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <NexusLogo size={32} />
          <span
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Nexus
          </span>
        </div>

        <div className="w-full max-w-[380px]">
          {/* Header */}
          <div className="mb-7">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Panel de Administración
            </span>
            <h1
              className="text-2xl font-bold text-foreground leading-tight text-balance"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Bienvenido de vuelta
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Ingresa tus credenciales para acceder al panel Nexus.
            </p>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <LoginForm onLogin={handleLogin} loading={loading} error={error} />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Montek · montek.com.mx/nexus
          </p>
        </div>
      </div>
    </div>
  )
}
