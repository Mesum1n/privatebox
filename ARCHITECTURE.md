# PrivateBox – Architecture Guide

> A reference for every engineering decision made in this codebase.
> Read this before adding new features.

---

## Core Philosophy

**Files never leave the device.** Every processing operation uses:
- Browser Canvas API (crop, resize, convert)
- WASM-powered browser-image-compression (JPEG/WEBP compression)
- pdf-lib (PDF writing/manipulation – pure JS)
- PDF.js (PDF reading/rendering – WASM)

No backend. No S3. No analytics SDK.

---

## Folder Structure

```
src/
├── components/
│   ├── ui/              # Primitive components (Button, Slider, DropZone, FileCard)
│   ├── layout/          # App shell, ToolPage wrapper, HomePage
│   └── tools/
│       ├── image/       # One file per image tool
│       └── pdf/         # One file per PDF tool
├── hooks/
│   └── useFileProcessor.ts   # The core reusable hook for all tools
├── lib/
│   └── utils/
│       ├── file.ts            # File I/O, validation, download, object URLs
│       ├── image-processing.ts # All image operations (Canvas-based)
│       └── pdf-processing.ts  # All PDF operations (pdf-lib + PDF.js)
├── store/
│   └── index.ts          # Zustand: notifications + persisted preferences
├── types/
│   └── index.ts          # All TypeScript types (single source of truth)
└── lib/
    └── tools-registry.ts # Metadata for all tools (nav, home grid, routing)
```

---

## Library Choices & Rationale

### Image Processing

| Library | Role | Why |
|---|---|---|
| `browser-image-compression` | JPEG/WEBP compression | Uses WASM internally; spawns its own Web Worker; respects quality + size targets |
| HTML5 Canvas API | Crop, resize, convert | Zero dependency; full control; works offline |

**What we don't use:** Sharp (Node.js only), Jimp (too heavy), squoosh (no npm package).

### PDF

| Library | Role | Why |
|---|---|---|
| `pdf-lib` | Write/manipulate PDFs | Pure JS, no WASM, runs in browser; great API |
| `pdfjs-dist` | Render page previews | Mozilla's official library; only loaded when needed (dynamic import) |

**Critical:** These two libraries have separate jobs. Don't use pdf-lib for rendering or PDF.js for writing.

### State

| Library | Role | Why |
|---|---|---|
| `zustand` | Global state | Tiny (1.1kb), no boilerplate, supports middleware |

**Rule:** Tool-level state (files, options, results) lives in components/hooks, NOT in Zustand. Global store = notifications + preferences only.

### Drag & Drop

| Library | Role | Why |
|---|---|---|
| `react-dropzone` | File drop zones | Battle-tested, handles edge cases (mobile, keyboard, ARIA) |
| Native HTML5 DnD | List reordering (PDF merge) | Sufficient for simple reordering; saves a library dependency |
| `react-dnd` | Complex DnD (page grid reorder) | Used only in ReorderPdf where complex drag behavior is needed |

### Routing

`react-router-dom` v6. Each tool = one route. No lazy loading initially (bundle is small enough). Add `React.lazy()` per tool when bundle > 500KB.

---

## The Tool Pattern

Every tool follows this exact pattern:

```tsx
// 1. Define options in local state
const [quality, setQuality] = useState(80)

// 2. Define processor function (memoized with useCallback)
const processor = useCallback(async (file: File): Promise<ProcessedResult> => {
  const blob = await someOperation(file, { quality })
  return { blob, filename: 'output.jpg', size: blob.size, originalSize: file.size }
}, [quality])

// 3. Wire up the hook
const { files, isProcessing, addFiles, removeFile, processFiles } =
  useFileProcessor({ validate, processor })

// 4. Render ToolPage with Options + Workspace
return (
  <ToolPage title="..." ...>
    <ToolPage.Options>
      {/* sliders, selects */}
    </ToolPage.Options>
    <ToolPage.Workspace>
      {files.length === 0 ? <DropZone ... /> : <FileCard list />}
    </ToolPage.Workspace>
  </ToolPage>
)
```

---

## Memory Management

### Object URLs

Object URLs (`URL.createObjectURL()`) keep a file in memory until explicitly revoked.
Forgetting to revoke = memory leak.

**Rules:**
- Always use `createObjectURL()` from `src/lib/utils/file.ts` (tracked in a Set)
- Call `revokeObjectURL()` when removing files
- `useFileProcessor` revokes all previews on unmount

### Large Files

For files > 20MB:
- Don't create previews eagerly
- Process sequentially (not parallel) to prevent OOM
- `useFileProcessor` processes files one-at-a-time by design

### PDF.js

PDF.js holds page data in memory. Always call:
```ts
page.cleanup()
pdfDoc.cleanup()
pdfDoc.destroy()
```
after rendering. This is done in `renderPdfPageToDataURL()`.

---

## Web Worker Strategy

**Current:** `browser-image-compression` runs its own worker internally.

**When to add manual workers:**
- PDF merge on files > 50MB (blocks main thread ~2s)
- Batch image processing > 10 files

**How to add:**
```ts
// src/lib/workers/pdf-merge.worker.ts
self.onmessage = async (e) => {
  const result = await mergePdfs(e.data)
  self.postMessage({ ok: true, result })
}

// Usage in component:
const worker = new Worker(new URL('../lib/workers/pdf-merge.worker.ts', import.meta.url))
```

Vite handles worker bundling automatically with `{ worker: { format: 'es' } }` in vite.config.ts.

---

## PWA / Offline Support

`vite-plugin-pwa` generates a service worker that caches:
- All JS/CSS/HTML (app shell)
- WASM binaries (for offline processing)

After first load, the app works completely offline.

**What doesn't work offline:** Google Fonts (gracefully degrades to system fonts).

---

## Performance Optimization

### Bundle splitting

`manualChunks` in vite.config.ts splits heavy libs:
- `pdf-lib` → separate chunk (~200KB)  
- `pdfjs-dist` → separate chunk (~500KB, loaded lazily)
- `image-tools` → separate chunk (~150KB)

### Lazy loading PDF.js

```ts
// In pdf-processing.ts
const pdfjsLib = await import('pdfjs-dist')  // only loads when first PDF tool is used
```

### Image previews

Only created for images (not PDFs). Revoked immediately when a file is removed.

---

## Security & Privacy

1. **No network requests** from processing code. All I/O is File → Blob → download.
2. **No `eval()`** or dynamic code execution.
3. **No cookies, localStorage with file data.** Only preferences are persisted.
4. **CSP-friendly.** No inline scripts, no unsafe-eval. Add this to `vercel.json`:
   ```json
   "headers": [
     {
       "source": "/(.*)",
       "headers": [
         { "key": "X-Frame-Options", "value": "DENY" },
         { "key": "X-Content-Type-Options", "value": "nosniff" },
         { "key": "Referrer-Policy", "value": "no-referrer" }
       ]
     }
   ]
   ```

---

## Adding a New Tool

1. Add entry to `src/lib/tools-registry.ts`
2. Create `src/components/tools/{category}/YourTool.tsx`
3. Add processing function to appropriate utils file
4. Add route to `src/App.tsx`
5. Add icon mapping to `AppLayout.tsx` and `HomePage.tsx`

---

## Development Roadmap

### MVP (current)
- ✅ Image: Compress, Resize, Convert, Crop
- ✅ PDF: Merge, Split, Reorder, Compress
- ✅ PWA support
- ✅ Drag-and-drop
- ✅ Batch processing

### v1.1
- [ ] Image: Remove background (transformers.js)
- [ ] PDF: Add watermark
- [ ] PDF: PDF to images
- [ ] Crop: Aspect ratio presets (1:1, 16:9, 4:3)

### v1.2
- [ ] Batch download as ZIP (JSZip)
- [ ] Persistent history of recent operations (IndexedDB)
- [ ] Keyboard shortcuts
- [ ] Dark/light theme toggle

### v2.0 (if needed)
- [ ] Optional self-hosted backend for formats requiring native tools
- [ ] CLI companion using the same processing logic

---

## Deployment

### GitHub + Vercel

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial PrivateBox"
git remote add origin https://github.com/your/privatebox.git
git push -u origin main

# 2. Import in Vercel
# vercel.com/new → Import Git Repository → Select your repo
# Framework: Vite (auto-detected)
# Build: npm run build
# Output: dist/
```

### vercel.json

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    }
  ]
}
```

> `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` are required for SharedArrayBuffer, which PDF.js uses for performance.

---

## Features to Avoid Early

- **Authentication** – adds complexity, breaks the "no server" promise
- **Cloud sync** – contradicts the privacy-first mission
- **Analytics** (Mixpanel, GA) – hard no; use self-hosted Plausible if you need data later
- **AI/ML features** – large WASM downloads; add only when clearly needed
- **Complex animations** – tools should feel fast, not flashy
- **Feature flags / A-B testing** – premature for a utility app

---

## Key Engineering Lessons

1. **Object URL leaks are the #1 memory bug.** Track every createObjectURL call.
2. **PDF.js is for reading, pdf-lib is for writing.** Never confuse them.
3. **Process sequentially for large files.** Parallel promises + large ArrayBuffers = OOM.
4. **Dynamic import heavy WASM libs.** Users shouldn't download PDF.js until they use a PDF tool.
5. **useCallback your processor function.** If it's not memoized, useFileProcessor re-creates it on every render.
