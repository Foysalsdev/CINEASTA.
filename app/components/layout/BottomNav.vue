<script setup lang="ts">
const items = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/projects', label: 'Projects', icon: 'projects' },
  { to: '/payments', label: 'Payments', icon: 'payments' },
  { to: '/expenses', label: 'Expenses', icon: 'expenses' },
  { to: '/reports', label: 'Reports', icon: 'reports' },
]
const paths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9v11h14V9',
  projects: 'M4 7h16M4 12h16M4 17h10',
  payments: 'M3 7h18v10H3zM3 11h18',
  expenses: 'M12 3v18M7 8h7a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8',
  reports: 'M4 19V5m5 14V9m5 10v-6m5 6V7',
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <ul class="mx-auto flex max-w-md items-stretch justify-between px-2">
      <li v-for="item in items" :key="item.to" class="flex-1">
        <NuxtLink
          :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-gray-400 transition"
          active-class="!text-brand-600"
          :exact="item.to === '/'"
        >
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8">
            <path :d="paths[item.icon]" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
