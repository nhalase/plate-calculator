import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/plate-calculator/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      strategies: 'generateSW',
      includeAssets: [
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        id: './',
        name: 'Barbell Plate Calculator',
        short_name: 'Plate Calculator',
        description:
          'Calculate barbell plate configurations and loaded weight.',
        lang: 'en-US',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{html,js,css,png,webmanifest}'],
        navigateFallback: 'index.html',
        inlineWorkboxRuntime: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
