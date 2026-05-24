/**
 * ALL TOOLS – FULLY IMPLEMENTED
 * Replaces the previous stub file.
 */

import { useState, useCallback, useRef } from 'react'
import { Scaling, RefreshCw, Crop, Scissors, GripVertical, Archive, Download, Plus, Loader2, X } from 'lucide-react'
import { ToolPage } from '@/components/layout/ToolPage'
import { DropZone } from '@/components/ui/DropZone'
import { FileCard } from '@/components/ui/FileCard'
import { Button, Slider, Select, Input, SectionLabel } from '@/components/ui/primitives'
import { useFileProcessor } from '@/hooks/useFileProcessor'
import { resizeImage, convertImageFormat, cropImage, mimeToExtension } from '@/lib/utils/image-processing'
import { splitPdf, reorderPdf, compressPdf, getPdfPageCount, renderPdfPages } from '@/lib/utils/pdf-processing'
import { validateImageFile, validatePdfFile, changeExtension, downloadBlob, formatBytes } from '@/lib/utils/file'
import { notifySuccess, notifyError } from '@/store'
import type { ImageOutputFormat, ProcessedResult, PageRange } from '@/types'


const FORMAT_OPTIONS = [
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/webp', label: 'WEBP' },
  { value: 'image/png',  label: 'PNG' },
]

// ─── RESIZE IMAGE ─────────────────────────────────────────────────────────────

export function ResizeImageTool() {
  const [width, setWidth]   = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [lock, setLock]     = useState(true)
  const [format, setFormat] = useState<ImageOutputFormat>('image/jpeg')
  const [quality, setQuality] = useState(85)
  const [origDims, setOrigDims] = useState<{w:number,h:number}|null>(null)

  const processor = useCallback(async (file: File): Promise<ProcessedResult> => {
    const img = await createImageBitmap(file)
    const ow = img.width; const oh = img.height
    img.close()
    setOrigDims({ w: ow, h: oh })

    const tw = width  ? parseInt(width)  : undefined
    const th = height ? parseInt(height) : undefined

    const blob = await resizeImage(file, {
      width: tw, height: th,
      maintainAspectRatio: lock,
      outputFormat: format,
      quality: quality / 100,
    })
    return { blob, filename: changeExtension(file.name, mimeToExtension(format)), size: blob.size, originalSize: file.size }
  }, [width, height, lock, format, quality])

  const { files, isProcessing, addFiles, removeFile, clearFiles, processFiles } =
    useFileProcessor({ validate: f => validateImageFile(f), processor })

  return (
    <ToolPage title="Resize Image" description="Change dimensions by pixels. Supports batch." icon={<Scaling size={16} />}>
      <ToolPage.Options>
        <SectionLabel>Dimensions</SectionLabel>
        {origDims && <p className="text-xs text-text-muted mb-2">Original: {origDims.w} × {origDims.h} px</p>}
        <div className="flex gap-2">
          <Input label="Width (px)" type="number" placeholder="e.g. 1920" value={width} onChange={e => setWidth(e.target.value)} />
          <Input label="Height (px)" type="number" placeholder="e.g. 1080" value={height} onChange={e => setHeight(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={lock} onChange={e => setLock(e.target.checked)} className="accent-accent" />
          <span className="text-xs text-text-secondary">Lock aspect ratio</span>
        </label>

        <SectionLabel>Output</SectionLabel>
        <Select value={format} options={FORMAT_OPTIONS} onChange={v => setFormat(v as ImageOutputFormat)} label="Format" />
        <Slider label="Quality" value={quality} min={10} max={100} step={5} format={v=>`${v}%`} onChange={setQuality} />

        {files.length > 0 && (
          <div className="space-y-2 pt-2">
            <Button variant="primary" className="w-full" loading={isProcessing} onClick={processFiles} disabled={(!width && !height)}>
              {isProcessing ? 'Resizing…' : `Resize ${files.length} image${files.length>1?'s':''}`}
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={clearFiles} disabled={isProcessing}>Clear all</Button>
          </div>
        )}
        {!width && !height && <p className="text-xs text-warn">Enter at least width or height</p>}
      </ToolPage.Options>
      <ToolPage.Workspace>
        {files.length === 0
          ? <DropZone onFiles={addFiles} accept={{'image/jpeg':[],'image/png':[],'image/webp':[]}} maxFiles={20} hint="PNG, JPG, or WEBP — max 50 MB each" className="h-64" />
          : <div className="space-y-2">
              {files.map(f => <FileCard key={f.id} file={f} onRemove={() => removeFile(f.id)} />)}
              <DropZone onFiles={addFiles} accept={{'image/jpeg':[],'image/png':[],'image/webp':[]}} hint="Add more" className="h-20 py-5" />
            </div>
        }
      </ToolPage.Workspace>
    </ToolPage>
  )
}

// ─── CONVERT IMAGE ────────────────────────────────────────────────────────────

export function ConvertImageTool() {
  const [format, setFormat] = useState<ImageOutputFormat>('image/webp')
  const [quality, setQuality] = useState(85)

  const processor = useCallback(async (file: File): Promise<ProcessedResult> => {
    const blob = await convertImageFormat(file, { targetFormat: format, quality: quality / 100 })
    return { blob, filename: changeExtension(file.name, mimeToExtension(format)), size: blob.size, originalSize: file.size }
  }, [format, quality])

  const { files, isProcessing, addFiles, removeFile, clearFiles, processFiles } =
    useFileProcessor({ validate: f => validateImageFile(f), processor })

  return (
    <ToolPage title="Convert Format" description="Convert between PNG, JPEG, and WEBP in bulk." icon={<RefreshCw size={16} />}>
      <ToolPage.Options>
        <SectionLabel>Convert To</SectionLabel>
        <Select value={format} options={FORMAT_OPTIONS} onChange={v => setFormat(v as ImageOutputFormat)} label="Target format" />
        {format !== 'image/png' && (
          <Slider label="Quality" value={quality} min={10} max={100} step={5} format={v=>`${v}%`} onChange={setQuality} />
        )}
        <p className="text-xs text-text-muted">PNG → JPEG: transparent areas become white.</p>
        {files.length > 0 && (
          <div className="space-y-2 pt-2">
            <Button variant="primary" className="w-full" loading={isProcessing} onClick={processFiles}>
              {isProcessing ? 'Converting…' : `Convert ${files.length} image${files.length>1?'s':''}`}
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={clearFiles} disabled={isProcessing}>Clear all</Button>
          </div>
        )}
      </ToolPage.Options>
      <ToolPage.Workspace>
        {files.length === 0
          ? <DropZone onFiles={addFiles} accept={{'image/jpeg':[],'image/png':[],'image/webp':[]}} maxFiles={30} hint="PNG, JPG, or WEBP" className="h-64" />
          : <div className="space-y-2">
              {files.map(f => <FileCard key={f.id} file={f} onRemove={() => removeFile(f.id)} />)}
              <DropZone onFiles={addFiles} accept={{'image/jpeg':[],'image/png':[],'image/webp':[]}} hint="Add more" className="h-20 py-5" />
            </div>
        }
      </ToolPage.Workspace>
    </ToolPage>
  )
}

// ─── CROP IMAGE ───────────────────────────────────────────────────────────────

export function CropImageTool() {
  const [file, setFile]       = useState<File|null>(null)
  const [preview, setPreview] = useState<string|null>(null)
  const [format, setFormat]   = useState<ImageOutputFormat>('image/jpeg')
  const [quality, setQuality] = useState(90)
  const [cropping, setCropping] = useState(false)
  const [result, setResult]   = useState<{blob:Blob,filename:string}|null>(null)
  // Crop coords as percentage of image display size
  const [crop, setCrop] = useState({ x: 10, y: 10, w: 80, h: 80 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const isDragging   = useRef(false)
  const isResizing   = useRef<string|null>(null) // 'se' | 'sw' | 'ne' | 'nw'
  const dragStart    = useRef({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 })

  const handleFiles = (files: File[]) => {
    const f = files[0]; if (!f) return
    const r = validateImageFile(f); if (!r.ok) { notifyError('Invalid file', r.reason); return }
    setFile(f); setResult(null)
    setPreview(URL.createObjectURL(f))
    setCrop({ x: 10, y: 10, w: 80, h: 80 })
  }

  const handleCrop = async () => {
    if (!file || !imgRef.current) return
    setCropping(true)
    try {
      const img    = imgRef.current
      const scaleX = img.naturalWidth  / img.clientWidth
      const scaleY = img.naturalHeight / img.clientHeight
      const px = Math.round((crop.x / 100) * img.clientWidth  * scaleX)
      const py = Math.round((crop.y / 100) * img.clientHeight * scaleY)
      const pw = Math.round((crop.w / 100) * img.clientWidth  * scaleX)
      const ph = Math.round((crop.h / 100) * img.clientHeight * scaleY)
      const blob     = await cropImage(file, { x: px, y: py, width: Math.max(1,pw), height: Math.max(1,ph), outputFormat: format, quality: quality/100 })
      const filename = changeExtension(file.name, mimeToExtension(format))
      setResult({ blob, filename })
      notifySuccess('Cropped successfully')
    } catch(e) { notifyError('Crop failed', e instanceof Error ? e.message : undefined) }
    setCropping(false)
  }

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return { rx: ((e.clientX - rect.left) / rect.width) * 100, ry: ((e.clientY - rect.top) / rect.height) * 100 }
  }

  const onMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault(); e.stopPropagation()
    const { rx, ry } = getRelativePos(e)
    dragStart.current = { mx: rx, my: ry, cx: crop.x, cy: crop.y, cw: crop.w, ch: crop.h }
    if (handle) isResizing.current = handle
    else isDragging.current = true
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current && !isResizing.current) return
    const { rx, ry } = getRelativePos(e)
    const dx = rx - dragStart.current.mx
    const dy = ry - dragStart.current.my
    if (isDragging.current) {
      setCrop(c => ({
        ...c,
        x: Math.max(0, Math.min(100 - c.w, dragStart.current.cx + dx)),
        y: Math.max(0, Math.min(100 - c.h, dragStart.current.cy + dy)),
      }))
    } else if (isResizing.current === 'se') {
      setCrop(c => ({
        ...c,
        w: Math.max(5, Math.min(100 - c.x, dragStart.current.cw + dx)),
        h: Math.max(5, Math.min(100 - c.y, dragStart.current.ch + dy)),
      }))
    }
  }

  const onMouseUp = () => { isDragging.current = false; isResizing.current = null }

  return (
    <ToolPage title="Crop Image" description="Drag the selection box. Use the corner handle to resize." icon={<Crop size={16} />}>
      <ToolPage.Options>
        <SectionLabel>Crop Area (%)</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <Input label="X %" type="number" value={Math.round(crop.x)} onChange={e=>setCrop(c=>({...c,x:Math.max(0,Math.min(100-c.w,+e.target.value))}))} />
          <Input label="Y %" type="number" value={Math.round(crop.y)} onChange={e=>setCrop(c=>({...c,y:Math.max(0,Math.min(100-c.h,+e.target.value))}))} />
          <Input label="W %" type="number" value={Math.round(crop.w)} onChange={e=>setCrop(c=>({...c,w:Math.max(5,Math.min(100-c.x,+e.target.value))}))} />
          <Input label="H %" type="number" value={Math.round(crop.h)} onChange={e=>setCrop(c=>({...c,h:Math.max(5,Math.min(100-c.y,+e.target.value))}))} />
        </div>
        <p className="text-2xs text-text-muted">Drag box to move · drag ↘ corner to resize</p>
        <SectionLabel>Output</SectionLabel>
        <Select value={format} options={FORMAT_OPTIONS} onChange={v=>setFormat(v as ImageOutputFormat)} label="Format" />
        <Slider label="Quality" value={quality} min={10} max={100} step={5} format={v=>`${v}%`} onChange={setQuality} />
        {file && (
          <div className="space-y-2 pt-2">
            {result
              ? <Button variant="primary" className="w-full" icon={<Download size={14}/>} onClick={()=>downloadBlob(result.blob, result.filename)}>Download cropped</Button>
              : <Button variant="primary" className="w-full" loading={cropping} onClick={handleCrop}>Crop & Save</Button>
            }
            <Button variant="ghost" className="w-full text-xs" onClick={()=>{setFile(null);setPreview(null);setResult(null);setCrop({x:10,y:10,w:80,h:80})}}>Clear</Button>
          </div>
        )}
      </ToolPage.Options>
      <ToolPage.Workspace>
        {!preview
          ? <DropZone onFiles={handleFiles} accept={{'image/jpeg':[],'image/png':[],'image/webp':[]}} maxFiles={1} hint="Select one image to crop" className="h-64" />
          : <div
              ref={containerRef}
              className="relative inline-block select-none max-w-full"
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img ref={imgRef} src={preview} alt="crop" className="max-w-full max-h-[60vh] block rounded-tool" draggable={false} />
              {/* Dark overlay: 4 rectangles around the crop box (no clipping tricks needed) */}
              {/* Top */}
              <div className="absolute pointer-events-none bg-black/50" style={{top:0,left:0,right:0,height:`${crop.y}%`}} />
              {/* Bottom */}
              <div className="absolute pointer-events-none bg-black/50" style={{top:`${crop.y+crop.h}%`,left:0,right:0,bottom:0}} />
              {/* Left */}
              <div className="absolute pointer-events-none bg-black/50" style={{top:`${crop.y}%`,left:0,width:`${crop.x}%`,height:`${crop.h}%`}} />
              {/* Right */}
              <div className="absolute pointer-events-none bg-black/50" style={{top:`${crop.y}%`,left:`${crop.x+crop.w}%`,right:0,height:`${crop.h}%`}} />
              {/* Crop box border + drag handle */}
              <div
                className="absolute border-2 border-accent cursor-move"
                style={{left:`${crop.x}%`,top:`${crop.y}%`,width:`${crop.w}%`,height:`${crop.h}%`}}
                onMouseDown={e=>onMouseDown(e)}
              >
                {/* Rule-of-thirds */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/25" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/25" />
                  <div className="absolute top-1/3 left-0 right-0 border-t border-white/25" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-white/25" />
                </div>
                {/* SE resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-accent cursor-se-resize"
                  onMouseDown={e=>onMouseDown(e,'se')}
                />
              </div>
            </div>
        }
        {result && <p className="mt-3 text-xs text-accent">✓ Cropped — {formatBytes(result.blob.size)}</p>}
      </ToolPage.Workspace>
    </ToolPage>
  )
}

// ─── SPLIT PDF ────────────────────────────────────────────────────────────────

export function SplitPdfTool() {
  const [file, setFile]       = useState<File|null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [ranges, setRanges]   = useState<PageRange[]>([{ from: 1, to: 1 }])
  const [splitting, setSplitting] = useState(false)
  const [results, setResults] = useState<Array<{blob:Blob,filename:string}>>([])
  const [loading, setLoading] = useState(false)

  const handleFile = async (files: File[]) => {
    const f = files[0]; if (!f) return
    const r = validatePdfFile(f); if (!r.ok) { notifyError('Invalid file', r.reason); return }
    setLoading(true); setResults([])
    setFile(f)
    const count = await getPdfPageCount(f)
    setPageCount(count)
    setRanges([{ from: 1, to: count }])
    setLoading(false)
  }

  const addRange = () => setRanges(r => [...r, { from: 1, to: pageCount, label: `part-${r.length+1}` }])
  const removeRange = (i: number) => setRanges(r => r.filter((_, idx) => idx !== i))
  const updateRange = (i: number, patch: Partial<PageRange>) =>
    setRanges(r => r.map((rng, idx) => idx === i ? { ...rng, ...patch } : rng))

  const handleSplit = async () => {
    if (!file) return
    setSplitting(true)
    try {
      const out = await splitPdf(file, { ranges })
      setResults(out)
      notifySuccess(`Split into ${out.length} file${out.length>1?'s':''}`)
    } catch(e) {
      notifyError('Split failed', e instanceof Error ? e.message : undefined)
    }
    setSplitting(false)
  }

  return (
    <ToolPage title="Split PDF" description="Extract page ranges into separate files." icon={<Scissors size={16} />}>
      <ToolPage.Options>
        {file && !loading && (
          <>
            <SectionLabel>Page Ranges</SectionLabel>
            <p className="text-xs text-text-muted mb-3">Total pages: <span className="text-accent font-mono">{pageCount}</span></p>
            <div className="space-y-2">
              {ranges.map((rng, i) => (
                <div key={i} className="flex items-end gap-1.5 bg-surface-2 rounded-tool p-2">
                  <Input label="From" type="number" value={rng.from} min={1} max={pageCount}
                    onChange={e=>updateRange(i,{from:Math.max(1,Math.min(pageCount,+e.target.value))})} />
                  <Input label="To" type="number" value={rng.to} min={1} max={pageCount}
                    onChange={e=>updateRange(i,{to:Math.max(1,Math.min(pageCount,+e.target.value))})} />
                  {ranges.length > 1 && (
                    <button onClick={()=>removeRange(i)} className="text-text-muted hover:text-danger mb-2"><X size={14}/></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addRange} className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover mt-2">
              <Plus size={12}/> Add range
            </button>
            <div className="space-y-2 pt-3">
              <Button variant="primary" className="w-full" loading={splitting} onClick={handleSplit}>
                {splitting ? 'Splitting…' : `Split into ${ranges.length} file${ranges.length>1?'s':''}`}
              </Button>
              <Button variant="ghost" className="w-full text-xs" onClick={()=>{setFile(null);setResults([]);setPageCount(0)}}>Clear</Button>
            </div>
          </>
        )}
        {loading && <div className="flex items-center gap-2 text-sm text-text-secondary"><Loader2 size={14} className="animate-spin text-accent"/>Reading PDF…</div>}
      </ToolPage.Options>
      <ToolPage.Workspace>
        {!file
          ? <DropZone onFiles={handleFile} accept={{'application/pdf':['.pdf']}} maxFiles={1} hint="One PDF file — max 200 MB" className="h-64" />
          : results.length > 0
            ? <div className="space-y-2">
                <p className="text-xs text-text-muted mb-3">Click to download each part:</p>
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-tool border border-accent/20 bg-accent/5">
                    <div>
                      <p className="text-sm text-text-primary">{r.filename}</p>
                      <p className="text-xs text-text-muted">{formatBytes(r.blob.size)}</p>
                    </div>
                    <Button variant="primary" size="sm" icon={<Download size={12}/>} onClick={()=>downloadBlob(r.blob, r.filename)}>Save</Button>
                  </div>
                ))}
              </div>
            : <div className="flex flex-col items-center justify-center h-48 gap-2">
                <p className="text-sm text-text-secondary">{file.name}</p>
                <p className="text-xs text-text-muted">{pageCount} pages · {formatBytes(file.size)}</p>
                <p className="text-xs text-text-muted mt-2">Set ranges in the left panel, then click Split.</p>
              </div>
        }
      </ToolPage.Workspace>
    </ToolPage>
  )
}

// ─── REORDER PDF ──────────────────────────────────────────────────────────────

export function ReorderPdfTool() {
  const [file, setFile]   = useState<File|null>(null)
  const [pages, setPages] = useState<Array<{num:number, thumb:string|null}>>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const dragIdx = useRef<number|null>(null)

  const handleFile = async (files: File[]) => {
    const f = files[0]; if (!f) return
    const r = validatePdfFile(f); if (!r.ok) { notifyError('Invalid file', r.reason); return }
    setFile(f); setLoading(true)
    const count  = await getPdfPageCount(f)
    const nums   = Array.from({ length: count }, (_, i) => i + 1)
    setPages(nums.map(n => ({ num: n, thumb: null })))
    // Render thumbnails progressively
    await renderPdfPages(f, nums, 0.3, (pageNum, dataUrl) => {
      setPages(prev => prev.map(p => p.num === pageNum ? { ...p, thumb: dataUrl } : p))
    })
    setLoading(false)
  }

  const onDragStart = (i: number) => { dragIdx.current = i }
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === i) return
    setPages(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIdx.current!, 1)
      next.splice(i, 0, moved)
      dragIdx.current = i
      return next
    })
  }

  const handleSave = async () => {
    if (!file) return
    setSaving(true)
    try {
      const blob = await reorderPdf(file, { pageOrder: pages.map(p => p.num) })
      downloadBlob(blob, file.name.replace('.pdf', '_reordered.pdf'))
      notifySuccess('Reordered PDF downloaded')
    } catch(e) {
      notifyError('Save failed', e instanceof Error ? e.message : undefined)
    }
    setSaving(false)
  }

  return (
    <ToolPage title="Reorder Pages" description="Drag page thumbnails to rearrange, then download." icon={<GripVertical size={16} />}>
      <ToolPage.Options>
        {file && (
          <>
            <p className="text-xs text-text-muted">{pages.length} pages · drag to reorder</p>
            <div className="space-y-2 pt-3">
              <Button variant="primary" className="w-full" loading={saving} onClick={handleSave} disabled={loading}>
                {saving ? 'Saving…' : 'Download Reordered PDF'}
              </Button>
              <Button variant="ghost" className="w-full text-xs" onClick={()=>{setFile(null);setPages([])}}>Clear</Button>
            </div>
          </>
        )}
        {loading && <div className="flex items-center gap-2 text-xs text-text-secondary"><Loader2 size={12} className="animate-spin text-accent"/>Rendering pages…</div>}
      </ToolPage.Options>
      <ToolPage.Workspace>
        {!file
          ? <DropZone onFiles={handleFile} accept={{'application/pdf':['.pdf']}} maxFiles={1} hint="One PDF — max 200 MB" className="h-64" />
          : <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {pages.map((p, i) => (
                <div
                  key={`${p.num}-${i}`}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={e => onDragOver(e, i)}
                  onDragEnd={() => { dragIdx.current = null }}
                  className="flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing group"
                >
                  <div className="w-full aspect-[3/4] rounded-tool border border-border-default bg-surface-2 overflow-hidden group-hover:border-accent/50 transition-colors">
                    {p.thumb
                      ? <img src={p.thumb} alt={`Page ${p.num}`} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Loader2 size={14} className="animate-spin text-text-muted"/></div>
                    }
                  </div>
                  <span className="text-2xs text-text-muted font-mono">{i + 1}</span>
                </div>
              ))}
            </div>
        }
      </ToolPage.Workspace>
    </ToolPage>
  )
}

// ─── COMPRESS PDF ─────────────────────────────────────────────────────────────

export function CompressPdfTool() {
  const [file, setFile]   = useState<File|null>(null)
  const [compressing, setCompressing] = useState(false)
  const [result, setResult] = useState<{blob:Blob,filename:string}|null>(null)

  const handleFile = (files: File[]) => {
    const f = files[0]; if (!f) return
    const r = validatePdfFile(f); if (!r.ok) { notifyError('Invalid file', r.reason); return }
    setFile(f); setResult(null)
  }

  const handleCompress = async () => {
    if (!file) return
    setCompressing(true)
    try {
      const blob = await compressPdf(file)
      const filename = file.name.replace('.pdf', '_compressed.pdf')
      setResult({ blob, filename })
      const saved = file.size - blob.size
      if (saved > 0) notifySuccess(`Reduced by ${formatBytes(saved)}`)
      else notifySuccess('PDF cleaned — size similar (no embedded images to compress)')
    } catch(e) {
      notifyError('Compression failed', e instanceof Error ? e.message : undefined)
    }
    setCompressing(false)
  }

  return (
    <ToolPage title="Compress PDF" description="Remove metadata and compress PDF structure." icon={<Archive size={16} />}>
      <ToolPage.Options>
        <SectionLabel>About PDF Compression</SectionLabel>
        <p className="text-xs text-text-muted leading-relaxed">
          This tool removes metadata, XMP streams, and compresses the PDF structure.
          Best for text-heavy PDFs. For PDFs with large embedded images, results will be modest
          — image recompression requires native tools like Ghostscript.
        </p>
        {file && !result && (
          <div className="space-y-2 pt-3">
            <Button variant="primary" className="w-full" loading={compressing} onClick={handleCompress}>
              {compressing ? 'Compressing…' : 'Compress PDF'}
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={()=>{setFile(null);setResult(null)}}>Clear</Button>
          </div>
        )}
        {result && (
          <div className="space-y-2 pt-3">
            <Button variant="primary" className="w-full" icon={<Download size={14}/>} onClick={()=>downloadBlob(result.blob, result.filename)}>
              Download compressed PDF
            </Button>
            <Button variant="ghost" className="w-full text-xs" onClick={()=>{setFile(null);setResult(null)}}>Start over</Button>
          </div>
        )}
      </ToolPage.Options>
      <ToolPage.Workspace>
        {!file
          ? <DropZone onFiles={handleFile} accept={{'application/pdf':['.pdf']}} maxFiles={1} hint="PDF file — max 200 MB" className="h-64" />
          : <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center">
                <Archive size={20} className="text-text-secondary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">{file.name}</p>
                <p className="text-xs text-text-muted mt-1">{formatBytes(file.size)}</p>
              </div>
              {result && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-text-muted">{formatBytes(file.size)}</span>
                  <span className="text-text-muted">→</span>
                  <span className={result.blob.size < file.size ? 'text-accent' : 'text-text-secondary'}>
                    {formatBytes(result.blob.size)}
                  </span>
                  {result.blob.size < file.size && (
                    <span className="text-xs text-accent">
                      ({(((file.size - result.blob.size) / file.size) * 100).toFixed(1)}% smaller)
                    </span>
                  )}
                </div>
              )}
            </div>
        }
      </ToolPage.Workspace>
    </ToolPage>
  )
}
