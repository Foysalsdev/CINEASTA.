<script setup lang="ts">
import { buildProjectVendors } from '~/utils/calculations'

const route = useRoute()
const id = computed(() => String(route.params.id))

const projects = useProjectsStore()
const vendors = useVendorsStore()
const dashboard = useDashboardStore()
const { currency, percent, date } = useFormat()

await useAsyncData(`project-${id.value}`, () =>
  Promise.all([projects.fetchOne(id.value), vendors.fetch()]).then(() => true),
)

const detail = computed(() => projects.current)
const m = computed(() => detail.value?.project.metrics)

useHead(() => ({ title: `${detail.value?.project.project_name ?? 'Project'} — CINEASTA` }))

const tab = ref<'overview' | 'payments' | 'expenses' | 'vendors'>('overview')

// Regular (non-vendor) expenses; vendor bills live in the Vendors tab.
const regularExpenses = computed(() => (detail.value?.expenses ?? []).filter((e) => !e.vendor_id))
const vendorLines = computed(() =>
  detail.value ? buildProjectVendors(id.value, vendors.items, detail.value.expenses, detail.value.vendorPayments) : [],
)

// Scoped quick-add modal for this project.
const adding = ref<null | 'payment' | 'choose' | 'expense' | 'vendor'>(null)
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

        <!-- Branded statement / PDF -->
        <NuxtLink :to="`/projects/${id}/statement`" class="btn-ghost w-full !bg-white ring-1 ring-gray-200">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Statement / PDF
        </NuxtLink>

        <!-- Tabs -->
        <div class="flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
          <button
            v-for="t in (['overview', 'payments', 'expenses', 'vendors'] as const)"
            :key="t"
            class="flex-1 rounded-lg py-2.5 capitalize transition"
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
            <li v-for="p in detail.payments" :key="p.id" class="py-2.5">
              <div class="flex items-center justify-between">
                <div><p class="text-sm font-medium text-gray-800">{{ date(p.payment_date) }}</p><p class="text-xs text-gray-400 capitalize">{{ p.payment_method }}<span v-if="p.notes"> · {{ p.notes }}</span></p></div>
                <span class="text-sm font-semibold text-brand-600">+{{ currency(p.amount) }}</span>
              </div>
              <AttachmentChips :items="p.attachments" />
            </li>
          </ul>
          <p v-else class="py-6 text-center text-sm text-gray-400">No payments recorded.</p>
        </SectionCard>

        <!-- Regular expenses (vendor bills are under the Vendors tab) -->
        <SectionCard v-else-if="tab === 'expenses'" title="Regular Expenses" :subtitle="`Total cost ${currency(m.totalExpense)}`">
          <ul v-if="regularExpenses.length" class="divide-y divide-gray-100">
            <li v-for="e in regularExpenses" :key="e.id" class="py-2.5">
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-gray-800">{{ e.category }}</p>
                  <p class="truncate text-xs text-gray-400 capitalize">{{ e.type }} · {{ date(e.expense_date) }}</p>
                </div>
                <span class="shrink-0 text-sm font-semibold text-red-600">-{{ currency(e.amount) }}</span>
              </div>
              <AttachmentChips :items="e.attachments" />
            </li>
          </ul>
          <p v-else class="py-6 text-center text-sm text-gray-400">No regular expenses. Vendor bills are in the Vendors tab.</p>
        </SectionCard>

        <!-- Vendors: per-vendor Total Bill, payments & due -->
        <ProjectVendors v-else :project-id="id" :lines="vendorLines" @changed="onSaved" />

        <!-- spacer so the sticky action bar never hides the last row -->
        <div class="h-16" />

        <!-- Sticky, thumb-reachable scoped actions for this project.
             Right padding keeps clear of the global Quick-Add FAB. -->
        <div class="bottom-nav-offset fixed inset-x-0 z-30 mb-3 px-4 lg:bottom-3 lg:pl-60">
          <div class="mx-auto flex max-w-md gap-2 pr-[4.25rem]">
            <button class="btn-primary flex-1 shadow-lg shadow-brand-600/20" @click="adding = 'payment'">+ Payment</button>
            <button class="btn-ghost flex-1 !bg-white shadow-lg ring-1 ring-gray-200" @click="adding = 'choose'">+ Expense</button>
          </div>
        </div>

        <AppModal v-if="adding === 'payment'" title="Record Payment" @close="adding = null">
          <PaymentForm :default-project-id="id" @saved="onSaved" @cancel="adding = null" />
        </AppModal>

        <!-- Expense kind chooser: Regular vs Vendor Payment -->
        <AppModal v-if="adding === 'choose'" title="Add Expense" @close="adding = null">
          <div class="space-y-3">
            <button class="w-full rounded-xl bg-gray-100 p-4 text-left active:scale-[0.99]" @click="adding = 'expense'">
              <p class="text-sm font-semibold text-gray-900">Regular Expense</p>
              <p class="text-xs text-gray-500">A direct cost — transport, food, crew… with a receipt.</p>
            </button>
            <button class="w-full rounded-xl bg-brand-50 p-4 text-left active:scale-[0.99]" @click="adding = 'vendor'">
              <p class="text-sm font-semibold text-brand-700">Vendor Payment</p>
              <p class="text-xs text-brand-600/80">Set a vendor's Total Bill and track payments &amp; due.</p>
            </button>
          </div>
        </AppModal>

        <AppModal v-if="adding === 'expense'" title="Regular Expense" @close="adding = null">
          <ExpenseForm :default-project-id="id" regular-only @saved="onSaved" @cancel="adding = null" />
        </AppModal>
        <AppModal v-if="adding === 'vendor'" title="Add Vendor to Project" @close="adding = null">
          <ProjectVendorSetupForm
            :project-id="id"
            :existing-vendor-ids="vendorLines.map((l) => l.vendor.id)"
            @saved="onSaved"
            @cancel="adding = null"
          />
        </AppModal>
      </template>
    </StateBlock>
  </div>
</template>
