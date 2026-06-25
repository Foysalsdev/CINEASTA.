<script setup lang="ts">
import type { NewVendorPayment, PaymentMethod } from '~/types'
import { PAYMENT_METHODS } from '~/utils/constants'

const props = defineProps<{ defaultVendorId?: string; dueHint?: number }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const vendors = useVendorsStore()
const ui = useUiStore()
const { currency } = useFormat()

onMounted(() => vendors.fetch())

const today = new Date().toISOString().slice(0, 10)
const form = reactive<NewVendorPayment>({
  vendor_id: props.defaultVendorId ?? '',
  amount: 0,
  payment_method: 'bank' as PaymentMethod,
  payment_date: today,
  notes: '',
})
const saving = ref(false)
const errors = reactive<Record<string, string>>({})
const vendorOptions = computed(() => vendors.items.map((v) => ({ value: v.id, label: v.name, hint: v.phone })))

function validate() {
  errors.vendor_id = form.vendor_id ? '' : 'Select a vendor'
  errors.amount = form.amount > 0 ? '' : 'Amount must be greater than 0'
  return !errors.vendor_id && !errors.amount
}

async function submit() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    await vendors.pay({ ...form, amount: Number(form.amount) || 0 })
    ui.toast('Vendor payment recorded')
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
    <div v-if="!defaultVendorId">
      <label class="field-label">Vendor *</label>
      <Combobox v-model="form.vendor_id" :options="vendorOptions" mode="select" placeholder="Search a vendor…" />
      <p v-if="errors.vendor_id" class="mt-1 text-xs text-red-600">{{ errors.vendor_id }}</p>
    </div>
    <div v-if="dueHint !== undefined" class="flex items-center justify-between rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm">
      <span class="text-amber-700">Current due</span>
      <span class="font-bold text-amber-700">{{ currency(dueHint) }}</span>
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
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Pay vendor' }}</button>
    </div>
  </form>
</template>
