<script setup lang="ts">
const vendors = useVendorsStore()
const reports = useReportsStore()
const ui = useUiStore()
const { currency } = useFormat()

onMounted(() => Promise.all([vendors.fetch(), reports.fetchAll()]))

// due per vendor (from the vendor-dues report)
const dueById = computed(() => {
  const m = new Map<string, { due: number; bill: number; paid: number }>()
  for (const r of reports.vendorDues) m.set(r.id, { due: r.due, bill: r.totalBill, paid: r.paid })
  return m
})
const totalDue = computed(() => reports.vendorDues.reduce((a, r) => a + r.due, 0))
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <KpiCard class="flex-1" label="Total Payable (baki)" :value="currency(totalDue)" tone="warning" />
    </div>
    <button class="btn-ghost w-full !bg-white ring-1 ring-gray-200" @click="ui.openQuickAdd('vendor')">+ Add vendor</button>

    <StateBlock
      :loading="vendors.loading && !vendors.items.length"
      :error="vendors.error"
      :empty="vendors.loaded && !vendors.items.length"
      empty-title="No vendors yet"
      empty-hint="Add a vendor to track bills and payments."
      @retry="vendors.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="ui.openQuickAdd('vendor')">+ Add vendor</button>
      </template>
      <ul class="card divide-y divide-gray-100">
        <li v-for="v in vendors.items" :key="v.id">
          <NuxtLink :to="`/vendors/${v.id}`" class="flex items-center justify-between gap-2 p-4 active:bg-gray-50">
            <div class="min-w-0">
              <p class="truncate font-medium text-gray-900">{{ v.name }}</p>
              <p class="truncate text-xs text-gray-400">{{ v.phone || v.email || '—' }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-semibold" :class="(dueById.get(v.id)?.due ?? 0) > 0 ? 'text-amber-600' : 'text-brand-600'">
                {{ (dueById.get(v.id)?.due ?? 0) > 0 ? `Due ${currency(dueById.get(v.id)!.due)}` : 'Settled' }}
              </p>
              <p class="text-[11px] text-gray-400">Billed {{ currency(dueById.get(v.id)?.bill ?? 0) }}</p>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
