// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      injectRegister: false,
      
      manifest: {
        name: 'Learnful - Learning Planner',
        short_name: 'Learnful',
        description: 'Aplikasi Perencana Belajar dan Pengelolaan Tugas',
        theme_color: '#6366F1',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        
        // FIX: Tambahkan runtime caching yang aman
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        
        // FIX: Jangan cache external resources yang problematic
        dontCacheBustURLsMatching: /^\/_nuxt\/\w{8}\//,
        globIgnores: ['**/*.map', '**/_nuxt/**', 'chrome-extension:*']
      },

      // FIX: Disable PWA di development untuk avoid errors
      devOptions: {
        enabled: false, // MATIKAN di development
        navigateFallback: 'index.html',
        type: 'module',
      },
    })
  ],
  
  // FIX: WebSocket connection issue
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    }
  }
  ,
  // Build tuning: increase warning limit and add manual chunking
  build: {
    // Raise the chunk warning limit (kilobytes) to reduce noisy warnings during development
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Manual chunking: keep vendor code split, and isolate heavy libs (chart.js, react-chartjs-2)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            return 'vendor'
          }
        }
      }
    }
  }
})