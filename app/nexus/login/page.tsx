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
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 relative">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5 pointer-events-none" />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3 relative z-10">
          <NexusLogo size={36} />
          <span
            className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Nexus
          </span>
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-accent mb-1 tracking-wide uppercase"
               style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Panel de Administración
            </p>
            <h1
              className="text-3xl font-bold text-foreground leading-tight"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Bienvenido de vuelta
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Ingresa tus credenciales para acceder al panel Nexus.
            </p>
          </div>

          <LoginForm onLogin={handleLogin} loading={loading} error={error} />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2025 Montek · montek.com.mx/nexus
          </p>
        </div>
      </div>
    </div>
  )
}
