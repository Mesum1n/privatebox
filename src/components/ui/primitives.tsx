/**
 * PRIMITIVE UI COMPONENTS
 *
 * Small, composable, accessible. No external UI lib needed for these.
 * All components accept className for one-off overrides.
 */

import clsx from 'clsx'
import React from 'react'

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-tool transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 select-none'

  const variants = {
    primary:   'bg-accent text-surface-0 hover:bg-accent-hover active:scale-[0.98]',
    secondary: 'bg-surface-3 text-text-primary border border-border-default hover:bg-surface-4 active:scale-[0.98]',
    ghost:     'text-text-secondary hover:text-text-primary hover:bg-surface-2 active:scale-[0.98]',
    danger:    'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-sm px-5 py-2.5',
  }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50 cursor-not-allowed', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  )
}

// ─── Slider ───────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  format?: (v: number) => string
  onChange: (v: number) => void
  className?: string
}

export function Slider({ label, value, min, max, step = 1, format, onChange, className }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">{label}</label>
        <span className="text-xs font-mono text-accent">
          {format ? format(value) : value}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-3">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectOption { value: string; label: string }

interface SelectProps {
  label?: string
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
  className?: string
}

export function Select({ label, value, options, onChange, className }: SelectProps) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && <label className="text-xs font-medium text-text-secondary">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={clsx(
          'w-full rounded-tool bg-surface-2 border border-border-default',
          'text-sm text-text-primary px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-accent/50',
          'appearance-none cursor-pointer'
        )}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-text-secondary">{label}</label>}
      <input
        className={clsx(
          'w-full rounded-tool bg-surface-2 border px-3 py-2',
          'text-sm text-text-primary placeholder:text-text-muted',
          'focus:outline-none focus:ring-2 focus:ring-accent/50',
          error ? 'border-danger/60' : 'border-border-default focus:border-border-strong',
          className
        )}
        {...props}
      />
      {(hint || error) && (
        <p className={clsx('text-xs', error ? 'text-danger' : 'text-text-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-2xs font-semibold uppercase tracking-widest text-text-muted mb-3">
      {children}
    </p>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <div className={clsx('h-px bg-border-subtle', className)} />
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default' }: {
  children: React.ReactNode
  variant?: 'default' | 'new' | 'beta'
}) {
  const styles = {
    default: 'bg-surface-3 text-text-muted',
    new:     'bg-accent/20 text-accent',
    beta:    'bg-warn/15 text-warn',
  }

  return (
    <span className={clsx('text-2xs font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide', styles[variant])}>
      {children}
    </span>
  )
}
