<script setup lang="ts">
const route = useRoute()
const router = useRouter()
useHead({ title: 'Bulk Entry — CINEASTA.' })

type Mode = 'expenses' | 'payments' | 'vendor' | 'csv'
const tabs: { value: Mode; label: string }[] = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'payments', label: 'Payments' },
  { value: 'vendor', label: 'Vendors' },
  { value: 'csv', label: 'CSV' },
]
function normalize(q: unknown): Mode {
  const v = String(q || 'expenses')
  return (tabs.some((t) => t.value === v) ? v : 'expenses') as Mode
}
const mode = ref<Mode>(normalize(route.query.mode))
watch(mode, (m) => router.replace({ query: { mode: m } }))
watch(
  () => route.query.mode,
  (q) => {
    mode.value = normalize(q)
  },
)

// After a successful batch, reset back to a fresh form by remounting the child.
const formKey = ref(0)
function onDone() {
  formKey.value++
}
</script>

<template>
  <div class="space-y-4">
    <NuxtLink to="/more" class="inline-flex items-center gap-1 text-sm text-gray-500">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      More
    </NuxtLink>
    <h1 class="text-xl font-bold text-gray-900">Bulk Entry</h1>

    <div class="flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="flex-1 rounded-lg py-2 transition"
        :class="mode === t.value ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'"
        @click="mode = t.value"
      >{{ t.label }}</button>
    </div>

    <BulkExpenses v-if="mode === 'expenses'" :key="`e${formKey}`" @done="onDone" />
    <BulkPayments v-else-if="mode === 'payments'" :key="`p${formKey}`" @done="onDone" />
    <BulkVendorPayments v-else-if="mode === 'vendor'" :key="`v${formKey}`" @done="onDone" />
    <BulkCsvImport v-else :key="`c${formKey}`" @done="onDone" />
  </div>
</template>
