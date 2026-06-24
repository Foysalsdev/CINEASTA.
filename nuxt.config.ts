// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vite-pwa/nuxt'],

  // Use flat component names (no directory prefix) for ergonomics.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  // Auto-import the repository layer (composables/ and utils/ are scanned by default).
  imports: {
    dirs: ['repositories'],
  },

  // Public runtime config — overridable via NUXT_PUBLIC_* env vars on Vercel.
  // When apiBaseUrl is empty the app falls back to built-in mock data.
  runtimeConfig: {
    public: {
      apiBaseUrl: '',
      apiToken: '',
    },
  },

  app: {
    head: {
      title: 'CINEASTA — Agency Profit Tracker',
      viewport:
        'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'description',
          content:
            'CINEASTA Agency Profit Tracker — know your revenue, expenses, profit and dues at a glance.',
        },
        { name: 'theme-color', content: '#176a3a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'CINEASTA' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
      ],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'CINEASTA — Agency Profit Tracker',
      short_name: 'CINEASTA',
      description: 'Know your revenue, expenses, profit and dues at a glance.',
      theme_color: '#176a3a',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      // Cache API GET responses (stale-while-revalidate) so the dashboard
      // opens instantly and stays usable offline.
      runtimeCaching: [
        {
          urlPattern: ({ url }) => url.pathname.includes('/exec'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'apps-script-api',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    client: { installPrompt: true },
    devOptions: { enabled: false },
  },

  typescript: { strict: true },
})
