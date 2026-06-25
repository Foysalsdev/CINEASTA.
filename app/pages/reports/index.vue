<script setup lang="ts">
const reports = useReportsStore()
const { currency, percent } = useFormat()

useHead({ title: 'Reports — CINEASTA' })
await useAsyncData('reports', () => reports.fetchAll().then(() => true))

const tab = ref<'monthly' | 'projects' | 'clients' | 'dues'>('monthly')
const totalDue = computed(() => reports.vendorDues.reduce((a, r) => a + r.due, 0))
const monthlyTotals = computed(() => ({
  revenue: reports.monthly.reduce((a, m) => a + m.revenue, 0),
  expense: reports.monthly.reduce((a, m) => a + m.expense, 0),
  profit: reports.monthly.reduce((a, m) => a + m.profit, 0),
}))
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold text-gray-900">Reports</h1>

    <div class="flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
      <button
        v-for="t in (['monthly', 'projects', 'clients', 'dues'] as const)"
        :key="t"
        class="flex-1 rounded-lg py-2.5 capitalize transition"
        :class="tab === t ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'"
        @click="tab = t"
      >{{ t }}</button>
    </div>

    <StateBlock :loading="reports.loading && !reports.loaded" :error="reports.error" :rows="6" @retry="reports.fetchAll(true)">
      <!-- Monthly report -->
      <SectionCard v-if="tab === 'monthly'" title="Monthly Report" subtitle="Revenue · Expense · Profit">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-gray-400">
                <th class="py-2 pr-2 font-medium">Month</th>
                <th class="py-2 px-2 text-right font-medium">Revenue</th>
                <th class="py-2 px-2 text-right font-medium">Expense</th>
                <th class="py-2 pl-2 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="m in reports.monthly" :key="m.month">
                <td class="py-2 pr-2 font-medium text-gray-700">{{ m.label }}</td>
                <td class="py-2 px-2 text-right tabular-nums">{{ currency(m.revenue, { compact: true }) }}</td>
                <td class="py-2 px-2 text-right tabular-nums text-red-600">{{ currency(m.expense, { compact: true }) }}</td>
                <td class="py-2 pl-2 text-right font-semibold tabular-nums" :class="m.profit >= 0 ? 'text-brand-600' : 'text-red-600'">{{ currency(m.profit, { compact: true }) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-gray-200 font-bold">
                <td class="py-2 pr-2">Total</td>
                <td class="py-2 px-2 text-right tabular-nums">{{ currency(monthlyTotals.revenue, { compact: true }) }}</td>
                <td class="py-2 px-2 text-right tabular-nums text-red-600">{{ currency(monthlyTotals.expense, { compact: true }) }}</td>
                <td class="py-2 pl-2 text-right tabular-nums text-brand-600">{{ currency(monthlyTotals.profit, { compact: true }) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      <!-- Project profit report -->
      <SectionCard v-else-if="tab === 'projects'" title="Project Profit Report">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-gray-400">
                <th class="py-2 pr-2 font-medium">Project</th>
                <th class="py-2 px-2 text-right font-medium">Rev</th>
                <th class="py-2 px-2 text-right font-medium">Exp</th>
                <th class="py-2 px-2 text-right font-medium">Profit</th>
                <th class="py-2 pl-2 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="r in reports.projectProfit" :key="r.id">
                <td class="max-w-[120px] truncate py-2 pr-2 font-medium text-gray-700">{{ r.project }}</td>
                <td class="py-2 px-2 text-right tabular-nums">{{ currency(r.revenue, { compact: true }) }}</td>
                <td class="py-2 px-2 text-right tabular-nums text-red-600">{{ currency(r.expense, { compact: true }) }}</td>
                <td class="py-2 px-2 text-right font-semibold tabular-nums" :class="r.profit >= 0 ? 'text-brand-600' : 'text-red-600'">{{ currency(r.profit, { compact: true }) }}</td>
                <td class="py-2 pl-2 text-right tabular-nums">{{ percent(r.margin) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <!-- Client revenue report -->
      <SectionCard v-else-if="tab === 'clients'" title="Client Revenue Report">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-gray-400">
                <th class="py-2 pr-2 font-medium">Client</th>
                <th class="py-2 px-2 text-right font-medium">Revenue</th>
                <th class="py-2 pl-2 text-right font-medium">Projects</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="r in reports.clientRevenue" :key="r.id">
                <td class="py-2 pr-2 font-medium text-gray-700">{{ r.client }}</td>
                <td class="py-2 px-2 text-right tabular-nums">{{ currency(r.revenue, { compact: true }) }}</td>
                <td class="py-2 pl-2 text-right tabular-nums">{{ r.projectCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <!-- Vendor dues — "kar koto baki" -->
      <SectionCard v-else title="Vendor Dues" :subtitle="`Total payable: ${currency(totalDue)}`">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-gray-400">
                <th class="py-2 pr-2 font-medium">Vendor</th>
                <th class="py-2 px-2 text-right font-medium">Bill</th>
                <th class="py-2 px-2 text-right font-medium">Paid</th>
                <th class="py-2 pl-2 text-right font-medium">Due</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="r in reports.vendorDues" :key="r.vendor">
                <td class="max-w-[140px] truncate py-2 pr-2 font-medium text-gray-700">{{ r.vendor }}</td>
                <td class="py-2 px-2 text-right tabular-nums">{{ currency(r.totalBill, { compact: true }) }}</td>
                <td class="py-2 px-2 text-right tabular-nums text-gray-500">{{ currency(r.paid, { compact: true }) }}</td>
                <td class="py-2 pl-2 text-right font-semibold tabular-nums" :class="r.due > 0 ? 'text-amber-600' : 'text-brand-600'">{{ currency(r.due, { compact: true }) }}</td>
              </tr>
              <tr v-if="!reports.vendorDues.length"><td colspan="4" class="py-4 text-center text-gray-400">No vendor bills yet.</td></tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </StateBlock>
  </div>
</template>
