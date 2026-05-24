/**
 * DropZone
 *
 * The core file-input primitive used by every tool.
 * Built on react-dropzone for drag-and-drop + file dialog support.
 *
 * Design decisions:
 * - Accepts multiple files by default (batch processing)
 * - Shows accepted MIME types in the UI
 * - Pulses border on drag-over for clear visual feedback
 * - Keyboard accessible (click to open file dialog)
 */

import { useCallback } from 'react'
import { useDropzone, type Accept } from 'react-dropzone'
import { Upload } from 'lucide-react'
import clsx from 'clsx'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: Accept                   // react-dropzone Accept type
  maxFiles?: number
  disabled?: boolean
  hint?: string                     // e.g. "PNG, JPG or WEBP – max 50 MB"
  className?: string
}

export function DropZone({
  onFiles,
  accept,
  maxFiles,
  disabled = false,
  hint,
  className,
}: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted.length > 0) onFiles(accepted) },
    [onFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    disabled,
    // Don't validate file size here – let the processor do it with user feedback
  })

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'relative flex flex-col items-center justify-center gap-3',
        'rounded-card border-2 border-dashed transition-all duration-200 cursor-pointer',
        'px-6 py-14 text-center',
        isDragActive
          ? 'border-accent bg-accent/5 animate-pulse-border'
          : 'border-border-default bg-surface-1 hover:border-border-strong hover:bg-surface-2',
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      <input {...getInputProps()} />

      {/* Icon */}
      <div className={clsx(
        'flex items-center justify-center w-12 h-12 rounded-full transition-colors',
        isDragActive ? 'bg-accent/15 text-accent' : 'bg-surface-3 text-text-secondary'
      )}>
        <Upload size={22} strokeWidth={1.5} />
      </div>

      {/* Copy */}
      <div>
        <p className="text-sm font-medium text-text-primary">
          {isDragActive
            ? 'Release to add files'
            : 'Drop files here or click to browse'
          }
        </p>
        {hint && (
          <p className="mt-1 text-xs text-text-muted">{hint}</p>
        )}
        {maxFiles && maxFiles > 1 && (
          <p className="mt-1 text-2xs text-text-muted">
            Up to {maxFiles} files at once
          </p>
        )}
      </div>
    </div>
  )
}
