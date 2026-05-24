/**
 * FileCard
 *
 * Represents one file in the processing list.
 * Shows: thumbnail (images), name, size, status indicator, actions.
 *
 * Status states map to visual states:
 *   idle       → neutral
 *   queued     → slightly muted
 *   processing → animated progress bar
 *   done       → green accent, download button
 *   error      → red, error message
 */

import { X, Download, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react'
import clsx from 'clsx'
import type { ManagedFile } from '@/types'
import { formatBytes, compressionRatio, downloadBlob } from '@/lib/utils/file'

interface FileCardProps {
  file: ManagedFile
  onRemove?: () => void
  showPreview?: boolean
}

export function FileCard({ file, onRemove, showPreview = true }: FileCardProps) {
  const { status, result } = file

  const handleDownload = () => {
    if (!result) return
    downloadBlob(result.blob, result.filename)
  }

  return (
    <div className={clsx(
      'group relative flex items-center gap-3 rounded-tool p-3',
      'border transition-all duration-200',
      status === 'done'  && 'border-accent/30 bg-accent/5',
      status === 'error' && 'border-danger/30 bg-danger/5',
      (status === 'idle' || status === 'queued' || status === 'processing')
        && 'border-border-subtle bg-surface-1',
    )}>

      {/* Thumbnail / icon */}
      {showPreview && file.preview ? (
        <img
          src={file.preview}
          alt=""
          className="w-10 h-10 object-cover rounded-md shrink-0 bg-surface-3"
        />
      ) : (
        <div className="w-10 h-10 rounded-md bg-surface-3 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-text-muted" />
        </div>
      )}

      {/* Name + size */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate leading-tight">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-muted">{formatBytes(file.size)}</span>
          {status === 'done' && result && (
            <>
              <span className="text-text-muted">→</span>
              <span className="text-xs text-accent">{formatBytes(result.size)}</span>
              {result.originalSize && result.originalSize > result.size && (
                <span className="text-2xs text-text-muted">
                  ({compressionRatio(result.originalSize, result.size)})
                </span>
              )}
            </>
          )}
          {status === 'error' && file.error && (
            <span className="text-xs text-danger truncate">{file.error}</span>
          )}
        </div>
      </div>

      {/* Status / action */}
      <div className="flex items-center gap-1.5 shrink-0">
        {status === 'processing' && (
          <Loader2 size={16} className="text-accent animate-spin" />
        )}
        {status === 'done' && (
          <>
            <CheckCircle2 size={15} className="text-accent" />
            <button
              onClick={handleDownload}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
                'bg-accent text-surface-0 hover:bg-accent-hover transition-colors'
              )}
            >
              <Download size={11} />
              Save
            </button>
          </>
        )}
        {status === 'error' && (
          <AlertCircle size={15} className="text-danger shrink-0" />
        )}
      </div>

      {/* Remove button */}
      {onRemove && status !== 'processing' && (
        <button
          onClick={onRemove}
          className={clsx(
            'absolute -top-2 -right-2',
            'w-5 h-5 rounded-full flex items-center justify-center',
            'bg-surface-3 border border-border-default text-text-muted',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-surface-4 hover:text-text-primary'
          )}
          aria-label="Remove file"
        >
          <X size={10} />
        </button>
      )}

      {/* Processing overlay bar */}
      {status === 'processing' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-tool overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent/40 via-accent to-accent/40 bg-[length:200%_100%] animate-shimmer" />
        </div>
      )}
    </div>
  )
}
