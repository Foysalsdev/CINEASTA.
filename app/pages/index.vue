<script setup lang="ts">
import { categoryColor } from '~/utils/constants'

const dashboard = useDashboardStore()
const projects = useProjectsStore()
const ui = useUiStore()
const { currency, percent, date } = useFormat()

useHead({ title: 'Dashboard — CINEASTA' })

await useAsyncData('dashboard', async () => {
  await Promise.all([dashboard.fetch(), projects.fetch()])
  return true
})

const projectName = (id: string) =>
  projects.items.find((p) => p.id === id)?.project_name ?? 'Project'

const d = computed(() => dashboard.data)

const trendSeries = computed(() => [
  { name: 'Revenue', color: '#176a3a', values: d.value?.monthly.map((m) => m.revenue) ?? [] },
  { name: 'Expense', color: '#dc2626', values: d.value?.monthly.map((m) => m.expense) ?? [] },
  { name: 'Profit', color: '#2563eb', values: d.value?.monthly.map((m) => m.profit) ?? [] },
])
const trendLabels = computed(() => d.value?.monthly.map((m) => m.label) ?? [])

const breakdownSlices = computed(
  () =>
    d.value?.expenseBreakdown.map((e) => ({
      label: e.category,
      value: e.amount,
      color: categoryColor(e.category),
    })) ?? [],
)

const topProjects = computed(
  () => d.value?.topProjectsByProfit.map((p) => ({ label: p.name, value: p.value })) ?? [],
)
const topClients = computed(
  () =>
    d.value?.topClientsByRevenue.map((c) => ({
      label: c.name,
      value: c.revenue,
      sub: `${c.projectCount} project${c.projectCount === 1 ? '' : 's'}`,
    })) ?? [],
)
</script>

<template>
  <div class="space-y-5">
    <StateBlock :loading="dashboard.loading && !d" :error="dashboard.error" :rows="6" @retry="dashboard.fetch(true)">
      <template v-if="d">
        <!-- KPI grid -->
        <section class="grid grid-cols-2 gap-3">
          <KpiCard label="Total Revenue" :value="currency(d.kpis.totalRevenue, { compact: true })" tone="positive" />
          <KpiCard label="Total Expense" :value="currency(d.kpis.totalExpense, { compact: true })" tone="negative" />
          <KpiCard
            label="Net Profit"
            :value="currency(d.kpis.netProfit, { compact: true })"
            :tone="d.kpis.netProfit >= 0 ? 'positive' : 'negative'"
          />
          <KpiCard label="Receivable Due" :value="currency(d.kpis.outstandingDue, { compact: true })" tone="warning" sub="clients owe us" />
          <KpiCard label="Payable Due" :value="currency(d.kpis.payableDue, { compact: true })" tone="warning" sub="we owe vendors" />
          <KpiCard label="Collection Rate" :value="percent(d.kpis.collectionRate)" :sub="`${d.kpis.projectCount} projects · ${d.kpis.clientCount} clients`" />
          <KpiCard label="Avg Project Profit" :value="currency(d.kpis.averageProjectProfit, { compact: true })" />
        </section>

        <!-- Monthly trend -->
        <SectionCard title="Monthly Trend" subtitle="Revenue vs Expense vs Profit (last 6 months)">
          <LineChart :labels="trendLabels" :series="trendSeries" />
        </SectionCard>

        <!-- Expense breakdown -->
        <SectionCard title="Expense Breakdown" subtitle="By category">
          <DonutChart v-if="breakdownSlices.length" :data="breakdownSlices" />
          <p v-else class="py-6 text-center text-sm text-gray-400">No expenses recorded yet.</p>
        </SectionCard>

        <!-- Rankings -->
        <div class="grid gap-4">
          <SectionCard title="Top Projects by Profit">
            <BarList v-if="topProjects.length" :data="topProjects" />
            <p v-else class="py-4 text-center text-sm text-gray-400">No projects yet.</p>
          </SectionCard>
          <SectionCard title="Top Clients by Revenue">
            <BarList v-if="topClients.length" :data="topClients" color="#2563eb" />
            <p v-else class="py-4 text-center text-sm text-gray-400">No clients yet.</p>
          </SectionCard>
        </div>

        <!-- Recent activity -->
        <SectionCard title="Recent Payments">
          <ul v-if="d.recentPayments.length" class="divide-y divide-gray-100">
            <li v-for="p in d.recentPayments" :key="p.id" class="flex items-center justify-between py-2.5">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-gray-800">{{ projectName(p.project_id) }}</p>
                <p class="text-xs text-gray-400">{{ date(p.payment_date) }} · {{ p.payment_method }}</p>
              </div>
              <span class="text-sm font-semibold text-brand-600">+{{ currency(p.amount) }}</span>
            </li>
          </ul>
          <p v-else class="py-4 text-center text-sm text-gray-400">No payments yet.</p>
        </SectionCard>

        <SectionCard title="Recent Expenses">
          <ul v-if="d.recentExpenses.length" class="divide-y divide-gray-100">
            <li v-for="e in d.recentExpenses" :key="e.id" class="flex items-center justify-between py-2.5">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-gray-800">{{ projectName(e.project_id) }}</p>
                <p class="text-xs text-gray-400">{{ date(e.expense_date) }} · {{ e.vendor || e.category }}</p>
              </div>
              <span class="text-sm font-semibold text-red-600">-{{ currency(e.total_bill) }}</span>
            </li>
          </ul>
          <p v-else class="py-4 text-center text-sm text-gray-400">No expenses yet.</p>
        </SectionCard>

        <!-- Quick add shortcuts -->
        <div class="grid grid-cols-3 gap-3">
          <button class="btn-primary" @click="ui.openQuickAdd('payment')">+ Payment</button>
          <button class="btn-ghost" @click="ui.openQuickAdd('expense')">+ Expense</button>
          <button class="btn-ghost" @click="ui.openQuickAdd('project')">+ Project</button>
        </div>
      </template>
    </StateBlock>
  </div>
</template>
