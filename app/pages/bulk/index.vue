<script setup lang="ts">
const route = useRoute()
useHead({ title: 'Bulk Entry — CINEASTA' })

const modes: Record<string, string> = {
  '': 'Bulk Expenses',
  payments: 'Bulk Payments',
  vendor: 'Bulk Vendor Payments',
  csv: 'CSV Import',
}
const title = computed(() => modes[(route.query.mode as string) || ''] || 'Bulk Entry')
</script>

<template>
  <div class="space-y-4">
    <NuxtLink to="/more" class="inline-flex items-center gap-1 text-sm text-gray-500">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      More
    </NuxtLink>
    <h1 class="text-xl font-bold text-gray-900">{{ title }}</h1>

    <div class="card flex flex-col items-center gap-3 p-10 text-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" /></svg>
      </div>
      <p class="text-sm font-semibold text-gray-700">{{ title }} — coming in Phase 2</p>
      <p class="max-w-xs text-sm text-gray-400">
        Spreadsheet-style multi-row entry and CSV import will land next. For now,
        add entries from the Finance tabs or the Quick-Add button.
      </p>
    </div>
  </div>
</template>
