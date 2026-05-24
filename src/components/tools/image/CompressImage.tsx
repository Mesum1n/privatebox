/**
 * COMPRESS IMAGE TOOL
 *
 * Full implementation example showing the complete tool pattern:
 * 1. ToolPage shell
 * 2. Options panel with sliders
 * 3. DropZone + FileCard list
 * 4. useFileProcessor hook wiring
 * 5. Batch download
 *
 * This is the reference implementation. Other tools follow the same pattern.
 */

import { useState, useCallback } from 'react'
import { Minimize2, Download } from 'lucide-react'
import { ToolPage } from '@/components/layout/ToolPage'
import { DropZone } from '@/components/ui/DropZone'
import { FileCard } from '@/components/ui/FileCard'
import { Button, Slider, Select, SectionLabel } from '@/components/ui/primitives'
import { useFileProcessor } from '@/hooks/useFileProcessor'
import { compressImage, mimeToExtension } from '@/lib/utils/image-processing'
import { validateImageFile, changeExtension, formatBytes, downloadBlob } from '@/lib/utils/file'
import { notifySuccess, notifyError } from '@/store'
import type { ImageOutputFormat, ProcessedResult } from '@/types'

const FORMAT_OPTIONS = [
  { value: 'image/jpeg', label: 'JPEG (smallest)' },
  { value: 'image/webp', label: 'WEBP (modern)' },
  { value: 'image/png',  label: 'PNG (lossless)' },
]

export function CompressImageTool() {
  const [maxSizeMB, setMaxSizeMB]   = useState(1)
  const [quality, setQuality]       = useState(80)
  const [format, setFormat]         = useState<ImageOutputFormat>('image/jpeg')

  // Build the processor function – recreated when options change
  const processor = useCallback(async (file: File): Promise<ProcessedResult> => {
    const blob = await compressImage(file, {
      maxSizeMB,
      quality: quality / 100,
      outputFormat: format,
    })

    const ext      = mimeToExtension(format)
    const filename = changeExtension(file.name, ext)

    return { blob, filename, size: blob.size, originalSize: file.size }
  }, [maxSizeMB, quality, format])

  const { files, isProcessing, isDone, addFiles, removeFile, clearFiles, processFiles } =
    useFileProcessor({
      accept:  ['image/jpeg', 'image/png', 'image/webp'],
      validate: (f) => {
        const r = validateImageFile(f)
        return r.ok ? { ok: true } : { ok: false, reason: r.reason }
      },
      processor,
    })

  const handleDownloadAll = () => {
    const done = files.filter(f => f.status === 'done' && f.result)
    if (done.length === 0) return
    done.forEach(f => downloadBlob(f.result!.blob, f.result!.filename))
    notifySuccess(`Downloading ${done.length} file${done.length > 1 ? 's' : ''}`)
  }

  const idleCount = files.filter(f => f.status === 'idle').length
  const doneCount = files.filter(f => f.status === 'done').length

  return (
    <ToolPage
      title="Compress Image"
      description="Reduce file size while preserving quality. Runs entirely in your browser."
      icon={<Minimize2 size={16} />}
    >
      {/* Options */}
      <ToolPage.Options>
        <SectionLabel>Output Format</SectionLabel>
        <Select
          value={format}
          options={FORMAT_OPTIONS}
          onChange={v => setFormat(v as ImageOutputFormat)}
        />

        <SectionLabel>Quality Settings</SectionLabel>
        <Slider
          label="Quality"
          value={quality}
          min={10}
          max={100}
          step={5}
          format={v => `${v}%`}
          onChange={setQuality}
        />
        <Slider
          label="Max file size"
          value={maxSizeMB}
          min={0.1}
          max={10}
          step={0.1}
          format={v => `${v} MB`}
          onChange={setMaxSizeMB}
        />

        <p className="text-xs text-text-muted">
          The compressor will try to stay under <span className="font-mono text-accent">{maxSizeMB} MB</span> while keeping quality as high as possible.
        </p>

        {/* Actions */}
        {files.length > 0 && (
          <div className="space-y-2 pt-2">
            <Button
              variant="primary"
              className="w-full"
              loading={isProcessing}
              disabled={idleCount === 0 && !isDone}
              onClick={isDone ? handleDownloadAll : processFiles}
              icon={isDone ? <Download size={14} /> : undefined}
            >
              {isDone ? `Download All (${doneCount})` : isProcessing ? 'Compressing…' : `Compress ${files.length} file${files.length > 1 ? 's' : ''}`}
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={clearFiles} disabled={isProcessing}>
              Clear all
            </Button>
          </div>
        )}
      </ToolPage.Options>

      {/* Workspace */}
      <ToolPage.Workspace>
        {files.length === 0 ? (
          <DropZone
            onFiles={addFiles}
            accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [] }}
            maxFiles={20}
            hint="PNG, JPG, or WEBP — max 50 MB each"
            className="h-64"
          />
        ) : (
          <div className="space-y-3">
            {/* Stats bar */}
            {isDone && (
              <div className="flex items-center gap-4 px-4 py-2.5 rounded-tool bg-accent/8 border border-accent/20 text-sm">
                <span className="text-text-secondary">
                  {doneCount} compressed —
                </span>
                <span className="text-accent font-medium">
                  {formatBytes(files.filter(f=>f.result).reduce((s,f)=>s+f.result!.originalSize!,0))}
                  {' → '}
                  {formatBytes(files.filter(f=>f.result).reduce((s,f)=>s+f.result!.size,0))}
                </span>
              </div>
            )}

            {/* File list */}
            <div className="space-y-2">
              {files.map(f => (
                <FileCard
                  key={f.id}
                  file={f}
                  onRemove={f.status !== 'processing' ? () => removeFile(f.id) : undefined}
                />
              ))}
            </div>

            {/* Add more */}
            <DropZone
              onFiles={addFiles}
              accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [] }}
              hint="Add more files"
              className="h-24 py-6"
            />
          </div>
        )}
      </ToolPage.Workspace>
    </ToolPage>
  )
}
