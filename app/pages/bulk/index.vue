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

    <div v-else class="card flex flex-col items-center gap-3 p-10 text-center">
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </div>
      <p class="text-sm font-semibold text-gray-700">CSV Import — coming next</p>
      <p class="max-w-xs text-sm text-gray-400">
        For now use the multi-row tabs above to add many entries at once.
      </p>
    </div>
  </div>
</template>
