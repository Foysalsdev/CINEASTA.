<script setup lang="ts">
// Desktop/PC navigation rail (shown at lg+; the BottomNav handles mobile).
const { isMock } = useRepositories()
const auth = useAuthStore()

const items = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/projects', label: 'Projects', icon: 'projects' },
  { to: '/finance', label: 'Finance', icon: 'finance' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
  { to: '/more', label: 'More', icon: 'more' },
]
const paths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9v11h14V9',
  projects: 'M4 7h16M4 12h16M4 17h10',
  finance: 'M3 7h18v10H3zM3 11h18M7 15h3',
  reports: 'M4 19V5m5 14V9m5 10v-6m5 6V7',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
}
</script>

<template>
  <aside class="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-100 bg-white lg:flex">
    <div class="flex items-center gap-2 px-5 py-5">
      <BrandMark :size="34" />
      <span
        v-if="isMock"
        class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600"
        title="Connect NUXT_PUBLIC_API_BASE_URL to use live Google Sheets data"
      >Demo</span>
    </div>

    <nav class="flex-1 space-y-1 px-3">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
        active-class="is-active !bg-brand-50 !text-brand-700"
        :exact="item.to === '/'"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
          <path :d="paths[item.icon]" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ item.label }}
      </NuxtLink>
    </nav>

    <div class="border-t border-gray-100 p-3">
      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
        @click="auth.logout()"
      >
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke-linecap="round" />
        </svg>
        Lock / Sign out
      </button>
    </div>
  </aside>
</template>
