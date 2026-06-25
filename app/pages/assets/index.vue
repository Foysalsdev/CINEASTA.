<script setup lang="ts">
import { sumBy } from '~/utils/calculations'

const assets = useAssetsStore()
const { currency, date } = useFormat()
const ui = useUiStore()

useHead({ title: 'Assets — CINEASTA.' })
await useAsyncData('assets', () => assets.fetch().then(() => true))

const adding = ref(false)
const total = computed(() => sumBy(assets.items, (a) => a.purchase_value))
async function onSaved() {
  adding.value = false
  await assets.fetch(true)
}
</script>

<template>
  <div class="space-y-4">
    <NuxtLink to="/more" class="inline-flex items-center gap-1 text-sm text-gray-500">
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      More
    </NuxtLink>
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Assets</h1>
      <button class="btn-primary !py-1.5 !px-3 text-xs" @click="adding = true">+ Add</button>
    </div>

    <KpiCard label="Total Asset Value" :value="currency(total)" :sub="`${assets.items.length} assets`" />

    <StateBlock
      :loading="assets.loading && !assets.items.length"
      :error="assets.error"
      :empty="assets.loaded && !assets.items.length"
      empty-title="No assets yet"
      empty-hint="Register equipment you own."
      @retry="assets.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="adding = true">+ Add asset</button>
      </template>
      <ul class="card divide-y divide-gray-100">
        <li v-for="a in assets.items" :key="a.id" class="flex items-center justify-between p-4">
          <div class="min-w-0">
            <p class="truncate font-medium text-gray-900">{{ a.name }}</p>
            <p class="truncate text-xs text-gray-400">{{ a.category || '—' }} · bought {{ date(a.purchase_date) }}</p>
          </div>
          <span class="shrink-0 text-sm font-semibold text-gray-800">{{ currency(a.purchase_value) }}</span>
        </li>
      </ul>
    </StateBlock>

    <AppModal v-if="adding" title="Add Asset" @close="adding = false">
      <AssetForm @saved="onSaved" @cancel="adding = false" />
    </AppModal>
  </div>
</template>
