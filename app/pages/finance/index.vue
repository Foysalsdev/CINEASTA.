<script setup lang="ts">
type Tab = 'payments' | 'expenses' | 'vendors'
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

useHead({ title: 'Finance — CINEASTA.' })

const valid: Tab[] = ['payments', 'expenses', 'vendors']
const tab = ref<Tab>((valid.includes(route.query.tab as Tab) ? route.query.tab : 'payments') as Tab)
watch(tab, (t) => router.replace({ query: { tab: t } }))

const addAction: Record<Tab, () => void> = {
  payments: () => ui.openQuickAdd('payment'),
  expenses: () => ui.openQuickAdd('expense'),
  vendors: () => ui.openQuickAdd('vendor'),
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Finance</h1>
      <button class="btn-primary !py-1.5 !px-3 text-xs" @click="addAction[tab]()">+ Add</button>
    </div>

    <!-- sub-tabs -->
    <div class="flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
      <button
        v-for="t in valid"
        :key="t"
        class="flex-1 rounded-lg py-2.5 capitalize transition"
        :class="tab === t ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'"
        @click="tab = t"
      >{{ t }}</button>
    </div>

    <PaymentsTab v-if="tab === 'payments'" />
    <ExpensesTab v-else-if="tab === 'expenses'" />
    <VendorsTab v-else />
  </div>
</template>
