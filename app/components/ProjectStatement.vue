<script setup lang="ts">
import type { ProjectDetail } from '~/repositories'
import type { Vendor } from '~/types'
import { buildProjectVendors, sumBy } from '~/utils/calculations'

const props = withDefaults(
  defineProps<{ detail: ProjectDetail; vendors?: Vendor[]; mode?: 'client' | 'internal' }>(),
  { vendors: () => [], mode: 'client' },
)
const { currency, percent, date } = useFormat()

// Contract value, cost, profit, margin and vendor payables are confidential —
// only shown on the Internal copy, never on a client/vendor-facing statement.
const confidential = computed(() => props.mode === 'internal')

const m = computed(() => props.detail.project.metrics)
const generatedOn = new Date().toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const paymentsTotal = computed(() => sumBy(props.detail.payments, (p) => p.amount))

const summaryCells = computed(() => {
  const cells: { label: string; value: string; cls?: string }[] = [
    { label: 'Total Received', value: currency(m.value.totalReceived), cls: 'text-brand-600' },
    { label: 'Outstanding Due', value: currency(m.value.outstandingDue), cls: 'text-amber-600' },
  ]
  if (confidential.value) {
    cells.unshift({ label: 'Contract Value', value: currency(props.detail.project.contract_value) })
    cells.push(
      { label: 'Total Cost (Expenses)', value: currency(m.value.totalExpense), cls: 'text-red-600' },
      { label: 'Current Profit', value: currency(m.value.currentProfit), cls: m.value.currentProfit >= 0 ? 'text-brand-600' : 'text-red-600' },
      { label: 'Profit Margin', value: percent(m.value.profitMargin) },
    )
  }
  return cells
})

// Regular (non-vendor) expenses are itemised; vendor bills get their own section.
const regularExpenses = computed(() => props.detail.expenses.filter((e) => !e.vendor_id))
const regularTotal = computed(() => sumBy(regularExpenses.value, (e) => e.amount))
const vendorLines = computed(() =>
  buildProjectVendors(props.detail.project.id, props.vendors, props.detail.expenses, props.detail.vendorPayments),
)
const vendorTotals = computed(() => ({
  bill: sumBy(vendorLines.value, (l) => l.totalBill),
  paid: sumBy(vendorLines.value, (l) => l.paid),
  due: sumBy(vendorLines.value, (l) => l.due),
}))
</script>

<template>
  <article class="print-page mx-auto w-full max-w-[800px] bg-white p-8 text-gray-900">
    <!-- Brand header -->
    <header class="print-keep flex items-start justify-between border-b-2 border-brand-600 pb-5">
      <div class="flex items-center gap-3">
        <BrandMark :size="56" />
        <p class="text-xs text-gray-400">Agency Profit Tracker</p>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold">Project Statement</p>
        <p class="text-xs" :class="confidential ? 'font-semibold text-red-500' : 'text-gray-400'">
          {{ confidential ? 'Internal copy — confidential' : 'Statement of account' }}
        </p>
        <p class="text-xs text-gray-400">Generated {{ generatedOn }}</p>
      </div>
    </header>

    <!-- Project / client meta -->
    <section class="mt-6 grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-xs uppercase tracking-wide text-gray-400">Project</p>
        <p class="font-semibold">{{ detail.project.project_name }}</p>
        <p class="text-gray-500">Started {{ date(detail.project.start_date) }}</p>
      </div>
      <div class="text-right">
        <p class="text-xs uppercase tracking-wide text-gray-400">Client</p>
        <p class="font-semibold">{{ detail.project.client_name }}</p>
        <p class="capitalize text-gray-500">Status: {{ detail.project.status.replace('_', ' ') }}</p>
      </div>
    </section>

    <!-- Financial summary -->
    <section class="print-keep mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Financial Summary</h2>
      <div class="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 sm:grid-cols-3">
        <div v-for="c in summaryCells" :key="c.label" class="bg-white p-3">
          <p class="text-xs text-gray-400">{{ c.label }}</p>
          <p class="text-base font-bold" :class="c.cls">{{ c.value }}</p>
        </div>
      </div>
    </section>

    <!-- Payments -->
    <section class="mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Payments Received</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th class="py-1.5">Date</th><th class="py-1.5">Method</th><th class="py-1.5">Notes</th><th class="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in detail.payments" :key="p.id" class="border-b border-gray-100">
            <td class="py-1.5">{{ date(p.payment_date) }}</td>
            <td class="py-1.5 capitalize">{{ p.payment_method }}</td>
            <td class="py-1.5 text-gray-500">{{ p.notes || '—' }}</td>
            <td class="py-1.5 text-right font-medium text-brand-600">{{ currency(p.amount) }}</td>
          </tr>
          <tr v-if="!detail.payments.length"><td colspan="4" class="py-3 text-center text-gray-400">No payments recorded.</td></tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-200 font-bold"><td colspan="3" class="py-2">Total Received</td><td class="py-2 text-right text-brand-600">{{ currency(paymentsTotal) }}</td></tr>
        </tfoot>
      </table>
    </section>

    <!-- Confidential: cost & vendor payables only on the internal copy -->
    <template v-if="confidential">
    <!-- Regular expenses -->
    <section class="mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Regular Expenses</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th class="py-1.5">Date</th><th class="py-1.5">Category</th><th class="py-1.5">Type</th><th class="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in regularExpenses" :key="e.id" class="border-b border-gray-100">
            <td class="py-1.5">{{ date(e.expense_date) }}</td>
            <td class="py-1.5">{{ e.category }}</td>
            <td class="py-1.5 capitalize text-gray-500">{{ e.type }}</td>
            <td class="py-1.5 text-right font-medium text-red-600">{{ currency(e.amount) }}</td>
          </tr>
          <tr v-if="!regularExpenses.length"><td colspan="4" class="py-3 text-center text-gray-400">No regular expenses.</td></tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-200 font-bold"><td colspan="3" class="py-2">Subtotal</td><td class="py-2 text-right text-red-600">{{ currency(regularTotal) }}</td></tr>
        </tfoot>
      </table>
    </section>

    <!-- Vendor bills & dues -->
    <section v-if="vendorLines.length" class="mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Vendor Bills &amp; Dues</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th class="py-1.5">Vendor</th><th class="py-1.5">Type</th><th class="py-1.5 text-right">Total Bill</th><th class="py-1.5 text-right">Paid</th><th class="py-1.5 text-right">Due</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in vendorLines" :key="l.vendor.id" class="border-b border-gray-100">
            <td class="py-1.5 font-medium">{{ l.vendor.name }}</td>
            <td class="py-1.5 text-gray-500">{{ l.category || '—' }}</td>
            <td class="py-1.5 text-right">{{ currency(l.totalBill) }}</td>
            <td class="py-1.5 text-right text-brand-600">{{ currency(l.paid) }}</td>
            <td class="py-1.5 text-right font-medium" :class="l.due > 0 ? 'text-amber-600' : 'text-gray-400'">{{ currency(l.due) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-200 font-bold">
            <td colspan="2" class="py-2">Totals</td>
            <td class="py-2 text-right">{{ currency(vendorTotals.bill) }}</td>
            <td class="py-2 text-right text-brand-600">{{ currency(vendorTotals.paid) }}</td>
            <td class="py-2 text-right text-amber-600">{{ currency(vendorTotals.due) }}</td>
          </tr>
        </tfoot>
      </table>
    </section>
    </template>

    <footer class="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
      This is a system-generated statement from CINEASTA. Agency Profit Tracker · {{ generatedOn }}
    </footer>
  </article>
</template>
