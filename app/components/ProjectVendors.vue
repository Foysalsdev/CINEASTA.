<script setup lang="ts">
import type { ProjectVendorLine } from '~/types'

const props = defineProps<{ projectId: string; lines: ProjectVendorLine[] }>()
const emit = defineEmits<{ changed: [] }>()

const ui = useUiStore()
const repo = useRepositories()
const { currency, date } = useFormat()

const expanded = ref<string>('') // vendor id
function toggle(id: string) {
  expanded.value = expanded.value === id ? '' : id
}

const adding = ref(false)
const payFor = ref<ProjectVendorLine | null>(null)

// Edit Total Bill
const editFor = ref<ProjectVendorLine | null>(null)
const editTotal = ref<number>(0)
const { saving: savingTotal, guard: guardTotal } = useSavingGuard()
function openEdit(line: ProjectVendorLine) {
  editFor.value = line
  editTotal.value = line.totalBill
}
async function saveTotal() {
  if (!editFor.value) return
  await guardTotal(async () => {
    try {
      await repo.expenses.update(editFor.value!.primaryBillId, { amount: Number(editTotal.value) || 0 })
      ui.toast('Total bill updated')
      editFor.value = null
      emit('changed')
    } catch (e) {
      ui.toast(e instanceof Error ? e.message : 'Failed to update', 'error')
    }
  })
}

function onSaved() {
  adding.value = false
  payFor.value = null
  emit('changed')
}

// Running due after each payment (oldest → newest).
function withRunningDue(line: ProjectVendorLine) {
  let paid = 0
  return line.payments.map((p) => {
    paid += Number(p.amount) || 0
    return { ...p, dueAfter: Math.max(0, line.totalBill - paid) }
  })
}

const existingVendorIds = computed(() => props.lines.map((l) => l.vendor.id))
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-700">Vendors ({{ lines.length }})</h2>
      <button class="text-sm font-medium text-brand-600" @click="adding = true">+ Vendor</button>
    </div>

    <p v-if="!lines.length" class="card py-8 text-center text-sm text-gray-400">
      No vendors on this project yet. Tap <span class="font-medium text-brand-600">+ Vendor</span> to set a Total Bill.
    </p>

    <div v-for="line in lines" :key="line.vendor.id" class="card overflow-hidden">
      <button class="flex w-full items-center justify-between gap-2 p-3.5 text-left" @click="toggle(line.vendor.id)">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-gray-900">{{ line.vendor.name }}</p>
          <p class="truncate text-xs text-gray-400">
            <span v-if="line.category">{{ line.category }} · </span>Total {{ currency(line.totalBill) }} · Paid {{ currency(line.paid) }}
          </p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-sm font-bold" :class="line.due > 0 ? 'text-amber-600' : 'text-brand-600'">
            {{ line.due > 0 ? currency(line.due) : 'Cleared' }}
          </p>
          <p class="text-[10px] uppercase tracking-wide text-gray-400">{{ line.due > 0 ? 'Due' : 'Paid' }}</p>
        </div>
      </button>

      <div v-if="expanded === line.vendor.id" class="border-t border-gray-100 px-3.5 pb-3.5 pt-3">
        <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-400">Payment history</p>
        <ul v-if="line.payments.length" class="divide-y divide-gray-100">
          <li v-for="p in withRunningDue(line)" :key="p.id" class="py-2">
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="text-sm font-medium text-gray-800">{{ currency(p.amount) }}</p>
                <p class="text-xs text-gray-400 capitalize">{{ date(p.payment_date) }} · {{ p.payment_method }}</p>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-gray-400">Total {{ currency(line.totalBill) }}</p>
                <p class="text-[11px]" :class="p.dueAfter > 0 ? 'text-amber-600' : 'text-brand-600'">Due {{ currency(p.dueAfter) }}</p>
                <NuxtLink :to="`/vendors/${line.vendor.id}/receipt/${p.id}`" class="text-[11px] font-medium text-gray-400 underline-offset-2 hover:underline">Receipt</NuxtLink>
              </div>
            </div>
            <AttachmentChips :items="p.attachments" />
          </li>
        </ul>
        <p v-else class="py-2 text-sm text-gray-400">No payments yet.</p>

        <div class="mt-3 flex gap-2">
          <button class="btn-primary flex-1 !py-2 text-sm" @click="payFor = line">+ Payment</button>
          <button class="btn-ghost flex-1 !py-2 text-sm !bg-gray-100" @click="openEdit(line)">Edit total</button>
        </div>
      </div>
    </div>

    <AppModal v-if="adding" title="Add Vendor to Project" @close="adding = false">
      <ProjectVendorSetupForm
        :project-id="projectId"
        :existing-vendor-ids="existingVendorIds"
        @saved="onSaved"
        @cancel="adding = false"
      />
    </AppModal>

    <AppModal v-if="payFor" :title="`Pay ${payFor.vendor.name}`" @close="payFor = null">
      <ProjectVendorPaymentForm
        :vendor-id="payFor.vendor.id"
        :bill-id="payFor.primaryBillId"
        :due="payFor.due"
        @saved="onSaved"
        @cancel="payFor = null"
      />
    </AppModal>

    <AppModal v-if="editFor" title="Edit Total Bill" @close="editFor = null">
      <form class="space-y-4" @submit.prevent="saveTotal">
        <div>
          <label class="field-label">Total Bill</label>
          <input v-model.number="editTotal" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
        </div>
        <div class="flex gap-2 pt-1">
          <button type="button" class="btn-ghost flex-1" :disabled="savingTotal" @click="editFor = null">Cancel</button>
          <button type="submit" class="btn-primary flex-1" :disabled="savingTotal">{{ savingTotal ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
