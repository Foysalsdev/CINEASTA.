<script setup lang="ts">
import type { Attachment, PaymentMethod } from '~/types'
import { PAYMENT_METHODS } from '~/utils/constants'

const props = defineProps<{ vendorId: string; billId: string; due: number }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const vendors = useVendorsStore()
const ui = useUiStore()
const { currency } = useFormat()

const today = new Date().toISOString().slice(0, 10)
const amount = ref<number>(props.due > 0 ? props.due : 0)
const method = ref<PaymentMethod>('bank')
const payDate = ref(today)
const notes = ref('')
const attachments = ref<Attachment[]>([])
const saving = ref(false)
const error = ref('')

async function submit() {
  if (saving.value) return
  if (!(Number(amount.value) > 0)) {
    error.value = 'Amount must be greater than 0'
    return
  }
  error.value = ''
  saving.value = true
  try {
    await vendors.pay({
      vendor_id: props.vendorId,
      bill_id: props.billId,
      amount: Number(amount.value),
      payment_method: method.value,
      payment_date: payDate.value,
      notes: notes.value,
      attachments: attachments.value,
    })
    ui.toast('Payment recorded')
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
    <div class="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm">
      <span class="text-amber-700">Current due</span>
      <span class="font-bold text-amber-700">{{ currency(due) }}</span>
    </div>
    <div>
      <label class="field-label">Paid amount *</label>
      <input v-model.number="amount" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Method</label>
        <select v-model="method" class="field-input">
          <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>
      <div>
        <label class="field-label">Date</label>
        <input v-model="payDate" type="date" class="field-input" />
      </div>
    </div>
    <div>
      <label class="field-label">Notes</label>
      <input v-model="notes" class="field-input" placeholder="Optional" />
    </div>
    <AttachmentInput v-model="attachments" />
    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Record payment' }}</button>
    </div>
  </form>
</template>
