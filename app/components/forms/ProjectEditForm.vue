<script setup lang="ts">
import type { ProjectWithMetrics } from '~/types'

const props = defineProps<{ project: ProjectWithMetrics }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const clients = useClientsStore()
const projects = useProjectsStore()
const ui = useUiStore()

onMounted(() => clients.fetch())

const form = reactive({
  client_id: props.project.client_id,
  project_name: props.project.project_name,
  contract_value: props.project.contract_value,
  start_date: props.project.start_date,
})
const { saving, guard } = useSavingGuard()
const errors = reactive<Record<string, string>>({})

const clientOptions = computed(() =>
  clients.items.map((c) => ({ value: c.id, label: c.name, hint: c.phone })),
)

function validate(): boolean {
  errors.client_id = form.client_id ? '' : 'Select a client'
  errors.project_name = form.project_name.trim() ? '' : 'Project name is required'
  errors.contract_value = form.contract_value >= 0 ? '' : 'Contract value cannot be negative'
  return !errors.client_id && !errors.project_name && !errors.contract_value
}

async function submit() {
  if (!validate()) return
  await guard(async () => {
    try {
      await projects.update(props.project.id, { ...form, contract_value: Number(form.contract_value) || 0 })
      ui.toast('Project updated')
      emit('saved')
    } catch (e) {
      ui.toast(e instanceof Error ? e.message : 'Failed to save', 'error')
    }
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="field-label">Client *</label>
      <Combobox v-model="form.client_id" :options="clientOptions" mode="select" placeholder="Search a client…" />
      <p v-if="errors.client_id" class="mt-1 text-xs text-red-600">{{ errors.client_id }}</p>
    </div>
    <div>
      <label class="field-label">Project name *</label>
      <input v-model="form.project_name" class="field-input" placeholder="e.g. Brand Film 2026" />
      <p v-if="errors.project_name" class="mt-1 text-xs text-red-600">{{ errors.project_name }}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Contract value</label>
        <input v-model.number="form.contract_value" type="number" min="0" class="field-input" inputmode="decimal" />
        <p v-if="errors.contract_value" class="mt-1 text-xs text-red-600">{{ errors.contract_value }}</p>
      </div>
      <div>
        <label class="field-label">Start date</label>
        <input v-model="form.start_date" type="date" class="field-input" />
      </div>
    </div>
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" :disabled="saving" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving…' : 'Save changes' }}
      </button>
    </div>
  </form>
</template>
