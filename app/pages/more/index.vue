<script setup lang="ts">
const auth = useAuthStore()
const { isMock } = useRepositories()
useHead({ title: 'More — CINEASTA.' })

const groups = [
  {
    title: 'Manage',
    items: [
      { to: '/assets', label: 'Assets', hint: 'Equipment & maintenance', icon: 'M3 7h18v12H3zM3 11h18' },
      { to: '/clients', label: 'Clients', hint: 'Client directory', icon: 'M16 14a4 4 0 1 0-8 0M12 7a3 3 0 1 0 0-.01' },
    ],
  },
  {
    title: 'Bulk Entry',
    items: [
      { to: '/bulk', label: 'Bulk Expenses', hint: 'Add many at once', icon: 'M4 6h16M4 12h16M4 18h16' },
      { to: '/bulk?mode=payments', label: 'Bulk Payments', hint: 'Multiple payments', icon: 'M4 6h16M4 12h16M4 18h10' },
      { to: '/bulk?mode=vendor', label: 'Bulk Vendor Payments', hint: 'Settle many vendors', icon: 'M4 6h16M4 12h10M4 18h16' },
      { to: '/bulk?mode=csv', label: 'CSV Import', hint: 'Import a spreadsheet', icon: 'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16' },
    ],
  },
]
</script>

<template>
  <div class="space-y-5">
    <h1 class="text-xl font-bold text-gray-900">More</h1>

    <div class="space-y-5 lg:columns-2 lg:gap-5 lg:space-y-0">
    <section v-for="g in groups" :key="g.title" class="space-y-2 lg:mb-5 lg:break-inside-avoid">
      <p class="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{{ g.title }}</p>
      <ul class="card divide-y divide-gray-100">
        <li v-for="item in g.items" :key="item.to">
          <NuxtLink :to="item.to" class="flex items-center gap-3 p-4 active:bg-gray-50">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><path :d="item.icon" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-gray-800">{{ item.label }}</span>
              <span class="block text-xs text-gray-400">{{ item.hint }}</span>
            </span>
            <svg viewBox="0 0 24 24" class="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section class="space-y-2 lg:mb-5 lg:break-inside-avoid">
      <p class="px-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Account</p>
      <ul class="card divide-y divide-gray-100">
        <li>
          <button class="flex w-full items-center gap-3 p-4 text-left active:bg-gray-50" @click="auth.logout()">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke-linecap="round" /></svg>
            </span>
            <span class="flex-1 text-sm font-medium text-gray-800">Lock / Sign out</span>
          </button>
        </li>
      </ul>
      <p v-if="isMock" class="px-1 text-center text-xs text-amber-600">Demo mode — local data only.</p>
    </section>
    </div>
  </div>
</template>
