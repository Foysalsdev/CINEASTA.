<script setup lang="ts">
import type { ProjectWithMetrics, VendorBillLine, VendorDetail } from '~/types'
import { EXPENSE_TYPE_LABEL } from '~/utils/constants'
import { sumBy } from '~/utils/calculations'

const props = withDefaults(defineProps<{ detail: VendorDetail; projects?: ProjectWithMetrics[] }>(), {
  projects: () => [],
})
const { currency, date } = useFormat()

const generatedOn = new Date().toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

function projectName(projectId: string) {
  return props.projects.find((p) => p.id === projectId)?.project_name ?? '—'
}
// A bill is either tied to a project or one of the agency-internal types —
// show whichever applies so "what work" is clear without an extra column.
function billContext(b: VendorBillLine) {
  return b.project_id ? projectName(b.project_id) : EXPENSE_TYPE_LABEL[b.type]
}
// Payments are matched back to their bill for the "Against" column.
const billsById = computed(() => new Map(props.detail.bills.map((b) => [b.id, b])))

const billsTotal = computed(() => sumBy(props.detail.bills, (b) => b.amount))
const paidTotal = computed(() => sumBy(props.detail.bills, (b) => b.paid))
const dueTotal = computed(() => sumBy(props.detail.bills, (b) => b.due))
</script>

<template>
  <article class="print-page mx-auto w-full max-w-[800px] bg-white p-8 text-gray-900">
    <!-- Brand header -->
    <header class="print-keep flex items-start justify-between border-b-2 border-brand-600 pb-5">
      <div>
        <p class="text-2xl font-extrabold leading-none tracking-tight text-brand-700">CINEASTA<span class="text-brand-500">.</span></p>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold">Vendor Statement</p>
        <p class="text-xs text-gray-400">Full history — work &amp; payments</p>
        <p class="text-xs text-gray-400">Generated {{ generatedOn }}</p>
      </div>
    </header>

    <!-- Vendor meta -->
    <section class="mt-6 grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-400">Vendor</p>
        <p class="font-semibold">{{ detail.vendor.name }}</p>
        <p class="capitalize text-gray-500">{{ detail.vendor.category || '—' }}</p>
      </div>
      <div class="text-right">
        <p class="text-xs uppercase tracking-wide text-gray-400">Contact</p>
        <p class="font-semibold">{{ detail.vendor.phone || '—' }}</p>
        <p class="text-gray-500">{{ detail.vendor.email || '—' }}</p>
      </div>
    </section>

    <!-- Financial summary -->
    <section class="print-keep mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Summary</h2>
      <div class="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
        <div class="bg-white p-3">
          <p class="text-xs text-gray-400">Total Billed</p>
          <p class="text-base font-bold">{{ currency(detail.summary.totalBilled) }}</p>
        </div>
        <div class="bg-white p-3">
          <p class="text-xs text-gray-400">Total Paid</p>
          <p class="text-base font-bold text-brand-600">{{ currency(detail.summary.totalPaid) }}</p>
        </div>
        <div class="bg-white p-3">
          <p class="text-xs text-gray-400">Outstanding Due</p>
          <p class="text-base font-bold" :class="detail.summary.due > 0 ? 'text-amber-600' : 'text-gray-400'">{{ currency(detail.summary.due) }}</p>
        </div>
      </div>
    </section>

    <!-- Work / Bills -->
    <section class="mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Work &amp; Bills ({{ detail.bills.length }})</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th class="py-1.5">Date</th><th class="py-1.5">Project / Type</th><th class="py-1.5">Category</th><th class="py-1.5 text-right">Bill</th><th class="py-1.5 text-right">Paid</th><th class="py-1.5 text-right">Due</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in detail.bills" :key="b.id" class="border-b border-gray-100">
            <td class="py-1.5">{{ date(b.expense_date) }}</td>
            <td class="py-1.5 text-gray-500">{{ billContext(b) }}</td>
            <td class="py-1.5">{{ b.category }}</td>
            <td class="py-1.5 text-right">{{ currency(b.amount) }}</td>
            <td class="py-1.5 text-right text-brand-600">{{ currency(b.paid) }}</td>
            <td class="py-1.5 text-right font-medium" :class="b.due > 0 ? 'text-amber-600' : 'text-gray-400'">{{ currency(b.due) }}</td>
          </tr>
          <tr v-if="!detail.bills.length"><td colspan="6" class="py-3 text-center text-gray-400">No bills from this vendor.</td></tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-200 font-bold">
            <td colspan="3" class="py-2">Totals</td>
            <td class="py-2 text-right">{{ currency(billsTotal) }}</td>
            <td class="py-2 text-right text-brand-600">{{ currency(paidTotal) }}</td>
            <td class="py-2 text-right text-amber-600">{{ currency(dueTotal) }}</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <!-- Payments -->
    <section class="mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Payments ({{ detail.payments.length }})</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th class="py-1.5">Date</th><th class="py-1.5">Method</th><th class="py-1.5">Against</th><th class="py-1.5">Notes</th><th class="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in detail.payments" :key="p.id" class="border-b border-gray-100">
            <td class="py-1.5">{{ date(p.payment_date) }}</td>
            <td class="py-1.5 capitalize">{{ p.payment_method }}</td>
            <td class="py-1.5 text-gray-500">{{ billsById.get(p.bill_id)?.category ?? '—' }}</td>
            <td class="py-1.5 text-gray-500">{{ p.notes || '—' }}</td>
            <td class="py-1.5 text-right font-medium text-brand-600">{{ currency(p.amount) }}</td>
          </tr>
          <tr v-if="!detail.payments.length"><td colspan="5" class="py-3 text-center text-gray-400">No payments yet.</td></tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-200 font-bold"><td colspan="4" class="py-2">Total Paid</td><td class="py-2 text-right text-brand-600">{{ currency(paidTotal) }}</td></tr>
        </tfoot>
      </table>
    </section>

    <footer class="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
      This is a system-generated statement from CINEASTA. · {{ generatedOn }}
    </footer>
  </article>
</template>
