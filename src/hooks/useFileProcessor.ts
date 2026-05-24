/**
 * useFileProcessor
 *
 * A reusable hook that manages the state machine for "drop files → process → download".
 * Every tool uses this hook; only the processor function differs.
 *
 * State machine:
 *   idle → files added → processing → done | error
 *
 * The hook handles:
 * - File list management (add, remove, clear)
 * - Per-file status tracking
 * - Error isolation (one file failing doesn't stop others)
 * - Memory cleanup (revokes object URLs on unmount)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ManagedFile, ProcessedResult } from '@/types'
import { createManagedFile, revokeObjectURL } from '@/lib/utils/file'
import { notifyError } from '@/store'

export type ProcessorFn = (file: File, index: number) => Promise<ProcessedResult>

interface UseFileProcessorOptions {
  accept?: string[]           // MIME types
  maxFiles?: number
  validate?: (file: File) => { ok: boolean; reason?: string }
  processor: ProcessorFn
}

interface UseFileProcessorReturn {
  files: ManagedFile[]
  isProcessing: boolean
  isDone: boolean
  addFiles: (rawFiles: File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  processFiles: () => Promise<void>
  updateFileStatus: (id: string, patch: Partial<ManagedFile>) => void
}

export function useFileProcessor({
  maxFiles = 50,
  validate,
  processor,
}: UseFileProcessorOptions): UseFileProcessorReturn {
  const [files, setFiles]           = useState<ManagedFile[]>([])
  const [isProcessing, setProcessing] = useState(false)

  // Track object URLs created so we can revoke on unmount
  const previewUrls = useRef<string[]>([])

  useEffect(() => {
    return () => {
      // Cleanup: revoke all preview object URLs
      previewUrls.current.forEach(url => revokeObjectURL(url))
    }
  }, [])

  const updateFileStatus = useCallback((id: string, patch: Partial<ManagedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }, [])

  const addFiles = useCallback((rawFiles: File[]) => {
    const toAdd: ManagedFile[] = []

    for (const raw of rawFiles) {
      if (validate) {
        const result = validate(raw)
        if (!result.ok) {
          notifyError(`Skipped: ${raw.name}`, result.reason)
          continue
        }
      }

      const managed = createManagedFile(raw)
      if (managed.preview) previewUrls.current.push(managed.preview)
      toAdd.push(managed)
    }

    setFiles(prev => {
      const combined = [...prev, ...toAdd]
      return combined.slice(0, maxFiles)
    })
  }, [validate, maxFiles])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file?.preview) revokeObjectURL(file.preview)
      return prev.filter(f => f.id !== id)
    })
  }, [])

  const clearFiles = useCallback(() => {
    setFiles(prev => {
      prev.forEach(f => { if (f.preview) revokeObjectURL(f.preview) })
      return []
    })
  }, [])

  const processFiles = useCallback(async () => {
    if (isProcessing) return

    const idle = files.filter(f => f.status === 'idle' || f.status === 'error')
    if (idle.length === 0) return

    setProcessing(true)

    // Mark all as queued
    setFiles(prev => prev.map(f =>
      idle.some(i => i.id === f.id) ? { ...f, status: 'queued' } : f
    ))

    // Process sequentially to avoid OOM on large files
    // For small files, parallel processing would be faster, but memory safety wins
    for (let i = 0; i < idle.length; i++) {
      const managed = idle[i]

      updateFileStatus(managed.id, { status: 'processing' })

      try {
        const result = await processor(managed.file, i)
        updateFileStatus(managed.id, { status: 'done', result })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Processing failed'
        updateFileStatus(managed.id, { status: 'error', error: msg })
      }
    }

    setProcessing(false)
  }, [files, isProcessing, processor, updateFileStatus])

  const isDone = files.length > 0 && files.every(f => f.status === 'done' || f.status === 'error')

  return {
    files,
    isProcessing,
    isDone,
    addFiles,
    removeFile,
    clearFiles,
    processFiles,
    updateFileStatus,
  }
}
