<script setup lang="ts">
import type { Attachment, PaymentMethod } from '~/types'
import { PAYMENT_METHODS, VENDOR_CATEGORIES } from '~/utils/constants'

const props = defineProps<{ projectId: string; existingVendorIds?: string[] }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const vendors = useVendorsStore()
const ui = useUiStore()
const repo = useRepositories()

onMounted(() => vendors.fetch())

const category = ref('')
const vendorId = ref('')
const totalBill = ref<number>(0)
const today = new Date().toISOString().slice(0, 10)

const payNow = ref(false)
const payAmount = ref<number>(0)
const method = ref<PaymentMethod>('bank')
const payDate = ref(today)
const notes = ref('')
const attachments = ref<Attachment[]>([])

const saving = ref(false)
const error = ref('')
const showNewVendor = ref(false)

const categoryOptions = VENDOR_CATEGORIES.map((c) => ({ value: c, label: c }))

// Vendors not already engaged on this project, optionally filtered by category.
const vendorOptions = computed(() => {
  const taken = new Set(props.existingVendorIds ?? [])
  return vendors.items
    .filter((v) => !taken.has(v.id))
    .filter((v) => !category.value || v.category === category.value)
    .map((v) => ({ value: v.id, label: v.name, hint: v.category }))
})

const selectedVendor = computed(() => vendors.items.find((v) => v.id === vendorId.value))

function onVendorCreated(id: string) {
  showNewVendor.value = false
  vendorId.value = id
}

async function submit() {
  if (saving.value) return
  if (!vendorId.value) {
    error.value = 'Pick a vendor'
    return
  }
  if (!(Number(totalBill.value) > 0)) {
    error.value = 'Total Bill must be greater than 0'
    return
  }
  if (payNow.value && !(Number(payAmount.value) > 0)) {
    error.value = 'Enter the amount paid (or turn off "Pay now")'
    return
  }
  error.value = ''
  saving.value = true
  try {
    const bill = await repo.expenses.create({
      type: 'project',
      project_id: props.projectId,
      vendor_id: vendorId.value,
      asset_id: '',
      category: selectedVendor.value?.category || selectedVendor.value?.name || 'Vendor Bill',
      amount: Number(totalBill.value) || 0,
      expense_date: today,
      notes: notes.value,
    })
    if (payNow.value && Number(payAmount.value) > 0) {
      await vendors.pay({
        vendor_id: vendorId.value,
        bill_id: bill.id,
        amount: Math.min(Number(payAmount.value), Number(totalBill.value)),
        payment_method: method.value,
        payment_date: payDate.value,
        notes: notes.value,
        attachments: attachments.value,
      })
    }
    ui.toast('Vendor added to project')
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
      <label class="field-label">Vendor type</label>
      <Combobox v-model="category" :options="categoryOptions" mode="free" placeholder="Filter by type (optional)…" />
    </div>

    <div>
      <div class="mb-1 flex items-center justify-between">
        <label class="field-label !mb-0">Vendor *</label>
        <button type="button" class="text-xs font-medium text-brand-600" @click="showNewVendor = true">+ New vendor</button>
      </div>
      <Combobox v-model="vendorId" :options="vendorOptions" mode="select" placeholder="Pick a vendor…" />
    </div>

    <div>
      <label class="field-label">Total Bill * <span class="font-normal text-gray-400">(set once for this project)</span></label>
      <input v-model.number="totalBill" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
    </div>

    <!-- Optional first payment -->
    <label class="flex items-center gap-2 text-sm text-gray-600">
      <input v-model="payNow" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600" />
      Record a payment now
    </label>

    <div v-if="payNow" class="space-y-3 rounded-xl bg-gray-50 p-3">
      <div>
        <label class="field-label">Paid amount</label>
        <input v-model.number="payAmount" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
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
      <AttachmentInput v-model="attachments" />
    </div>

    <div>
      <label class="field-label">Notes</label>
      <input v-model="notes" class="field-input" placeholder="Optional" />
    </div>

    <p v-if="error" class="text-xs text-red-600">{{ error }}</p>

    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
    </div>

    <AppModal v-if="showNewVendor" title="New Vendor" @close="showNewVendor = false">
      <VendorForm :default-category="category" @saved="onVendorCreated" @cancel="showNewVendor = false" />
    </AppModal>
  </form>
</template>
