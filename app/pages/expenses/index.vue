<script setup lang="ts">
import { recent, totalExpense, totalExpensePaid, totalExpenseDue, num } from '~/utils/calculations'

const expenses = useExpensesStore()
const projects = useProjectsStore()
const ui = useUiStore()
const { currency, date } = useFormat()

useHead({ title: 'Expenses — CINEASTA' })
await useAsyncData('expenses', () =>
  Promise.all([expenses.fetch(), projects.fetch()]).then(() => true),
)

const projectName = (id: string) =>
  projects.items.find((p) => p.id === id)?.project_name ?? 'Project'
const sorted = computed(() => recent(expenses.items, 'expense_date', expenses.items.length))
const bill = computed(() => totalExpense(expenses.items))
const paid = computed(() => totalExpensePaid(expenses.items))
const due = computed(() => totalExpenseDue(expenses.items))
const rowDue = (e: { total_bill: number; paid: number }) => Math.max(0, num(e.total_bill) - num(e.paid))
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Expenses</h1>
      <button class="btn-primary !py-1.5 !px-3 text-xs" @click="ui.openQuickAdd('expense')">+ Add</button>
    </div>

    <!-- Bill / Paid / Due summary -->
    <section class="grid grid-cols-3 gap-3">
      <KpiCard label="Total Bill" :value="currency(bill)" tone="negative" />
      <KpiCard label="Paid" :value="currency(paid)" />
      <KpiCard label="Due (baki)" :value="currency(due)" tone="warning" />
    </section>

    <StateBlock
      :loading="expenses.loading && !expenses.items.length"
      :error="expenses.error"
      :empty="expenses.loaded && !expenses.items.length"
      empty-title="No expenses yet"
      empty-hint="Add a vendor bill to see it here."
      @retry="expenses.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="ui.openQuickAdd('expense')">+ Add bill</button>
      </template>
      <ul class="card divide-y divide-gray-100">
        <li v-for="e in sorted" :key="e.id" class="p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-gray-800">{{ e.vendor || e.category }}</p>
              <p class="truncate text-xs text-gray-400">{{ e.category }} · {{ projectName(e.project_id) }} · {{ date(e.expense_date) }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p class="text-sm font-semibold text-gray-800">{{ currency(e.total_bill) }}</p>
              <p class="text-[11px]" :class="rowDue(e) > 0 ? 'text-amber-600' : 'text-brand-600'">
                {{ rowDue(e) > 0 ? `Due ${currency(rowDue(e))}` : 'Paid' }}
              </p>
            </div>
          </div>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
