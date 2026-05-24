import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'PrivateBox – Local File Toolkit',
        short_name: 'PrivateBox',
        description: 'Privacy-first image and PDF tools. Everything runs in your browser.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        // Cache WASM files (used by pdf-lib and image libs)
        runtimeCaching: [
          {
            urlPattern: /\.wasm$/,
            handler: 'CacheFirst',
            options: { cacheName: 'wasm-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  // Inline Web Workers – critical for heavy processing
  worker: {
    format: 'es'
  },
  build: {
    target: 'es2022',
    // Chunk splitting: vendor libs separate from app code
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdf-lib'],
          'pdfjs': ['pdfjs-dist'],
          'image-tools': ['browser-image-compression'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'dnd': ['react-dnd', 'react-dnd-html5-backend'],
        }
      }
    },
    // Increase chunk size warning threshold for WASM-heavy libs
    chunkSizeWarningLimit: 3000
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'] // Let Vite handle pdfjs natively
  }
})
