'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { NexusSession } from '@/lib/auth'

interface SidebarItem {
  key: DashboardView
  icon: React.ReactNode
  label: string
  badge?: string
  active?: boolean
}

export type DashboardView = 'dashboard' | 'devs-request' | 'dev-mode' | 'license-setup' | 'anuncios' | 'empresas' | 'licenses'

interface DashboardSidebarProps {
  session: NexusSession
  onLogout: () => void
  activeView: DashboardView
  onSelectView: (view: DashboardView) => void
}

export function DashboardSidebar({ session, onLogout, activeView, onSelectView }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const navItems: SidebarItem[] = [
    {
      key: 'dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      label: 'Dashboard',
      active: activeView === 'dashboard',
    },
    {
      key: 'devs-request',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      label: 'Devs Request',
      active: activeView === 'devs-request',
    },
    {
      key: 'dev-mode',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      label: 'Dev Mode',
      active: activeView === 'dev-mode',
    },
    {
      key: 'license-setup',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ),
      label: 'Alta Licencia',
      active: activeView === 'license-setup',
    },
    {
      key: 'anuncios',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      label: 'Anuncios',
      active: activeView === 'anuncios',
    },
    {
      key: 'empresas',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
      ),
      label: 'Empresas',
      active: activeView === 'empresas',
    },
    {
      key: 'licenses',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5-9h10M12 7v10" />
        </svg>
      ),
      label: 'Licencias',
      active: activeView === 'licenses',
    },
  ]

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/6 via-transparent to-primary/6 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-border', collapsed && 'justify-center px-2')}>
          {!collapsed && (
            <span
              className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Nexus
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onSelectView(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed && 'justify-center px-0',
                item.active
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                        item.badge === 'NEW'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-primary/20 text-primary'
                      )}
                      style={{ color: item.badge === 'NEW' ? '#0DA2E7' : '#A78BFF' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className={cn('p-3 border-t border-border', collapsed && 'px-2')}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-secondary border border-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {session.usuario.nombre?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-xs font-medium truncate">{session.usuario.empresa_nombre}</p>
                <p className="text-muted-foreground text-xs truncate">{session.usuario.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-all duration-150',
              collapsed && 'justify-center'
            )}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-lg z-20"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={cn('transition-transform duration-300', collapsed ? 'rotate-0' : 'rotate-180')}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
