// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  // Private, auth-gated PWA: render as a client-side SPA. Avoids leaking a
  // server-rendered flash of protected financials before the auth check runs,
  // and keeps the app-shell instantly available offline.
  ssr: false,

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
      // Passcode used ONLY in mock/demo mode (no backend). In live mode the
      // password is verified server-side by Apps Script and never shipped here.
      appPasscode: 'cineasta',
    },
  },

  app: {
    head: {
      title: 'CINEASTA.',
      viewport:
        'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'description',
          content:
            'CINEASTA. Agency Profit Tracker — know your revenue, expenses, profit and dues at a glance.',
        },
        { name: 'theme-color', content: '#176a3a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'CINEASTA.' },
      ],
      link: [
        // Explicit manifest link so the PWA is discoverable/installable even
        // in SPA mode (the module doesn't inject it into the static shell).
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', href: '/icons/icon-192.png' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
      ],
    },
  },

  pwa: {
    // 'prompt' (not 'autoUpdate') so a new deploy doesn't silently swap the
    // app shell under the user — UpdatePrompt.vue shows a banner and only
    // activates the new service worker once the user taps Reload.
    registerType: 'prompt',
    manifest: {
      name: 'CINEASTA.',
      short_name: 'CINEASTA.',
      description: 'Know your revenue, expenses, profit and dues at a glance.',
      theme_color: '#176a3a',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      // Drop precaches from older deploys on activate so a stale service worker
      // can never serve a broken shell (the "stuck spinner" after a redeploy).
      cleanupOutdatedCaches: true,
      // false: a new SW waits until the user confirms the UpdatePrompt
      // banner (registerType 'prompt' above) instead of taking over an
      // already-open tab mid-session.
      clientsClaim: false,
      skipWaiting: false,
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
