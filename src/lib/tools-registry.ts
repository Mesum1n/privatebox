import type { Tool } from '@/types'

/**
 * TOOL REGISTRY
 *
 * This is the single source of truth for every tool in the app.
 * Adding a new tool = add one entry here + create the tool component.
 * Navigation, search, and home grid all derive from this list.
 */
export const TOOLS: Tool[] = [
  // ── IMAGE ──────────────────────────────────────────────────────────────────
  {
    id: 'image-compress',
    category: 'image',
    name: 'Compress Image',
    description: 'Reduce file size while preserving quality. Supports JPEG, PNG, WEBP.',
    icon: 'Minimize2',
    path: '/image/compress',
  },
  {
    id: 'image-resize',
    category: 'image',
    name: 'Resize Image',
    description: 'Change dimensions by pixels or percentage. Maintains aspect ratio.',
    icon: 'Scaling',
    path: '/image/resize',
  },
  {
    id: 'image-convert',
    category: 'image',
    name: 'Convert Format',
    description: 'Convert between PNG, JPEG, and WEBP formats.',
    icon: 'RefreshCw',
    path: '/image/convert',
  },
  {
    id: 'image-crop',
    category: 'image',
    name: 'Crop Image',
    description: 'Crop to a specific region. Visual selection with live preview.',
    icon: 'Crop',
    path: '/image/crop',
  },

  // ── PDF ────────────────────────────────────────────────────────────────────
  {
    id: 'pdf-merge',
    category: 'pdf',
    name: 'Merge PDFs',
    description: 'Combine multiple PDFs into one. Drag to reorder before merging.',
    icon: 'FilePlus2',
    path: '/pdf/merge',
  },
  {
    id: 'pdf-split',
    category: 'pdf',
    name: 'Split PDF',
    description: 'Extract page ranges into separate files.',
    icon: 'Scissors',
    path: '/pdf/split',
  },
  {
    id: 'pdf-reorder',
    category: 'pdf',
    name: 'Reorder Pages',
    description: 'Drag and drop to rearrange pages. Preview each page first.',
    icon: 'GripVertical',
    path: '/pdf/reorder',
    badge: 'beta',
  },
  {
    id: 'pdf-compress',
    category: 'pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF size for sharing. Choose compression aggressiveness.',
    icon: 'Archive',
    path: '/pdf/compress',
  },
]

export const IMAGE_TOOLS = TOOLS.filter(t => t.category === 'image')
export const PDF_TOOLS   = TOOLS.filter(t => t.category === 'pdf')

export function getToolById(id: string): Tool | undefined {
  return TOOLS.find(t => t.id === id)
}
