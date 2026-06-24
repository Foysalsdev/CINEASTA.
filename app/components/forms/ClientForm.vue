<script setup lang="ts">
import type { NewClient } from '~/types'
const emit = defineEmits<{ saved: []; cancel: [] }>()

const clients = useClientsStore()
const ui = useUiStore()

const form = reactive<NewClient>({ name: '', phone: '', email: '', notes: '' })
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

function validate(): boolean {
  errors.name = form.name.trim() ? '' : 'Client name is required'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Enter a valid email'
  else errors.email = ''
  return !errors.name && !errors.email
}

async function submit() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    await clients.add({ ...form })
    ui.toast('Client added')
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
      <label class="field-label">Client name *</label>
      <input v-model="form.name" class="field-input" placeholder="e.g. Aurora Studios" />
      <p v-if="errors.name" class="mt-1 text-xs text-red-600">{{ errors.name }}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Phone</label>
        <input v-model="form.phone" class="field-input" inputmode="tel" placeholder="+8801…" />
      </div>
      <div>
        <label class="field-label">Email</label>
        <input v-model="form.email" class="field-input" inputmode="email" placeholder="name@co.com" />
        <p v-if="errors.email" class="mt-1 text-xs text-red-600">{{ errors.email }}</p>
      </div>
    </div>
    <div>
      <label class="field-label">Notes</label>
      <textarea v-model="form.notes" rows="2" class="field-input" placeholder="Optional" />
    </div>
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving…' : 'Add client' }}
      </button>
    </div>
  </form>
</template>
