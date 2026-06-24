<script setup lang="ts">
const route = useRoute()
const id = computed(() => String(route.params.id))

const projects = useProjectsStore()
const dashboard = useDashboardStore()
const { currency, percent, date } = useFormat()

await useAsyncData(`project-${id.value}`, () => projects.fetchOne(id.value).then(() => true))

const detail = computed(() => projects.current)
const m = computed(() => detail.value?.project.metrics)

useHead(() => ({ title: `${detail.value?.project.project_name ?? 'Project'} — CINEASTA` }))

const tab = ref<'overview' | 'payments' | 'expenses'>('overview')

// Scoped quick-add modal for this project.
const adding = ref<null | 'payment' | 'expense'>(null)
async function onSaved() {
  adding.value = null
  await Promise.all([projects.fetchOne(id.value), projects.fetch(true), dashboard.fetch(true)])
}

const summary = computed(() => {
  if (!m.value || !detail.value) return []
  return [
    { label: 'Contract', value: currency(detail.value.project.contract_value) },
    { label: 'Received', value: currency(m.value.totalReceived) },
    { label: 'Due', value: currency(m.value.outstandingDue) },
    { label: 'Expenses', value: currency(m.value.totalExpense) },
    { label: 'Profit', value: currency(m.value.currentProfit) },
    { label: 'Margin', value: percent(m.value.profitMargin) },
  ]
})
</script>

<template>
  <div class="space-y-4">
    <NuxtLink to="/projects" class="inline-flex items-center gap-1 text-sm text-gray-500">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      Projects
    </NuxtLink>

    <StateBlock :loading="projects.detailLoading && !detail" :error="projects.error" :rows="5" @retry="projects.fetchOne(id)">
      <template v-if="detail && m">
        <div class="flex items-start justify-between gap-2">
          <div>
            <h1 class="text-xl font-bold text-gray-900">{{ detail.project.project_name }}</h1>
            <p class="text-sm text-gray-400">{{ detail.project.client_name }} · started {{ date(detail.project.start_date) }}</p>
          </div>
          <StatusBadge :status="detail.project.status" />
        </div>

        <!-- Summary grid -->
        <section class="grid grid-cols-3 gap-2">
          <div v-for="s in summary" :key="s.label" class="card p-3 text-center">
            <p class="text-[10px] uppercase tracking-wide text-gray-400">{{ s.label }}</p>
            <p class="mt-0.5 text-sm font-bold text-gray-900">{{ s.value }}</p>
          </div>
        </section>

        <div class="grid grid-cols-2 gap-3">
          <button class="btn-primary" @click="adding = 'payment'">+ Payment</button>
          <button class="btn-ghost" @click="adding = 'expense'">+ Expense</button>
        </div>

        <!-- Tabs -->
        <div class="flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
          <button
            v-for="t in (['overview', 'payments', 'expenses'] as const)"
            :key="t"
            class="flex-1 rounded-lg py-1.5 capitalize transition"
            :class="tab === t ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'"
            @click="tab = t"
          >{{ t }}</button>
        </div>

        <!-- Overview -->
        <SectionCard v-if="tab === 'overview'" title="Profit Breakdown">
          <dl class="divide-y divide-gray-100 text-sm">
            <div class="flex justify-between py-2"><dt class="text-gray-500">Expected Profit</dt><dd class="font-semibold">{{ currency(m.expectedProfit) }}</dd></div>
            <div class="flex justify-between py-2"><dt class="text-gray-500">Current Profit</dt><dd class="font-semibold" :class="m.currentProfit >= 0 ? 'text-brand-600' : 'text-red-600'">{{ currency(m.currentProfit) }}</dd></div>
            <div class="flex justify-between py-2"><dt class="text-gray-500">Profit Margin</dt><dd class="font-semibold">{{ percent(m.profitMargin) }}</dd></div>
            <div class="flex justify-between py-2"><dt class="text-gray-500">Collection Rate</dt><dd class="font-semibold">{{ percent(m.collectionRate) }}</dd></div>
          </dl>
        </SectionCard>

        <!-- Payments -->
        <SectionCard v-else-if="tab === 'payments'" :title="`Payments (${detail.payments.length})`">
          <ul v-if="detail.payments.length" class="divide-y divide-gray-100">
            <li v-for="p in detail.payments" :key="p.id" class="flex items-center justify-between py-2.5">
              <div><p class="text-sm font-medium text-gray-800">{{ date(p.payment_date) }}</p><p class="text-xs text-gray-400 capitalize">{{ p.payment_method }}<span v-if="p.notes"> · {{ p.notes }}</span></p></div>
              <span class="text-sm font-semibold text-brand-600">+{{ currency(p.amount) }}</span>
            </li>
          </ul>
          <p v-else class="py-6 text-center text-sm text-gray-400">No payments recorded.</p>
        </SectionCard>

        <!-- Expenses -->
        <SectionCard v-else title="Expenses" :subtitle="`${detail.expenses.length} entries`">
          <ul v-if="detail.expenses.length" class="divide-y divide-gray-100">
            <li v-for="e in detail.expenses" :key="e.id" class="flex items-center justify-between py-2.5">
              <div><p class="text-sm font-medium text-gray-800">{{ e.category }}</p><p class="text-xs text-gray-400">{{ date(e.expense_date) }}<span v-if="e.notes"> · {{ e.notes }}</span></p></div>
              <span class="text-sm font-semibold text-red-600">-{{ currency(e.amount) }}</span>
            </li>
          </ul>
          <p v-else class="py-6 text-center text-sm text-gray-400">No expenses recorded.</p>
        </SectionCard>

        <AppModal v-if="adding === 'payment'" title="Record Payment" @close="adding = null">
          <PaymentForm :default-project-id="id" @saved="onSaved" @cancel="adding = null" />
        </AppModal>
        <AppModal v-if="adding === 'expense'" title="Add Expense" @close="adding = null">
          <ExpenseForm :default-project-id="id" @saved="onSaved" @cancel="adding = null" />
        </AppModal>
      </template>
    </StateBlock>
  </div>
</template>
