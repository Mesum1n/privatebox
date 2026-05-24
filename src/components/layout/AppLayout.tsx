/**
 * App Shell
 *
 * Three-region layout:
 * ┌─────────────────────────────────────────────┐
 * │ Topbar (mobile) / Sidebar (desktop)         │
 * ├──────────┬──────────────────────────────────┤
 * │ Sidebar  │  Main content area               │
 * │ (desktop)│                                  │
 * └──────────┴──────────────────────────────────┘
 *
 * No fancy animations on layout – tools are the focus, not the chrome.
 */

import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import clsx from 'clsx'
import {
  Shield, Image, FileText, Menu, 
  Minimize2, Scaling, RefreshCw, Crop,
  FilePlus2, Scissors, GripVertical, Archive
} from 'lucide-react'
import { IMAGE_TOOLS, PDF_TOOLS } from '@/lib/tools-registry'
import type { Tool } from '@/types'
import { Badge } from '@/components/ui/primitives'

// Map icon string names to components
const ICON_MAP: Record<string, React.ReactNode> = {
  Minimize2:    <Minimize2   size={15} />,
  Scaling:      <Scaling     size={15} />,
  RefreshCw:    <RefreshCw   size={15} />,
  Crop:         <Crop        size={15} />,
  FilePlus2:    <FilePlus2   size={15} />,
  Scissors:     <Scissors    size={15} />,
  GripVertical: <GripVertical size={15} />,
  Archive:      <Archive     size={15} />,
}

interface NavItemProps {
  tool: Tool
  active: boolean
  onClick?: () => void
}

function NavItem({ tool, active, onClick }: NavItemProps) {
  return (
    <Link
      to={tool.path}
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2.5 px-3 py-2 rounded-tool text-sm transition-colors',
        active
          ? 'bg-surface-3 text-text-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
      )}
    >
      <span className={active ? 'text-accent' : 'text-text-muted'}>
        {ICON_MAP[tool.icon]}
      </span>
      <span className="flex-1 truncate">{tool.name}</span>
      {tool.badge && <Badge variant={tool.badge}>{tool.badge}</Badge>}
    </Link>
  )
}

interface SidebarProps {
  onNavClick?: () => void
}

function Sidebar({ onNavClick }: SidebarProps) {
  const { pathname } = useLocation()

  return (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/" onClick={onNavClick} className="flex items-center gap-2.5 px-4 py-5 border-b border-border-subtle">
        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
          <Shield size={14} className="text-accent" />
        </div>
        <span className="font-semibold text-text-primary tracking-tight">PrivateBox</span>
      </Link>

      {/* Tool groups */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        <div>
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <Image size={11} className="text-text-muted" />
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">Image</span>
          </div>
          {IMAGE_TOOLS.map(t => (
            <NavItem key={t.id} tool={t} active={pathname === t.path} onClick={onNavClick} />
          ))}
        </div>
        <div>
          <div className="flex items-center gap-2 px-3 mb-1.5">
            <FileText size={11} className="text-text-muted" />
            <span className="text-2xs font-semibold text-text-muted uppercase tracking-widest">PDF</span>
          </div>
          {PDF_TOOLS.map(t => (
            <NavItem key={t.id} tool={t} active={pathname === t.path} onClick={onNavClick} />
          ))}
        </div>
      </div>

      {/* Privacy badge */}
      <div className="p-3 border-t border-border-subtle">
        <div className="px-4 pb-3 text-center">
        <p className="text-2xs text-text-muted">
          Built with ❤️ by <span className="text-accent">Suman Bera</span>
        </p>
      </div>
        <div className="flex items-center gap-2 px-2 py-2 rounded-tool bg-accent/5 border border-accent/15">
          <Shield size={12} className="text-accent shrink-0" />
          <p className="text-2xs text-accent/80 leading-snug">
            All processing happens locally. Your files never leave this device.
          </p>
        </div>
      </div>
    </nav>
  )
}

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-surface-0 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border-subtle bg-surface-1">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-surface-1 border-r border-border-subtle">
            <Sidebar onNavClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border-subtle bg-surface-1 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <Menu size={20} />
          </button>
          <span className="font-semibold text-sm text-text-primary">PrivateBox</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
