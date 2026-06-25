<script setup lang="ts">
import type { Attachment, NewPayment, PaymentMethod } from '~/types'
import { PAYMENT_METHODS } from '~/utils/constants'

const props = defineProps<{ defaultProjectId?: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const projects = useProjectsStore()
const payments = usePaymentsStore()
const ui = useUiStore()

onMounted(() => projects.fetch())

const today = new Date().toISOString().slice(0, 10)
const form = reactive<NewPayment & { attachments: Attachment[] }>({
  project_id: props.defaultProjectId ?? '',
  amount: 0,
  payment_method: 'bank' as PaymentMethod,
  payment_date: today,
  notes: '',
  attachments: [],
})
const { saving, guard } = useSavingGuard()
const errors = reactive<Record<string, string>>({})

const projectOptions = computed(() =>
  projects.items.map((p) => ({ value: p.id, label: p.project_name, hint: p.client_name })),
)

function validate(): boolean {
  errors.project_id = form.project_id ? '' : 'Select a project'
  errors.amount = form.amount > 0 ? '' : 'Amount must be greater than 0'
  return !errors.project_id && !errors.amount
}

async function submit() {
  if (!validate()) return
  await guard(async () => {
    try {
      await payments.add({ ...form, amount: Number(form.amount) || 0 })
      ui.toast('Payment recorded')
      emit('saved')
    } catch (e) {
      ui.toast(e instanceof Error ? e.message : 'Failed to save', 'error')
    }
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div v-if="!defaultProjectId">
      <label class="field-label">Project *</label>
      <Combobox v-model="form.project_id" :options="projectOptions" mode="select" placeholder="Search a project…" />
      <p v-if="errors.project_id" class="mt-1 text-xs text-red-600">{{ errors.project_id }}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Amount *</label>
        <input v-model.number="form.amount" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
        <p v-if="errors.amount" class="mt-1 text-xs text-red-600">{{ errors.amount }}</p>
      </div>
      <div>
        <label class="field-label">Date</label>
        <input v-model="form.payment_date" type="date" class="field-input" />
      </div>
    </div>
    <div>
      <label class="field-label">Method</label>
      <select v-model="form.payment_method" class="field-input">
        <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
    </div>
    <div>
      <label class="field-label">Notes</label>
      <input v-model="form.notes" class="field-input" placeholder="Optional" />
    </div>
    <AttachmentInput v-model="form.attachments" />
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" :disabled="saving" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving…' : 'Record payment' }}
      </button>
    </div>
  </form>
</template>
