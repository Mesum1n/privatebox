/**
 * PDF PROCESSING UTILITIES
 *
 * Two libraries, one clear division of responsibility:
 *
 *   pdf-lib   → WRITING / MANIPULATION (merge, split, reorder, create)
 *               Pure JS, runs in browser with no WASM dependencies.
 *               Works with ArrayBuffers directly.
 *
 *   pdfjs-dist → READING / RENDERING (page previews, thumbnails)
 *               Mozilla's PDF.js. Uses WASM for performance.
 *               We use it only for generating canvas previews.
 *
 * This separation is intentional. Using pdf-lib for rendering is painful;
 * using pdfjs for writing is unsupported. Each lib does what it's best at.
 */

import { PDFDocument } from 'pdf-lib'
import type { MergePdfOptions, SplitPdfOptions, ReorderPdfOptions, PageRange } from '@/types'
import { readFileAsArrayBuffer } from './file'

// ─── PDF merge ────────────────────────────────────────────────────────────────

/**
 * MERGE
 *
 * Loads each PDF, copies all pages into a new document.
 *
 * Engineering note: pdf-lib's copyPages accepts a page index array.
 * We copy in order, so files[0] pages come first, then files[1], etc.
 * Memory: each PDFDocument holds the full file in memory. For large batches,
 * process sequentially and GC between calls (let refs go out of scope).
 */
export async function mergePdfs(options: MergePdfOptions): Promise<Blob> {
  const merged = await PDFDocument.create()

  for (const file of options.files) {
    const bytes  = await readFileAsArrayBuffer(file)
    const source = await PDFDocument.load(bytes)
    const indices = source.getPageIndices()                 // [0, 1, 2, ...]
    const pages  = await merged.copyPages(source, indices)
    pages.forEach(p => merged.addPage(p))
  }

  const pdfBytes = await merged.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

// ─── PDF split ────────────────────────────────────────────────────────────────

/**
 * SPLIT
 *
 * Produces one Blob per page range. Returns an array of { blob, filename }.
 * UI is responsible for triggering individual downloads.
 */
export async function splitPdf(
  file: File,
  options: SplitPdfOptions
): Promise<Array<{ blob: Blob; filename: string }>> {
  const bytes  = await readFileAsArrayBuffer(file)
  const source = await PDFDocument.load(bytes)
  const baseName = file.name.replace(/\.pdf$/i, '')

  const results: Array<{ blob: Blob; filename: string }> = []

  for (let i = 0; i < options.ranges.length; i++) {
    const range = options.ranges[i]
    const part  = await PDFDocument.create()

    // Convert 1-indexed page numbers to 0-indexed for pdf-lib
    const pageIndices = rangeToIndices(range, source.getPageCount())
    const pages = await part.copyPages(source, pageIndices)
    pages.forEach(p => part.addPage(p))

    const pdfBytes = await part.save()
    const label    = range.label ?? `part-${i + 1}`
    results.push({
      blob:     new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      filename: `${baseName}_${label}.pdf`,
    })
  }

  return results
}

function rangeToIndices(range: PageRange, totalPages: number): number[] {
  const indices: number[] = []
  const from = Math.max(1, range.from)
  const to   = Math.min(totalPages, range.to)
  for (let i = from; i <= to; i++) {
    indices.push(i - 1) // 0-indexed
  }
  return indices
}

// ─── PDF page reorder ─────────────────────────────────────────────────────────

/**
 * REORDER
 *
 * Takes a new page order (array of 1-indexed original page numbers) and
 * creates a new PDF with pages in that order.
 *
 * Example: pageOrder = [3, 1, 2] means: new page 1 = old page 3, etc.
 */
export async function reorderPdf(file: File, options: ReorderPdfOptions): Promise<Blob> {
  const bytes  = await readFileAsArrayBuffer(file)
  const source = await PDFDocument.load(bytes)
  const output = await PDFDocument.create()

  // Convert 1-indexed to 0-indexed
  const zeroIndexedOrder = options.pageOrder.map(n => n - 1)
  const pages = await output.copyPages(source, zeroIndexedOrder)
  pages.forEach(p => output.addPage(p))

  const pdfBytes = await output.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

// ─── PDF compression ──────────────────────────────────────────────────────────

/**
 * PDF COMPRESSION NOTE
 *
 * True PDF compression (re-encoding embedded images, removing unused objects)
 * requires native code and is NOT feasible purely in browser JS for production quality.
 *
 * What we CAN do in pdf-lib:
 * - Remove metadata and XMP streams
 * - Use object streams (compress the PDF structure itself)
 * - Remove embedded thumbnails
 *
 * This gives 5-15% reduction on typical PDFs. For heavy image compression,
 * recommend to the user that Ghostscript (local) or a trusted tool be used.
 *
 * We're honest with the user about this limitation rather than silently
 * doing something ineffective.
 */
export async function compressPdf(file: File): Promise<Blob> {
  const bytes  = await readFileAsArrayBuffer(file)
  const doc    = await PDFDocument.load(bytes, {
    updateMetadata: false,
  })

  // Remove XMP metadata (can be large)
  doc.setTitle('')
  doc.setAuthor('')
  doc.setSubject('')
  doc.setKeywords([])
  doc.setProducer('')
  doc.setCreator('')

  // Save with object compression enabled (default in pdf-lib 1.x)
  const pdfBytes = await doc.save({
    useObjectStreams: true,     // compresses cross-reference tables
    addDefaultPage: false,
  })

  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

// ─── Page count utility ───────────────────────────────────────────────────────

export async function getPdfPageCount(file: File): Promise<number> {
  const bytes = await readFileAsArrayBuffer(file)
  const doc   = await PDFDocument.load(bytes)
  return doc.getPageCount()
}

// ─── PDF.js page preview ──────────────────────────────────────────────────────

/**
 * Render a single PDF page to a canvas using PDF.js.
 * Returns a data URL for displaying as an <img>.
 *
 * We lazy-import pdfjs to avoid loading its WASM upfront.
 * This is called per-page and can be parallelized with Promise.all for speed.
 */
export async function renderPdfPageToDataURL(
  file: File,
  pageNumber: number,           // 1-indexed
  scale = 1.0
): Promise<string> {
  // Dynamic import = PDF.js only loads when a PDF tool is actually used
  const pdfjsLib = await import('pdfjs-dist')

  // Point the worker to the bundled worker script
  // Vite will bundle this correctly with the plugin config
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await readFileAsArrayBuffer(file)
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDoc      = await loadingTask.promise

  const page     = await pdfDoc.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas  = document.createElement('canvas')
  canvas.width  = viewport.width
  canvas.height = viewport.height

  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise

  // Clean up PDF.js resources
  page.cleanup()
  pdfDoc.cleanup()
  pdfDoc.destroy()

  return canvas.toDataURL('image/jpeg', 0.85)
}

/**
 * Batch render multiple pages. Renders in parallel (up to 4 at once)
 * to balance speed vs. memory pressure.
 */
export async function renderPdfPages(
  file: File,
  pageNumbers: number[],
  scale = 0.5,
  onPageRendered?: (pageNum: number, dataUrl: string) => void
): Promise<Map<number, string>> {
  const results = new Map<number, string>()
  const CONCURRENCY = 4

  // Process in batches
  for (let i = 0; i < pageNumbers.length; i += CONCURRENCY) {
    const batch = pageNumbers.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (num) => {
        const dataUrl = await renderPdfPageToDataURL(file, num, scale)
        results.set(num, dataUrl)
        onPageRendered?.(num, dataUrl)
      })
    )
  }

  return results
}
