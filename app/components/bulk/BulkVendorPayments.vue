<script setup lang="ts">
import type { PaymentMethod, VendorDetail } from '~/types'
import { PAYMENT_METHODS } from '~/utils/constants'
import { allocatePayment, round2 } from '~/utils/calculations'

const emit = defineEmits<{ done: [] }>()

const vendors = useVendorsStore()
const dashboard = useDashboardStore()
const projects = useProjectsStore()
const ui = useUiStore()
const repo = useRepositories()
const { currency } = useFormat()

onMounted(() => vendors.fetch())

const today = new Date().toISOString().slice(0, 10)
const method = ref<PaymentMethod>('bank')
const sharedDate = ref(today)

interface Row {
  vendorId: string
  amount: number | null
}
const rows = reactive<Row[]>([{ vendorId: '', amount: null }, { vendorId: '', amount: null }])
const { saving, guard } = useSavingGuard()

// Lazy cache of each vendor's bills/due so we can allocate oldest-first.
const detailCache = reactive<Record<string, VendorDetail>>({})

const vendorOptions = computed(() => vendors.items.map((v) => ({ value: v.id, label: v.name, hint: v.category })))

// Whenever a row's vendor changes, lazily load its bills/due and prefill amount.
watch(
  () => rows.map((r) => r.vendorId),
  async (ids) => {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      if (!id || detailCache[id]) continue
      try {
        detailCache[id] = await repo.vendors.get(id)
      } catch {
        /* ignore — allocation falls back to advance */
      }
      const row = rows[i]
      const due = detailCache[id]?.summary.due ?? 0
      if (row && !row.amount && due > 0) row.amount = due
    }
  },
)

function dueFor(vendorId: string): number {
  return detailCache[vendorId]?.summary.due ?? 0
}

const valid = computed(() => rows.filter((r) => r.vendorId && (Number(r.amount) || 0) > 0))
const total = computed(() => valid.value.reduce((s, r) => s + (Number(r.amount) || 0), 0))

function addRow() {
  rows.push({ vendorId: '', amount: null })
}
function removeRow(i: number) {
  rows.splice(i, 1)
  if (!rows.length) addRow()
}

async function save() {
  if (!valid.value.length) return
  await guard(async () => {
    try {
      let count = 0
      for (const r of valid.value) {
        const detail = detailCache[r.vendorId] ?? (await repo.vendors.get(r.vendorId))
        detailCache[r.vendorId] = detail
        const allocations = allocatePayment(detail.bills, Number(r.amount) || 0)
        for (const a of allocations) {
          await repo.vendors.pay({
            vendor_id: r.vendorId,
            bill_id: a.bill_id,
            amount: a.amount,
            payment_method: method.value,
            payment_date: sharedDate.value,
            notes: '',
          })
          // Keep the cached due amounts in sync so a vendor appearing in a
          // later row of the same batch allocates against what's left, not
          // the pre-batch due.
          const bill = detail.bills.find((b) => b.id === a.bill_id)
          if (bill) bill.due = round2(Math.max(0, bill.due - a.amount))
        }
        count++
      }
      ui.toast(`Paid ${count} vendor${count > 1 ? 's' : ''}`)
      await Promise.all([dashboard.fetch(true), projects.fetch(true), vendors.fetch(true)])
      emit('done')
    } catch (e) {
      ui.toast(e instanceof Error ? e.message : 'Failed to save', 'error')
    }
  })
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <div class="card grid grid-cols-2 gap-3 p-3.5">
      <div>
        <label class="field-label">Method</label>
        <select v-model="method" class="field-input">
          <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>
      <div>
        <label class="field-label">Date</label>
        <input v-model="sharedDate" type="date" class="field-input" />
      </div>
      <p class="col-span-2 text-xs text-gray-400">Each amount is applied to the vendor's oldest unpaid bills first.</p>
    </div>

    <ul class="space-y-2">
      <li v-for="(r, i) in rows" :key="i" class="card p-2.5">
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <Combobox v-model="r.vendorId" :options="vendorOptions" mode="select" placeholder="Vendor…" />
          </div>
          <input v-model.number="r.amount" type="number" min="0" step="0.01" class="field-input !w-28 !py-2" placeholder="Amount" inputmode="decimal" />
          <button type="button" class="shrink-0 p-1.5 text-gray-300 active:text-red-500" aria-label="Remove" @click="removeRow(i)">
            <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" /></svg>
          </button>
        </div>
        <p v-if="r.vendorId" class="mt-1 pl-1 text-[11px]" :class="dueFor(r.vendorId) > 0 ? 'text-amber-600' : 'text-brand-600'">
          {{ dueFor(r.vendorId) > 0 ? `Outstanding due ${currency(dueFor(r.vendorId))}` : 'No due — will record as advance' }}
        </p>
      </li>
    </ul>

    <button type="button" class="btn-ghost w-full !bg-gray-100" @click="addRow">+ Add row</button>

    <div class="bottom-nav-offset fixed inset-x-0 z-30 mb-3 px-4 lg:bottom-3 lg:pl-60">
      <div class="mx-auto max-w-md">
        <button class="btn-primary w-full shadow-lg shadow-brand-600/20" :disabled="saving || !valid.length" @click="save">
          {{ saving ? 'Saving…' : `Pay ${valid.length} vendor${valid.length === 1 ? '' : 's'} · ${currency(total)}` }}
        </button>
      </div>
    </div>
  </div>
</template>
