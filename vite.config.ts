import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 🚨 NEW

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // 🚨 NEW: PWA Configuration for Offline Support
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'One Shot Bar & Billiards',
        short_name: 'OneShot',
        description: 'Table Management & Point of Sale System',
        theme_color: '#171717',
        background_color: '#171717',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Caches all internal logic and assets for offline use
        globPatterns: ['**/*.{js,css,html,ico,png,svg,csv}'],
        runtimeCaching: [
          {
            // Specifically allow Supabase calls to fail gracefully
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'supabase-queue',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
                }
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    proxy: {
      '/api/onesignal': {
        target: 'https://onesignal.com/api/v1/notifications',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/onesignal/, '')
      }
    }
  }
})