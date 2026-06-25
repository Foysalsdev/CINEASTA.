<script setup lang="ts">
import type { NewVendor } from '~/types'
const emit = defineEmits<{ saved: [id: string]; cancel: [] }>()

const vendors = useVendorsStore()
const ui = useUiStore()
const form = reactive<NewVendor>({ name: '', phone: '', email: '', notes: '' })
const saving = ref(false)
const error = ref('')

async function submit() {
  if (!form.name.trim() || saving.value) {
    error.value = form.name.trim() ? '' : 'Vendor name is required'
    return
  }
  saving.value = true
  try {
    const v = await vendors.add({ ...form })
    ui.toast('Vendor added')
    emit('saved', v.id)
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
      <label class="field-label">Vendor name *</label>
      <input v-model="form.name" class="field-input" placeholder="e.g. Lenscraft Rentals" />
      <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Phone</label>
        <input v-model="form.phone" class="field-input" inputmode="tel" placeholder="+8801…" />
      </div>
      <div>
        <label class="field-label">Email</label>
        <input v-model="form.email" class="field-input" inputmode="email" placeholder="name@co.com" />
      </div>
    </div>
    <div>
      <label class="field-label">Notes</label>
      <textarea v-model="form.notes" rows="2" class="field-input" placeholder="Optional" />
    </div>
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Add vendor' }}</button>
    </div>
  </form>
</template>
