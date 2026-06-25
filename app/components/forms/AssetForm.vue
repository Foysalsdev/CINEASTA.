<script setup lang="ts">
import type { NewAsset } from '~/types'
const emit = defineEmits<{ saved: []; cancel: [] }>()

const assets = useAssetsStore()
const ui = useUiStore()
const today = new Date().toISOString().slice(0, 10)
const form = reactive<NewAsset>({ name: '', category: '', purchase_value: 0, purchase_date: today, notes: '' })
const { saving, guard } = useSavingGuard()
const error = ref('')

async function submit() {
  if (!form.name.trim()) {
    error.value = 'Asset name is required'
    return
  }
  await guard(async () => {
    try {
      await assets.add({ ...form, purchase_value: Number(form.purchase_value) || 0 })
      ui.toast('Asset added')
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
      <label class="field-label">Asset name *</label>
      <input v-model="form.name" class="field-input" placeholder="e.g. Sony FX6 Body" />
      <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Category</label>
        <input v-model="form.category" class="field-input" placeholder="Camera, Light…" />
      </div>
      <div>
        <label class="field-label">Purchase value</label>
        <input v-model.number="form.purchase_value" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
      </div>
    </div>
    <div>
      <label class="field-label">Purchase date</label>
      <input v-model="form.purchase_date" type="date" class="field-input" />
    </div>
    <div>
      <label class="field-label">Notes</label>
      <input v-model="form.notes" class="field-input" placeholder="Optional" />
    </div>
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" :disabled="saving" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Add asset' }}</button>
    </div>
  </form>
</template>
