'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NexusLogo } from '@/components/nexus/nexus-logo'
import type { NexusSession } from '@/lib/auth'

interface SidebarItem {
  key: DashboardView
  icon: React.ReactNode
  label: string
  badge?: string
  group?: string
}

export type DashboardView =
  | 'dashboard'
  | 'devs-request'
  | 'dev-mode'
  | 'license-setup'
  | 'anuncios'
  | 'empresas'
  | 'licenses'

interface DashboardSidebarProps {
  session: NexusSession
  onLogout: () => void
  activeView: DashboardView
  onSelectView: (view: DashboardView) => void
}

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)
const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
  </svg>
)
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </svg>
)
const MegaphoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>
)
const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
)
const KeyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
)
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const navGroups = [
  {
    label: null,
    items: [
      { key: 'dashboard' as DashboardView, icon: <HomeIcon />, label: 'Dashboard' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { key: 'devs-request' as DashboardView, icon: <MessageIcon />, label: 'Devs Request' },
      { key: 'dev-mode' as DashboardView, icon: <CodeIcon />, label: 'Dev Mode' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { key: 'empresas' as DashboardView, icon: <BuildingIcon />, label: 'Empresas' },
      { key: 'licenses' as DashboardView, icon: <KeyIcon />, label: 'Licencias' },
      { key: 'license-setup' as DashboardView, icon: <StarIcon />, label: 'Alta Licencia' },
      { key: 'anuncios' as DashboardView, icon: <MegaphoneIcon />, label: 'Anuncios' },
    ],
  },
]

export function DashboardSidebar({ session, onLogout, activeView, onSelectView }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const initials = (session.usuario.nombre || session.usuario.email || 'A').charAt(0).toUpperCase()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 transition-all duration-300 ease-in-out',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-[64px]' : 'w-[232px]'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border flex-shrink-0',
          collapsed && 'justify-center px-2'
        )}>
          <NexusLogo size={30} />
          {!collapsed && (
            <div>
              <span
                className="text-lg font-bold text-white leading-none"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Nexus
              </span>
              <p className="text-[10px] text-sidebar-muted tracking-widest uppercase leading-none mt-0.5">by Montek</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && !collapsed && (
                <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted/60 select-none">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeView === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelectView(item.key)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group',
                        collapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-sidebar-accent/15 text-sidebar-accent border border-sidebar-accent/25'
                          : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/5'
                      )}
                    >
                      <span className={cn(
                        'flex-shrink-0 transition-colors',
                        isActive ? 'text-sidebar-accent' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
                      )}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sidebar-accent/20 text-sidebar-accent">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className="flex-shrink-0 p-2 border-t border-sidebar-border space-y-1">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-sidebar-accent/30 border border-sidebar-accent/40 flex items-center justify-center text-sidebar-accent text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">
                  {session.usuario.empresa_nombre || 'Montek'}
                </p>
                <p className="text-[11px] text-sidebar-muted truncate leading-tight mt-0.5">
                  {session.usuario.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={onLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sidebar-muted hover:text-red-400 hover:bg-red-500/8 text-xs font-medium transition-all duration-150',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogoutIcon />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[3.75rem] w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground transition-colors shadow-lg z-20"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <ChevronLeftIcon className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  )
}
