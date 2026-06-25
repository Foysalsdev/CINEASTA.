<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const id = computed(() => String(route.params.id))
const projects = useProjectsStore()
const vendors = useVendorsStore()

await useAsyncData(`statement-${id.value}`, () =>
  Promise.all([projects.fetchOne(id.value), vendors.fetch()]).then(() => true),
)
const detail = computed(() => projects.current)

useHead(() => ({
  title: `${detail.value?.project.project_name ?? 'Project'} — Statement`,
}))

// Client copy hides confidential figures (contract, cost, profit, vendor dues).
const mode = ref<'client' | 'internal'>('client')

function printNow() {
  if (import.meta.client) window.print()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 pb-10">
    <!-- Toolbar (hidden when printing) -->
    <div class="no-print sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <NuxtLink :to="`/projects/${id}`" class="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Back
      </NuxtLink>
      <div class="flex items-center gap-2">
        <div class="flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
          <button
            v-for="opt in (['client', 'internal'] as const)"
            :key="opt"
            class="rounded-md px-2.5 py-1.5 capitalize transition"
            :class="mode === opt ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'"
            @click="mode = opt"
          >{{ opt }}</button>
        </div>
        <button class="btn-primary !min-h-[40px] !px-4 text-sm" :disabled="!detail" @click="printNow">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Print / Save as PDF
        </button>
      </div>
    </div>

    <StateBlock :loading="projects.detailLoading && !detail" :error="projects.error" :rows="6" @retry="projects.fetchOne(id)">
      <div v-if="detail" class="px-3 py-4 sm:px-6">
        <div class="mx-auto max-w-[800px] overflow-hidden rounded-2xl shadow-sm">
          <ProjectStatement :detail="detail" :vendors="vendors.items" :mode="mode" />
        </div>
      </div>
    </StateBlock>
  </div>
</template>
