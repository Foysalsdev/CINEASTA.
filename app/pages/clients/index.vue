<script setup lang="ts">
const clients = useClientsStore()
const ui = useUiStore()
const { date } = useFormat()

useHead({ title: 'Clients — CINEASTA.' })
await useAsyncData('clients', () => clients.fetch().then(() => true))
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Clients</h1>
      <button class="btn-primary !py-1.5 !px-3 text-xs" @click="ui.openQuickAdd('client')">+ Add</button>
    </div>

    <StateBlock
      :loading="clients.loading && !clients.items.length"
      :error="clients.error"
      :empty="clients.loaded && !clients.items.length"
      empty-title="No clients yet"
      empty-hint="Add your first client to start creating projects."
      @retry="clients.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="ui.openQuickAdd('client')">+ Add client</button>
      </template>
      <ul class="card divide-y divide-gray-100">
        <li v-for="c in clients.items" :key="c.id" class="p-4">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-gray-900">{{ c.name }}</p>
            <span class="text-xs text-gray-400">since {{ date(c.created_at) }}</span>
          </div>
          <p v-if="c.phone || c.email" class="mt-0.5 text-xs text-gray-500">
            <span v-if="c.phone">{{ c.phone }}</span>
            <span v-if="c.phone && c.email"> · </span>
            <span v-if="c.email">{{ c.email }}</span>
          </p>
          <p v-if="c.notes" class="mt-1 text-xs text-gray-400">{{ c.notes }}</p>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
