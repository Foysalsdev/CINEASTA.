<script setup lang="ts">
const ui = useUiStore()
const dashboard = useDashboardStore()
const projects = useProjectsStore()
const reports = useReportsStore()
const expenses = useExpensesStore()
const payments = usePaymentsStore()
const vendors = useVendorsStore()

const titles: Record<string, string> = {
  menu: 'Quick Add',
  payment: 'Record Payment',
  expense: 'Add Expense',
  project: 'New Project',
  client: 'Add Client',
  vendor: 'Add Vendor',
}

const menu = [
  { view: 'payment', label: 'Payment', hint: 'Money received', color: 'bg-brand-50 text-brand-700' },
  { view: 'expense', label: 'Expense', hint: 'Money spent', color: 'bg-amber-50 text-amber-700' },
  { view: 'project', label: 'Project', hint: 'New engagement', color: 'bg-blue-50 text-blue-700' },
  { view: 'vendor', label: 'Vendor', hint: 'New supplier', color: 'bg-emerald-50 text-emerald-700' },
  { view: 'client', label: 'Client', hint: 'New customer', color: 'bg-purple-50 text-purple-700' },
] as const

// Anything that changes money invalidates derived views.
async function onSaved() {
  ui.closeQuickAdd()
  await Promise.all([
    dashboard.fetch(true),
    projects.fetch(true),
    reports.fetchAll(true),
    expenses.fetch(true),
    payments.fetch(true),
    vendors.fetch(true),
  ])
}
</script>

<template>
  <AppModal
    v-if="ui.quickAdd"
    :title="titles[ui.quickAdd] || 'Quick Add'"
    @close="ui.closeQuickAdd()"
  >
    <div v-if="ui.quickAdd === 'menu'" class="grid grid-cols-2 gap-3">
      <button
        v-for="m in menu"
        :key="m.view"
        class="flex flex-col items-start gap-1 rounded-2xl p-4 text-left transition active:scale-[0.98]"
        :class="m.color"
        @click="ui.openQuickAdd(m.view)"
      >
        <span class="text-sm font-bold">{{ m.label }}</span>
        <span class="text-xs opacity-80">{{ m.hint }}</span>
      </button>
    </div>

    <PaymentForm v-else-if="ui.quickAdd === 'payment'" @saved="onSaved" @cancel="ui.openQuickAdd('menu')" />
    <ExpenseForm v-else-if="ui.quickAdd === 'expense'" @saved="onSaved" @cancel="ui.openQuickAdd('menu')" />
    <ProjectForm v-else-if="ui.quickAdd === 'project'" @saved="onSaved" @cancel="ui.openQuickAdd('menu')" />
    <VendorForm v-else-if="ui.quickAdd === 'vendor'" @saved="onSaved" @cancel="ui.openQuickAdd('menu')" />
    <ClientForm v-else-if="ui.quickAdd === 'client'" @saved="onSaved" @cancel="ui.openQuickAdd('menu')" />
  </AppModal>
</template>
