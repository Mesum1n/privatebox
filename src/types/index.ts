// ─── File abstractions ────────────────────────────────────────────────────────

/**
 * A wrapper around File that adds metadata we track during processing.
 * We NEVER serialize this to a server – it lives only in browser memory.
 */
export interface ManagedFile {
  id: string                  // crypto.randomUUID()
  file: File                  // original File object
  name: string                // display name (may be edited)
  size: number                // bytes
  type: string                // MIME type
  preview?: string            // object URL for images (revoke when done!)
  status: FileStatus
  error?: string
  result?: ProcessedResult
}

export type FileStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'done'
  | 'error'

export interface ProcessedResult {
  blob: Blob
  filename: string
  size: number                // output size in bytes
  originalSize?: number       // for compression ratio display
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

export type ToolCategory = 'image' | 'pdf'

export interface Tool {
  id: string
  category: ToolCategory
  name: string
  description: string
  icon: string                // lucide icon name
  path: string                // router path
  badge?: 'new' | 'beta'
}

// ─── Image tool options ───────────────────────────────────────────────────────

export interface CompressImageOptions {
  maxSizeMB: number           // target max file size
  maxWidthOrHeight?: number   // optional dimension cap
  quality?: number            // 0–1
  outputFormat?: ImageOutputFormat
}

export type ImageOutputFormat = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ResizeImageOptions {
  width?: number
  height?: number
  maintainAspectRatio: boolean
  outputFormat: ImageOutputFormat
  quality: number
}

export interface ConvertImageOptions {
  targetFormat: ImageOutputFormat
  quality: number             // 0–1, relevant for JPEG/WEBP
}

export interface CropImageOptions {
  x: number                   // pixels from left
  y: number                   // pixels from top
  width: number
  height: number
  outputFormat: ImageOutputFormat
  quality: number
}

// ─── PDF tool options ─────────────────────────────────────────────────────────

export interface MergePdfOptions {
  files: File[]               // ordered list
}

export interface SplitPdfOptions {
  ranges: PageRange[]         // e.g. [{from:1,to:3},{from:5,to:5}]
}

export interface PageRange {
  from: number                // 1-indexed
  to: number
  label?: string              // "Part 1" etc.
}

export interface ReorderPdfOptions {
  pageOrder: number[]         // new order, 1-indexed original page numbers
}

export interface CompressPdfOptions {
  quality: PdfCompressionLevel
}

export type PdfCompressionLevel = 'low' | 'medium' | 'high'

// ─── Worker messaging ─────────────────────────────────────────────────────────

/**
 * All worker messages are typed. This prevents runtime surprises with
 * unstructured postMessage usage.
 */
export type WorkerRequest<T = unknown> = {
  id: string                  // correlation ID
  type: string
  payload: T
}

export type WorkerResponse<T = unknown> =
  | { id: string; status: 'ok'; payload: T }
  | { id: string; status: 'error'; error: string }
  | { id: string; status: 'progress'; percent: number; message?: string }

// ─── UI state ─────────────────────────────────────────────────────────────────

export type Notification = {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  body?: string
  duration?: number           // ms, default 4000; 0 = sticky
}
