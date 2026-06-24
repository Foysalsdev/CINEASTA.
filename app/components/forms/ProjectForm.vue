<script setup lang="ts">
import type { NewProject, ProjectStatus } from '~/types'
import { PROJECT_STATUSES } from '~/utils/constants'

const emit = defineEmits<{ saved: []; cancel: [] }>()

const clients = useClientsStore()
const projects = useProjectsStore()
const ui = useUiStore()

onMounted(() => clients.fetch())

const today = new Date().toISOString().slice(0, 10)
const form = reactive<NewProject>({
  client_id: '',
  project_name: '',
  contract_value: 0,
  start_date: today,
  status: 'active' as ProjectStatus,
})
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

function validate(): boolean {
  errors.client_id = form.client_id ? '' : 'Select a client'
  errors.project_name = form.project_name.trim() ? '' : 'Project name is required'
  errors.contract_value = form.contract_value >= 0 ? '' : 'Contract value cannot be negative'
  return !errors.client_id && !errors.project_name && !errors.contract_value
}

async function submit() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    await projects.add({ ...form, contract_value: Number(form.contract_value) || 0 })
    ui.toast('Project created')
    emit('saved')
  } catch (e) {
    ui.toast(e instanceof Error ? e.message : 'Failed to save', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="field-label">Client *</label>
      <select v-model="form.client_id" class="field-input">
        <option value="" disabled>Select a client…</option>
        <option v-for="c in clients.items" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <p v-if="errors.client_id" class="mt-1 text-xs text-red-600">{{ errors.client_id }}</p>
      <p v-if="!clients.items.length && clients.loaded" class="mt-1 text-xs text-gray-400">
        No clients yet — add one first from the Quick Add menu.
      </p>
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
    <div>
      <label class="field-label">Status</label>
      <select v-model="form.status" class="field-input">
        <option v-for="s in PROJECT_STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
    </div>
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving…' : 'Create project' }}
      </button>
    </div>
  </form>
</template>
