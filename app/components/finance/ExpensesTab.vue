<script setup lang="ts">
import type { Expense, ExpenseType } from '~/types'
import { recent, sumBy } from '~/utils/calculations'
import { EXPENSE_TYPE_LABEL } from '~/utils/constants'

const expenses = useExpensesStore()
const projects = useProjectsStore()
const vendors = useVendorsStore()
const ui = useUiStore()
const { currency, date } = useFormat()

onMounted(() => Promise.all([expenses.fetch(), projects.fetch(), vendors.fetch()]))

const projectName = (id: string) => projects.items.find((p) => p.id === id)?.project_name
const vendorName = (id: string) => vendors.items.find((v) => v.id === id)?.name

const filter = ref<'all' | ExpenseType>('all')
const filters: { value: 'all' | ExpenseType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'project', label: 'Project' },
  { value: 'internal', label: 'Internal' },
  { value: 'asset', label: 'Asset' },
  { value: 'maintenance', label: 'Maintenance' },
]

const list = computed(() => {
  const all = recent(expenses.items, 'expense_date', expenses.items.length)
  return filter.value === 'all' ? all : all.filter((e) => e.type === filter.value)
})
const total = computed(() => sumBy(list.value, (e) => e.amount))
const subtitle = (e: Expense) =>
  [EXPENSE_TYPE_LABEL[e.type], vendorName(e.vendor_id), projectName(e.project_id)]
    .filter(Boolean)
    .join(' · ')
</script>

<template>
  <div class="space-y-4">
    <KpiCard label="Total Expense" :value="currency(total)" tone="negative" :sub="`${list.length} entries`" />

    <!-- type filter chips -->
    <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        v-for="f in filters"
        :key="f.value"
        class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition"
        :class="filter === f.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'"
        @click="filter = f.value"
      >{{ f.label }}</button>
    </div>

    <StateBlock
      :loading="expenses.loading && !expenses.items.length"
      :error="expenses.error"
      :empty="expenses.loaded && !list.length"
      empty-title="No expenses"
      empty-hint="Add an expense to see it here."
      @retry="expenses.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="ui.openQuickAdd('expense')">+ Add expense</button>
      </template>
      <ul class="card divide-y divide-gray-100">
        <li v-for="e in list" :key="e.id" class="flex items-center justify-between gap-2 p-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-800">{{ e.category }}</p>
            <p class="truncate text-xs text-gray-400">{{ subtitle(e) }} · {{ date(e.expense_date) }}</p>
          </div>
          <span class="shrink-0 text-sm font-semibold text-red-600">-{{ currency(e.amount) }}</span>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
