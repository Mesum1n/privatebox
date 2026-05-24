/**
 * ToolPage
 *
 * Consistent wrapper for every tool. Provides:
 * - Title + description header
 * - Two-column layout: options panel (left) + work area (right)
 * - Consistent spacing and max-width
 *
 * Usage:
 *   <ToolPage title="Compress Image" description="..." icon={<Minimize2 />}>
 *     <ToolPage.Options>...</ToolPage.Options>
 *     <ToolPage.Workspace>...</ToolPage.Workspace>
 *   </ToolPage>
 */

import clsx from 'clsx'
import React from 'react'

interface ToolPageProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ToolPage({ title, description, icon, children, className }: ToolPageProps) {
  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-border-subtle bg-surface-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            {icon}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
            <p className="text-xs text-text-muted mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {children}
      </div>
    </div>
  )
}

// Options panel (left column)
ToolPage.Options = function Options({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <aside className={clsx(
      'w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border-subtle',
      'bg-surface-1 p-4 space-y-4 overflow-y-auto',
      className
    )}>
      {children}
    </aside>
  )
}

// Main workspace (right column / full width)
ToolPage.Workspace = function Workspace({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex-1 p-5 overflow-y-auto', className)}>
      {children}
    </div>
  )
}
