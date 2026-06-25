<script setup lang="ts">
import { recent, sumBy } from '~/utils/calculations'

const payments = usePaymentsStore()
const projects = useProjectsStore()
const ui = useUiStore()
const { currency, date } = useFormat()

onMounted(() => Promise.all([payments.fetch(), projects.fetch()]))

const projectName = (id: string) =>
  projects.items.find((p) => p.id === id)?.project_name ?? 'Project'
const sorted = computed(() => recent(payments.items, 'payment_date', payments.items.length))
const total = computed(() => sumBy(payments.items, (p) => p.amount))
</script>

<template>
  <div class="space-y-4">
    <KpiCard label="Total Received" :value="currency(total)" tone="positive" :sub="`${payments.items.length} payments`" />
    <StateBlock
      :loading="payments.loading && !payments.items.length"
      :error="payments.error"
      :empty="payments.loaded && !payments.items.length"
      empty-title="No payments yet"
      empty-hint="Record a client payment to see it here."
      @retry="payments.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="ui.openQuickAdd('payment')">+ Record payment</button>
      </template>
      <ul class="card divide-y divide-gray-100">
        <li v-for="p in sorted" :key="p.id" class="flex items-center justify-between p-4">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-gray-800">{{ projectName(p.project_id) }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ date(p.payment_date) }} · {{ p.payment_method }}</p>
          </div>
          <span class="shrink-0 text-sm font-semibold text-brand-600">+{{ currency(p.amount) }}</span>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
