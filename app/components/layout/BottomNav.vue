<script setup lang="ts">
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
  <nav
    class="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur lg:hidden"
  >
    <ul class="mx-auto flex max-w-md items-stretch justify-between px-1">
      <li v-for="item in items" :key="item.to" class="flex-1">
        <NuxtLink
          :to="item.to"
          class="group relative flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-gray-400 transition"
          active-class="is-active !text-brand-600"
          :exact="item.to === '/'"
        >
          <!-- active pill behind the icon -->
          <span
            class="flex h-7 w-12 items-center justify-center rounded-full transition group-[.is-active]:bg-brand-50"
          >
            <svg viewBox="0 0 24 24" class="h-[22px] w-[22px]" fill="none" stroke="currentColor" stroke-width="1.8">
              <path :d="paths[item.icon]" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
