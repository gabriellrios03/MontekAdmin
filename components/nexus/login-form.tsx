'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  onLogin: (usuario: string, password: string) => Promise<void>
  loading: boolean
  error: string | null
}

export function LoginForm({ onLogin, loading, error }: LoginFormProps) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario || !password) return
    onLogin(usuario, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Usuario */}
      <div className="space-y-2">
        <label htmlFor="usuario" className="block text-sm font-medium text-foreground">
          Usuario
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            id="usuario"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="admin@empresa.local"
            required
            autoComplete="username"
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
              'transition-all duration-200',
              error && 'border-destructive/50 focus:ring-destructive/30'
            )}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Contraseña
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••••"
            required
            autoComplete="current-password"
            className={cn(
              'w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-card text-foreground text-sm',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
              'transition-all duration-200',
              error && 'border-destructive/50 focus:ring-destructive/30'
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20 text-destructive text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !usuario || !password}
        className={cn(
          'w-full py-3.5 rounded-xl font-semibold text-sm text-white relative overflow-hidden',
          'bg-gradient-to-r from-accent to-primary',
          'shadow-lg shadow-accent/20',
          'hover:shadow-accent/30 hover:shadow-xl hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-accent/15',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2'
        )}
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
            </svg>
            Verificando...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Ingresar al panel
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </button>

      {/* Divider hint */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">acceso seguro</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Conexión cifrada · Sesión de 60 minutos
      </div>
    </form>
  )
}
