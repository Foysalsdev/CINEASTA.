<script setup lang="ts">
const projects = useProjectsStore()
const ui = useUiStore()
const { currency, percent } = useFormat()

useHead({ title: 'Projects — CINEASTA.' })
await useAsyncData('projects', () => projects.fetch().then(() => true))

const query = ref('')
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return projects.items
  return projects.items.filter(
    (p) =>
      p.project_name.toLowerCase().includes(q) || p.client_name.toLowerCase().includes(q),
  )
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Projects</h1>
      <NuxtLink to="/clients" class="text-sm font-medium text-brand-600">Clients →</NuxtLink>
    </div>

    <input v-model="query" class="field-input" placeholder="Search projects or clients…" />

    <StateBlock
      :loading="projects.loading && !projects.items.length"
      :error="projects.error"
      :empty="projects.loaded && !filtered.length"
      empty-title="No projects"
      empty-hint="Create your first project to start tracking profit."
      @retry="projects.fetch(true)"
    >
      <template #empty-action>
        <button class="btn-primary mt-2" @click="ui.openQuickAdd('project')">+ New project</button>
      </template>

      <ul class="space-y-3">
        <li v-for="p in filtered" :key="p.id" class="card overflow-hidden">
          <NuxtLink :to="`/projects/${p.id}`" class="block p-4 transition active:bg-gray-50">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate font-semibold text-gray-900">{{ p.project_name }}</p>
                <p class="truncate text-xs text-gray-400">{{ p.client_name }}</p>
              </div>
              <StatusBadge :status="p.status" />
            </div>
            <div class="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Received</p>
                <p class="text-sm font-semibold text-gray-800">{{ currency(p.metrics.totalReceived) }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Cost</p>
                <p class="text-sm font-semibold text-red-600">{{ currency(p.metrics.totalExpense) }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Profit</p>
                <p class="text-sm font-semibold" :class="p.metrics.currentProfit >= 0 ? 'text-brand-600' : 'text-red-600'">
                  {{ currency(p.metrics.currentProfit) }}
                </p>
              </div>
            </div>
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div class="h-full rounded-full bg-brand-500" :style="{ width: `${Math.min(100, p.metrics.collectionRate)}%` }" />
            </div>
            <p class="mt-1 text-[11px] text-gray-400">
              Due {{ currency(p.metrics.outstandingDue) }} · {{ percent(p.metrics.collectionRate) }} collected · margin {{ percent(p.metrics.profitMargin) }}
            </p>
          </NuxtLink>
          <!-- Action row -->
          <div class="flex divide-x divide-gray-100 border-t border-gray-100 text-sm font-medium">
            <NuxtLink :to="`/projects/${p.id}`" class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-gray-600 active:bg-gray-50">
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              Details
            </NuxtLink>
            <NuxtLink :to="`/projects/${p.id}/statement`" class="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-brand-700 active:bg-brand-50">
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z" stroke-linecap="round" stroke-linejoin="round"/></svg>
              PDF / Print
            </NuxtLink>
          </div>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
