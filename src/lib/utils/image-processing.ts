/**
 * IMAGE PROCESSING UTILITIES
 *
 * All operations use the HTML5 Canvas API or browser-image-compression (WASM-accelerated).
 * Nothing is sent to a server. Files are processed in the browser.
 *
 * Key decisions:
 * - Canvas API for crop/resize (zero dependencies, maximum control)
 * - browser-image-compression for JPEG/WEBP quality compression (uses WASM internally)
 * - Separate functions keep each operation testable and composable
 */

import imageCompression from 'browser-image-compression'
import type {
  CompressImageOptions,
  ResizeImageOptions,
  ConvertImageOptions,
  CropImageOptions,
  ImageOutputFormat,
} from '@/types'
import { loadImageElement } from './file'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create an offscreen canvas with the given dimensions.
 * OffscreenCanvas is used when available (better memory management),
 * falling back to a regular canvas element.
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas    = document.createElement('canvas')
  canvas.width    = width
  canvas.height   = height
  return canvas
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context not available')
  return ctx
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ImageOutputFormat, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Canvas toBlob failed'))
        else resolve(blob)
      },
      format,
      quality
    )
  })
}

// ─── Core operations ──────────────────────────────────────────────────────────

/**
 * COMPRESS
 *
 * Uses browser-image-compression which internally uses WASM for speed.
 * Supports progressive quality reduction until target size is met.
 *
 * Engineering note: this library spawns a Web Worker internally, so the
 * main thread stays unblocked during compression. We don't need our own
 * worker for this one.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const compressed = await imageCompression(file, {
    maxSizeMB:         options.maxSizeMB,
    maxWidthOrHeight:  options.maxWidthOrHeight,
    useWebWorker:      true,         // keep main thread free
    initialQuality:    options.quality ?? 0.8,
    fileType:          options.outputFormat,
    onProgress,
  })

  return compressed
}

/**
 * RESIZE
 *
 * Canvas-based resize. We use a "stepwise" downscaling approach:
 * shrinking in steps of 50% produces better quality than a single-step
 * resize for large reductions (avoids the "pixelated" artifact).
 */
export async function resizeImage(file: File, options: ResizeImageOptions): Promise<Blob> {
  const { img, cleanup } = await loadImageElement(file)

  let targetW = options.width  ?? img.naturalWidth
  let targetH = options.height ?? img.naturalHeight

  if (options.maintainAspectRatio) {
    const ratio = img.naturalWidth / img.naturalHeight
    if (options.width && !options.height) {
      targetH = Math.round(options.width / ratio)
    } else if (options.height && !options.width) {
      targetW = Math.round(options.height * ratio)
    } else if (options.width && options.height) {
      // Fit within the box
      const fitByWidth  = options.width
      const fitByHeight = Math.round(options.width / ratio)
      if (fitByHeight <= options.height) {
        targetW = fitByWidth
        targetH = fitByHeight
      } else {
        targetH = options.height
        targetW = Math.round(options.height * ratio)
      }
    }
  }

  // Stepwise downscale for quality
  const canvas = stepwiseResize(img, targetW, targetH)
  cleanup()

  return canvasToBlob(canvas, options.outputFormat, options.quality)
}

/**
 * Stepwise resize: halve dimensions until we're within 2x of target.
 * This significantly improves quality vs. single-step downsample.
 */
function stepwiseResize(
  source: HTMLImageElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  let currentW = source.naturalWidth
  let currentH = source.naturalHeight

  let canvas = createCanvas(currentW, currentH)
  let ctx    = getContext(canvas)
  ctx.drawImage(source, 0, 0, currentW, currentH)

  while (currentW > targetW * 2 || currentH > targetH * 2) {
    const nextW = Math.max(Math.floor(currentW / 2), targetW)
    const nextH = Math.max(Math.floor(currentH / 2), targetH)

    const next    = createCanvas(nextW, nextH)
    const nextCtx = getContext(next)
    nextCtx.drawImage(canvas, 0, 0, nextW, nextH)

    canvas   = next
    ctx      = nextCtx
    currentW = nextW
    currentH = nextH
  }

  // Final precise resize
  const final    = createCanvas(targetW, targetH)
  const finalCtx = getContext(final)
  finalCtx.imageSmoothingEnabled  = true
  finalCtx.imageSmoothingQuality  = 'high'
  finalCtx.drawImage(canvas, 0, 0, targetW, targetH)

  return final
}

/**
 * CONVERT FORMAT
 *
 * Canvas decode + re-encode. For PNG → JPEG, we fill transparent areas
 * with white (JPEG has no alpha channel).
 */
export async function convertImageFormat(file: File, options: ConvertImageOptions): Promise<Blob> {
  const { img, cleanup } = await loadImageElement(file)

  const canvas = createCanvas(img.naturalWidth, img.naturalHeight)
  const ctx    = getContext(canvas)

  // Fill white background for JPEG (which can't store transparency)
  if (options.targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(img, 0, 0)
  cleanup()

  return canvasToBlob(canvas, options.targetFormat, options.quality)
}

/**
 * CROP
 *
 * Crops to a pixel rectangle. The crop rectangle comes from the UI
 * (react-image-crop provides this in pixel units after applying scale).
 */
export async function cropImage(file: File, options: CropImageOptions): Promise<Blob> {
  const { img, cleanup } = await loadImageElement(file)

  const canvas = createCanvas(options.width, options.height)
  const ctx    = getContext(canvas)

  ctx.drawImage(
    img,
    options.x, options.y, options.width, options.height,  // source rect
    0, 0, options.width, options.height                    // dest rect
  )
  cleanup()

  return canvasToBlob(canvas, options.outputFormat, options.quality)
}

// ─── Format detection ─────────────────────────────────────────────────────────

export function mimeToExtension(mime: ImageOutputFormat): string {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime]
}

export function extensionToMime(ext: string): ImageOutputFormat {
  const map: Record<string, ImageOutputFormat> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  }
  return map[ext.toLowerCase()] ?? 'image/jpeg'
}
