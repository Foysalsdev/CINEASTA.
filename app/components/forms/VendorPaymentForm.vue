<script setup lang="ts">
import type { Attachment, NewVendorPayment, PaymentMethod, VendorBillLine } from '~/types'
import { PAYMENT_METHODS } from '~/utils/constants'

const props = defineProps<{ vendorId: string; bills: VendorBillLine[] }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const vendors = useVendorsStore()
const ui = useUiStore()
const { currency, date } = useFormat()

const today = new Date().toISOString().slice(0, 10)
const method = ref<PaymentMethod>('bank')
const payDate = ref(today)
const notes = ref('')
const attachments = ref<Attachment[]>([])
const saving = ref(false)
const error = ref('')

// Outstanding bills only; allocation prefilled with each bill's due.
const outstanding = computed(() => props.bills.filter((b) => b.due > 0))
const alloc = reactive<Record<string, number>>({})
watchEffect(() => {
  for (const b of outstanding.value) if (alloc[b.id] === undefined) alloc[b.id] = b.due
})

const totalAllocated = computed(() =>
  outstanding.value.reduce((sum, b) => sum + (Number(alloc[b.id]) || 0), 0),
)

async function submit() {
  if (saving.value) return
  const list: NewVendorPayment[] = outstanding.value
    .filter((b) => (Number(alloc[b.id]) || 0) > 0)
    .map((b) => ({
      vendor_id: props.vendorId,
      bill_id: b.id,
      amount: Math.min(Number(alloc[b.id]) || 0, b.due),
      payment_method: method.value,
      payment_date: payDate.value,
      notes: notes.value,
      attachments: attachments.value,
    }))
  if (!list.length) {
    error.value = 'Allocate an amount to at least one bill'
    return
  }
  saving.value = true
  try {
    await vendors.payBills(list)
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
    <div v-if="!outstanding.length" class="py-6 text-center text-sm text-gray-400">
      No outstanding bills for this vendor. 🎉
    </div>

    <template v-else>
      <p class="text-xs text-gray-400">Allocate payment per bill (kon bill koto):</p>
      <ul class="space-y-2">
        <li v-for="b in outstanding" :key="b.id" class="rounded-xl bg-gray-50 p-3">
          <div class="mb-1.5 flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-gray-800">{{ b.category }}</p>
              <p class="text-xs text-gray-400">{{ date(b.expense_date) }} · due {{ currency(b.due) }}</p>
            </div>
            <button type="button" class="shrink-0 text-xs font-medium text-brand-600" @click="alloc[b.id] = b.due">Full</button>
          </div>
          <input v-model.number="alloc[b.id]" type="number" min="0" :max="b.due" step="0.01" class="field-input !py-2" inputmode="decimal" />
        </li>
      </ul>

      <div class="flex items-center justify-between rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm">
        <span class="text-brand-700">Total paying</span>
        <span class="font-bold text-brand-700">{{ currency(totalAllocated) }}</span>
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
    </template>

    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving || !outstanding.length">
        {{ saving ? 'Saving…' : 'Pay vendor' }}
      </button>
    </div>
  </form>
</template>
