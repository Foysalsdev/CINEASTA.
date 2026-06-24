<script setup lang="ts">
const projects = useProjectsStore()
const ui = useUiStore()
const { currency, percent } = useFormat()

useHead({ title: 'Projects — CINEASTA' })
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
        <li v-for="p in filtered" :key="p.id">
          <NuxtLink :to="`/projects/${p.id}`" class="card block p-4 transition active:scale-[0.99]">
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
                <p class="text-sm font-semibold text-gray-800">{{ currency(p.metrics.totalReceived, { compact: true }) }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Due</p>
                <p class="text-sm font-semibold text-amber-600">{{ currency(p.metrics.outstandingDue, { compact: true }) }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-wide text-gray-400">Profit</p>
                <p class="text-sm font-semibold" :class="p.metrics.currentProfit >= 0 ? 'text-brand-600' : 'text-red-600'">
                  {{ currency(p.metrics.currentProfit, { compact: true }) }}
                </p>
              </div>
            </div>
            <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div class="h-full rounded-full bg-brand-500" :style="{ width: `${Math.min(100, p.metrics.collectionRate)}%` }" />
            </div>
            <p class="mt-1 text-[11px] text-gray-400">
              {{ percent(p.metrics.collectionRate) }} collected · margin {{ percent(p.metrics.profitMargin) }}
            </p>
          </NuxtLink>
        </li>
      </ul>
    </StateBlock>
  </div>
</template>
