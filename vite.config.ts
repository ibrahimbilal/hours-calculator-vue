import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      // Without this, manifest + SW are only injected on `vite build`, not `vite dev`.
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'Hours Calculator',
        short_name: 'HoursCalc',
        description:
          'Smart working hours calculator with multi-language support (Arabic, English, Dutch)',
        start_url: '/',
        scope: '/',
        theme_color: '#0d9488',
        background_color: '#f0f4f8',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        lang: 'en',
        icons: [
          {
            src: '/icons/favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/favicon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/mobile.png',
            sizes: '375x824',
            type: 'image/png',
            label: 'Track work hours and pay on your phone',
          },
          {
            src: '/screenshots/desktop-wide.png',
            sizes: '1920x911',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Desktop time tracker with statistics',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
})