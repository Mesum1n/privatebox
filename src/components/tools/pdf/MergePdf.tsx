/**
 * MERGE PDF TOOL
 *
 * Key difference from image tools: ordering matters.
 * Files are shown in a reorderable list; drag handles let users arrange
 * the final order before merging.
 *
 * Uses the HTML5 drag-and-drop API directly (no external lib needed for
 * simple list reordering). react-dnd would be overkill here.
 */

import { useState, useRef, useCallback } from 'react'
import { FilePlus2, GripVertical, X, Download, Loader2 } from 'lucide-react'
import { ToolPage } from '@/components/layout/ToolPage'
import { DropZone } from '@/components/ui/DropZone'
import { Button, SectionLabel } from '@/components/ui/primitives'
import { mergePdfs } from '@/lib/utils/pdf-processing'
import { validatePdfFile, formatBytes, downloadBlob } from '@/lib/utils/file'
import { notifySuccess, notifyError } from '@/store'
import clsx from 'clsx'

interface PdfEntry {
  id: string
  file: File
  pageCount?: number
}

export function MergePdfTool() {
  const [entries, setEntries]     = useState<PdfEntry[]>([])
  const [merging, setMerging]     = useState(false)
  const [result, setResult]       = useState<Blob | null>(null)
  const dragIndex                 = useRef<number | null>(null)

  const addFiles = useCallback((files: File[]) => {
    const valid: PdfEntry[] = []
    for (const file of files) {
      const r = validatePdfFile(file)
      if (!r.ok) { notifyError(`Skipped: ${file.name}`, r.reason); continue }
      valid.push({ id: crypto.randomUUID(), file })
    }
    setEntries(prev => [...prev, ...valid].slice(0, 30))
    setResult(null) // reset previous result
  }, [])

  const removeEntry = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
    setResult(null)
  }

  // Simple drag-to-reorder
  const onDragStart = (i: number) => { dragIndex.current = i }
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === i) return
    setEntries(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex.current!, 1)
      next.splice(i, 0, moved)
      dragIndex.current = i
      return next
    })
  }
  const onDragEnd = () => { dragIndex.current = null }

  const handleMerge = async () => {
    if (entries.length < 2) {
      notifyError('Need at least 2 PDFs', 'Add more files to merge.')
      return
    }

    setMerging(true)
    try {
      const blob = await mergePdfs({ files: entries.map(e => e.file) })
      setResult(blob)
      notifySuccess('PDFs merged successfully')
    } catch (err) {
      notifyError('Merge failed', err instanceof Error ? err.message : undefined)
    } finally {
      setMerging(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    downloadBlob(result, 'merged.pdf')
  }

  const totalSize = entries.reduce((s, e) => s + e.file.size, 0)

  return (
    <ToolPage
      title="Merge PDFs"
      description="Combine multiple PDFs into one. Drag to reorder."
      icon={<FilePlus2 size={16} />}
    >
      <ToolPage.Options>
        <SectionLabel>File Order</SectionLabel>
        <p className="text-xs text-text-muted">
          Drag rows to set the page order. The first file's pages come first.
        </p>

        {entries.length >= 2 && (
          <div className="space-y-2 pt-2">
            {result ? (
              <Button
                variant="primary"
                className="w-full"
                onClick={handleDownload}
                icon={<Download size={14} />}
              >
                Download merged PDF
              </Button>
            ) : (
              <Button
                variant="primary"
                className="w-full"
                loading={merging}
                onClick={handleMerge}
                disabled={entries.length < 2}
              >
                {merging ? 'Merging…' : `Merge ${entries.length} PDFs`}
              </Button>
            )}

            {result && (
              <p className="text-xs text-accent text-center">
                {formatBytes(result.size)} output
              </p>
            )}

            <Button
              variant="ghost"
              className="w-full text-xs"
              onClick={() => { setEntries([]); setResult(null) }}
              disabled={merging}
            >
              Clear all
            </Button>
          </div>
        )}

        {entries.length > 0 && (
          <div className="pt-1">
            <p className="text-2xs text-text-muted">{entries.length} files · {formatBytes(totalSize)} total</p>
          </div>
        )}
      </ToolPage.Options>

      <ToolPage.Workspace>
        {entries.length === 0 ? (
          <DropZone
            onFiles={addFiles}
            accept={{ 'application/pdf': ['.pdf'] }}
            maxFiles={30}
            hint="PDF files only — max 200 MB each"
            className="h-64"
          />
        ) : (
          <div className="space-y-3">
            {/* Reorderable list */}
            <div className="space-y-1.5">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-tool',
                    'border border-border-subtle bg-surface-1',
                    'cursor-grab active:cursor-grabbing transition-colors',
                    'hover:border-border-default hover:bg-surface-2 group'
                  )}
                >
                  <GripVertical size={14} className="text-text-muted shrink-0 group-hover:text-text-secondary" />

                  {/* Order badge */}
                  <span className="text-xs font-mono text-text-muted w-5 text-right shrink-0">{i + 1}</span>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{entry.file.name}</p>
                    <p className="text-xs text-text-muted">{formatBytes(entry.file.size)}</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="text-text-muted hover:text-danger transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Status */}
            {merging && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 size={14} className="animate-spin text-accent" />
                Merging… this may take a moment for large files.
              </div>
            )}

            {/* Add more */}
            <DropZone
              onFiles={addFiles}
              accept={{ 'application/pdf': ['.pdf'] }}
              hint="Add more PDFs"
              className="h-20 py-5"
            />
          </div>
        )}
      </ToolPage.Workspace>
    </ToolPage>
  )
}
