import type { ManagedFile } from '@/types'

/**
 * FILE UTILITIES
 *
 * Key design principles:
 * 1. Always revoke Object URLs when done to prevent memory leaks
 * 2. Use streaming/chunked reads for large files
 * 3. Validate before processing (type, size)
 * 4. Never touch network APIs
 */

// ─── Object URL lifecycle management ─────────────────────────────────────────

/**
 * Registry of active object URLs. We track these so we can bulk-revoke
 * on cleanup (e.g., when a tool component unmounts).
 */
const activeObjectURLs = new Set<string>()

export function createObjectURL(blob: Blob | File): string {
  const url = URL.createObjectURL(blob)
  activeObjectURLs.add(url)
  return url
}

export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url)
  activeObjectURLs.delete(url)
}

export function revokeAllObjectURLs(): void {
  for (const url of activeObjectURLs) {
    URL.revokeObjectURL(url)
  }
  activeObjectURLs.clear()
}

// ─── ManagedFile factory ──────────────────────────────────────────────────────

export function createManagedFile(file: File): ManagedFile {
  const isImage = file.type.startsWith('image/')

  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    // Only create previews for images – PDFs use canvas renders
    preview: isImage ? createObjectURL(file) : undefined,
    status: 'idle',
  }
}

export function createManagedFiles(files: File[]): ManagedFile[] {
  return files.map(createManagedFile)
}

// ─── Validation ───────────────────────────────────────────────────────────────

export const MAX_IMAGE_SIZE_MB = 50
export const MAX_PDF_SIZE_MB   = 200
export const MAX_PDF_PAGES     = 500 // safety cap for memory

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

export function validateImageFile(file: File): ValidationResult {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return { ok: false, reason: `Unsupported type: ${file.type}. Use JPEG, PNG, or WEBP.` }
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return { ok: false, reason: `File too large (max ${MAX_IMAGE_SIZE_MB} MB)` }
  }
  return { ok: true }
}

export function validatePdfFile(file: File): ValidationResult {
  if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
    return { ok: false, reason: 'File must be a PDF' }
  }
  if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
    return { ok: false, reason: `File too large (max ${MAX_PDF_SIZE_MB} MB)` }
  }
  return { ok: true }
}

// ─── Download helper ──────────────────────────────────────────────────────────

/**
 * Triggers a browser download from a Blob.
 * Uses a temporary anchor element – no server involved.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()

  // Clean up after a short delay (allows download to start)
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 150)
}

// ─── Size formatting ──────────────────────────────────────────────────────────

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k     = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i     = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function compressionRatio(original: number, output: number): string {
  const saved = ((original - output) / original) * 100
  return `${saved.toFixed(1)}% smaller`
}

// ─── File reading ─────────────────────────────────────────────────────────────

/**
 * Read a File as an ArrayBuffer.
 * Promise-based wrapper around FileReader.
 *
 * For very large files (>50MB), consider using file.stream() + TransformStream
 * for memory-efficient streaming, but for MVP this is sufficient.
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsArrayBuffer(file)
  })
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsDataURL(file)
  })
}

// ─── Image utilities ──────────────────────────────────────────────────────────

/**
 * Load an Image element from a File.
 * Returns a cleanup function to revoke the object URL.
 */
export function loadImageElement(file: File): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload  = () => resolve({ img, cleanup: () => URL.revokeObjectURL(url) })
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

/**
 * Get image dimensions without fully loading it into a canvas.
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const { img, cleanup } = await loadImageElement(file)
  const dims = { width: img.naturalWidth, height: img.naturalHeight }
  cleanup()
  return dims
}

// ─── Filename utilities ───────────────────────────────────────────────────────

export function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '')
}

export function addSuffix(name: string, suffix: string): string {
  const base = stripExtension(name)
  const ext  = name.slice(base.length)
  return `${base}_${suffix}${ext}`
}

export function changeExtension(name: string, ext: string): string {
  return `${stripExtension(name)}.${ext}`
}
