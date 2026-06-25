<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => String(route.params.id))
const vendors = useVendorsStore()
const projects = useProjectsStore()

// Always pull live data so the printed statement reflects the latest figures,
// never a cached snapshot from an earlier visit.
await useAsyncData(
  `vendor-statement-${id.value}`,
  () => Promise.all([vendors.fetchOne(id.value), projects.fetch(true)]).then(() => true),
  { getCachedData: () => undefined },
)
const detail = computed(() => vendors.current)

useHead(() => ({ title: `${detail.value?.vendor.name ?? 'Vendor'} — Statement` }))

function printNow() {
  if (import.meta.client) window.print()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 pb-10 print:min-h-0 print:bg-white print:pb-0">
    <div class="no-print sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <NuxtLink :to="`/vendors/${id}`" class="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Back
      </NuxtLink>
      <button class="btn-primary !min-h-[40px] !px-4 text-sm" :disabled="!detail" @click="printNow">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Print / Save as PDF
      </button>
    </div>

    <StateBlock :loading="vendors.detailLoading && !detail" :error="vendors.error" :rows="6" @retry="vendors.fetchOne(id)">
      <div v-if="detail" class="px-3 py-4 sm:px-6 print:p-0">
        <div class="mx-auto max-w-[800px] overflow-hidden rounded-2xl shadow-sm print:max-w-none print:overflow-visible print:rounded-none print:shadow-none">
          <VendorStatement :detail="detail" :projects="projects.items" />
        </div>
      </div>
    </StateBlock>
  </div>
</template>
