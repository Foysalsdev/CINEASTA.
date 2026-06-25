<script setup lang="ts">
import type { ProjectDetail } from '~/repositories'
import { sumBy } from '~/utils/calculations'

const props = defineProps<{ detail: ProjectDetail }>()
const { currency, percent, date } = useFormat()

const m = computed(() => props.detail.project.metrics)
const generatedOn = new Date().toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const paymentsTotal = computed(() => sumBy(props.detail.payments, (p) => p.amount))
const billTotal = computed(() => sumBy(props.detail.expenses, (e) => e.total_bill))
const paidTotal = computed(() => sumBy(props.detail.expenses, (e) => e.paid))
const dueTotal = computed(() =>
  sumBy(props.detail.expenses, (e) => Math.max(0, e.total_bill - e.paid)),
)
</script>

<template>
  <article class="print-page mx-auto w-full max-w-[800px] bg-white p-8 text-gray-900">
    <!-- Brand header -->
    <header class="flex items-start justify-between border-b-2 border-brand-600 pb-5">
      <div class="flex items-center gap-3">
        <BrandMark :size="56" />
        <p class="text-xs text-gray-400">Agency Profit Tracker</p>
      </div>
      <div class="text-right">
        <p class="text-lg font-bold">Project Statement</p>
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
    <section class="mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Financial Summary</h2>
      <div class="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 sm:grid-cols-3">
        <div class="bg-white p-3"><p class="text-xs text-gray-400">Contract Value</p><p class="text-base font-bold">{{ currency(detail.project.contract_value) }}</p></div>
        <div class="bg-white p-3"><p class="text-xs text-gray-400">Total Received</p><p class="text-base font-bold text-brand-600">{{ currency(m.totalReceived) }}</p></div>
        <div class="bg-white p-3"><p class="text-xs text-gray-400">Outstanding Due</p><p class="text-base font-bold text-amber-600">{{ currency(m.outstandingDue) }}</p></div>
        <div class="bg-white p-3"><p class="text-xs text-gray-400">Total Cost (Expenses)</p><p class="text-base font-bold text-red-600">{{ currency(m.totalExpense) }}</p></div>
        <div class="bg-white p-3"><p class="text-xs text-gray-400">Current Profit</p><p class="text-base font-bold" :class="m.currentProfit >= 0 ? 'text-brand-600' : 'text-red-600'">{{ currency(m.currentProfit) }}</p></div>
        <div class="bg-white p-3"><p class="text-xs text-gray-400">Profit Margin</p><p class="text-base font-bold">{{ percent(m.profitMargin) }}</p></div>
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

    <!-- Expenses / bills -->
    <section class="mt-6">
      <h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Expenses / Bills</h2>
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-400">
            <th class="py-1.5">Date</th><th class="py-1.5">Category</th><th class="py-1.5">Vendor</th>
            <th class="py-1.5 text-right">Bill</th><th class="py-1.5 text-right">Paid</th><th class="py-1.5 text-right">Due</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in detail.expenses" :key="e.id" class="border-b border-gray-100">
            <td class="py-1.5">{{ date(e.expense_date) }}</td>
            <td class="py-1.5">{{ e.category }}</td>
            <td class="py-1.5 text-gray-500">{{ e.vendor || '—' }}</td>
            <td class="py-1.5 text-right font-medium">{{ currency(e.total_bill) }}</td>
            <td class="py-1.5 text-right text-gray-500">{{ currency(e.paid) }}</td>
            <td class="py-1.5 text-right font-medium" :class="Math.max(0, e.total_bill - e.paid) > 0 ? 'text-amber-600' : 'text-brand-600'">{{ currency(Math.max(0, e.total_bill - e.paid)) }}</td>
          </tr>
          <tr v-if="!detail.expenses.length"><td colspan="6" class="py-3 text-center text-gray-400">No expenses recorded.</td></tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-200 font-bold">
            <td colspan="3" class="py-2">Totals</td>
            <td class="py-2 text-right text-red-600">{{ currency(billTotal) }}</td>
            <td class="py-2 text-right">{{ currency(paidTotal) }}</td>
            <td class="py-2 text-right text-amber-600">{{ currency(dueTotal) }}</td>
          </tr>
        </tfoot>
      </table>
    </section>

    <footer class="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400">
      This is a system-generated statement from CINEASTA Agency Profit Tracker · {{ generatedOn }}
    </footer>
  </article>
</template>
