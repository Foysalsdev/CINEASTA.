<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => String(route.params.id))
const pid = computed(() => String(route.params.pid))

const vendors = useVendorsStore()
const projects = useProjectsStore()

// Always pull live data so the printed receipt reflects the latest figures,
// never a cached snapshot from an earlier visit.
await useAsyncData(
  `receipt-${id.value}-${pid.value}`,
  () => Promise.all([vendors.fetchOne(id.value), projects.fetch(true)]).then(() => true),
  { getCachedData: () => undefined },
)

const detail = computed(() => vendors.current)
const payment = computed(() => detail.value?.payments.find((p) => p.id === pid.value) ?? null)
const bill = computed(() =>
  payment.value ? (detail.value?.bills.find((b) => b.id === payment.value!.bill_id) ?? null) : null,
)
const paidToDate = computed(() => {
  if (!payment.value || !bill.value) return 0
  const billId = payment.value.bill_id
  // Order chronologically by payment_date (created_at as tiebreak), matching
  // the convention in buildProjectVendors — not insertion order.
  const ordered = (detail.value?.payments ?? [])
    .filter((p) => p.bill_id === billId)
    .sort((a, b) => {
      const byDate = new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
      return byDate !== 0 ? byDate : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
  const cutoffIndex = ordered.findIndex((p) => p.id === payment.value!.id)
  return ordered.slice(0, cutoffIndex + 1).reduce((s, p) => s + (Number(p.amount) || 0), 0)
})
const dueAfter = computed(() => Math.max(0, (bill.value?.amount ?? 0) - paidToDate.value))
const projectName = computed(() => (bill.value ? (projects.byId(bill.value.project_id)?.project_name ?? '') : ''))

useHead(() => ({ title: `Receipt — ${detail.value?.vendor.name ?? 'Vendor'}` }))

function printNow() {
  if (import.meta.client) window.print()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 pb-10">
    <div class="no-print sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <NuxtLink :to="`/vendors/${id}`" class="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Back
      </NuxtLink>
      <button class="btn-primary !min-h-[40px] !px-4 text-sm" :disabled="!payment" @click="printNow">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Print / Save as PDF
      </button>
    </div>

    <StateBlock :loading="vendors.detailLoading && !detail" :error="vendors.error" :rows="6" @retry="vendors.fetchOne(id)">
      <div v-if="detail && payment" class="px-3 py-4 sm:px-6">
        <div class="mx-auto max-w-[800px] overflow-hidden rounded-2xl shadow-sm">
          <VendorReceipt
            :vendor="detail.vendor"
            :payment="payment"
            :project-name="projectName"
            :bill-label="bill?.category"
            :bill-total="bill?.amount"
            :paid-to-date="paidToDate"
            :due-after="dueAfter"
          />
        </div>
      </div>
      <p v-else-if="detail && !payment" class="px-4 py-16 text-center text-sm text-gray-400">Payment not found.</p>
    </StateBlock>
  </div>
</template>
