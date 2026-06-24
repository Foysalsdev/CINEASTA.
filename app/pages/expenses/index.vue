<script setup lang="ts">
import { recent, sumBy } from '~/utils/calculations'

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
const total = computed(() => sumBy(expenses.items, (e) => e.amount))
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Expenses</h1>
      <button class="btn-primary !py-1.5 !px-3 text-xs" @click="ui.openQuickAdd('expense')">+ Add</button>
    </div>

    <KpiCard label="Total Spent" :value="currency(total)" tone="negative" :sub="`${expenses.items.length} expenses`" />

    <StateBlock
      :loading="expenses.loading && !expenses.items.length"
      :error="expenses.error"
      :empty="expenses.loaded && !expenses.items.length"
      empty-title="No expenses yet"
      empty-hint="Add an expense to see it here."
      @retry="expenses.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="ui.openQuickAdd('expense')">+ Add expense</button>
      </template>
      <ul class="card divide-y divide-gray-100">
        <li v-for="e in sorted" :key="e.id" class="flex items-center justify-between p-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-800">{{ projectName(e.project_id) }}</p>
            <p class="text-xs text-gray-400">{{ date(e.expense_date) }} · {{ e.category }}</p>
          </div>
          <span class="shrink-0 text-sm font-semibold text-red-600">-{{ currency(e.amount) }}</span>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
