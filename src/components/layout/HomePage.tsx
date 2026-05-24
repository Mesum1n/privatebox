import { Link } from 'react-router-dom'
import {
  Shield, Image, FileText,
  Minimize2, Scaling, RefreshCw, Crop,
  FilePlus2, Scissors, GripVertical, Archive,
  ArrowRight
} from 'lucide-react'
import clsx from 'clsx'
import { IMAGE_TOOLS, PDF_TOOLS } from '@/lib/tools-registry'
import type { Tool } from '@/types'
import { Badge } from '@/components/ui/primitives'

const ICON_MAP: Record<string, React.ReactNode> = {
  Minimize2:    <Minimize2    size={20} />,
  Scaling:      <Scaling      size={20} />,
  RefreshCw:    <RefreshCw    size={20} />,
  Crop:         <Crop         size={20} />,
  FilePlus2:    <FilePlus2    size={20} />,
  Scissors:     <Scissors     size={20} />,
  GripVertical: <GripVertical size={20} />,
  Archive:      <Archive      size={20} />,
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link
      to={tool.path}
      className={clsx(
        'group flex flex-col gap-3 p-4 rounded-card',
        'border border-border-subtle bg-surface-1',
        'hover:border-border-strong hover:bg-surface-2',
        'transition-all duration-150 animate-fade-up'
      )}
    >
      <div className="flex items-start justify-between">
        <div className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          tool.category === 'image' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
        )}>
          {ICON_MAP[tool.icon]}
        </div>
        {tool.badge && <Badge variant={tool.badge}>{tool.badge}</Badge>}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary group-hover:text-white transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          {tool.description}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs text-text-muted group-hover:text-accent transition-colors mt-auto pt-1">
        Open tool <ArrowRight size={11} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  )
}

export function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

      {/* Hero */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
            <Shield size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">PrivateBox</h1>
            <p className="text-xs text-text-muted">Local-first file toolkit</p>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed max-w-lg">
          Image and PDF tools that run entirely in your browser.
          No uploads, no accounts, no tracking. Your files stay on your device.
        </p>

        {/* Privacy callouts */}
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            '🔒 Zero uploads',
            '⚡ Browser-side WASM',
            '🚫 No analytics',
            '📦 Works offline (PWA)',
          ].map(item => (
            <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-surface-2 border border-border-subtle text-text-secondary">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Image tools */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Image size={14} className="text-blue-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Image Tools</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IMAGE_TOOLS.map(t => <ToolCard key={t.id} tool={t} />)}
        </div>
      </section>

      {/* PDF tools */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <FileText size={14} className="text-orange-400" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">PDF Tools</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PDF_TOOLS.map(t => <ToolCard key={t.id} tool={t} />)}
        </div>
      </section>

      {/* Footer note */}
      <p className="text-xs text-text-muted text-center pb-4">
  Open source · Built with React + Vite · Runs 100% in-browser
  <br />
  <span className="text-accent">Built with ❤️ by Suman Bera</span>
</p>
    </div>
  )
}
