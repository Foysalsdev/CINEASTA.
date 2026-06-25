<script setup lang="ts">
import type { PaymentMethod, VendorDetail } from '~/types'
import { PAYMENT_METHODS } from '~/utils/constants'
import { allocatePayment, round2 } from '~/utils/calculations'
import { buildCsv, csvToRecords, downloadCsv, parseDateCell } from '~/utils/csv'

const emit = defineEmits<{ done: [] }>()

const projects = useProjectsStore()
const vendors = useVendorsStore()
const expensesStore = useExpensesStore()
const dashboard = useDashboardStore()
const ui = useUiStore()
const repo = useRepositories()
const { currency } = useFormat()
const { saving, guard } = useSavingGuard()

onMounted(() => {
  projects.fetch()
  vendors.fetch()
})

type SubMode = 'expenses' | 'vendor'
const subMode = ref<SubMode>('expenses')
const today = new Date().toISOString().slice(0, 10)
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')

function pick(rec: Record<string, string>, keys: string[]): string {
  for (const k of keys) if (rec[k]) return rec[k]
  return ''
}

interface ExpenseRow {
  projectName: string
  vendorName: string
  category: string
  amount: number
  date: string
  notes: string
  projectId: string
  vendorId: string
  error: string
}
interface VendorPayRow {
  vendorName: string
  amount: number
  date: string
  method: PaymentMethod
  notes: string
  vendorId: string
  error: string
}

const expenseRows = ref<ExpenseRow[]>([])
const vendorRows = ref<VendorPayRow[]>([])

function resolveMethod(raw: string): { value: PaymentMethod; error?: string } {
  const s = raw.trim().toLowerCase()
  if (!s) return { value: 'bank' }
  const found = PAYMENT_METHODS.find((m) => m.value === s || m.label.toLowerCase() === s)
  return found ? { value: found.value } : { value: 'bank', error: `Unknown payment method "${raw}"` }
}

function parseExpenseRows(records: Record<string, string>[]): ExpenseRow[] {
  const projectByName = new Map(projects.items.map((p) => [p.project_name.trim().toLowerCase(), p.id]))
  const vendorByName = new Map(vendors.items.map((v) => [v.name.trim().toLowerCase(), v.id]))
  return records.map((rec) => {
    const projectName = pick(rec, ['project', 'project name', 'project_name'])
    const vendorName = pick(rec, ['vendor', 'vendor name', 'vendor_name'])
    const category = pick(rec, ['category'])
    const amount = Number(pick(rec, ['amount']).replace(/,/g, ''))
    const dateCell = parseDateCell(pick(rec, ['date', 'expense date', 'expense_date']), today)
    const notes = pick(rec, ['notes', 'note'])

    let error = ''
    let projectId = ''
    let vendorId = ''
    if (!(amount > 0)) error = 'Invalid amount'
    if (!error && projectName.trim()) {
      const id = projectByName.get(projectName.trim().toLowerCase())
      if (!id) error = `Project not found: "${projectName.trim()}"`
      else projectId = id
    }
    if (!error && vendorName.trim()) {
      const id = vendorByName.get(vendorName.trim().toLowerCase())
      if (!id) error = `Vendor not found: "${vendorName.trim()}"`
      else vendorId = id
    }
    if (!error && dateCell.error) error = dateCell.error

    return { projectName, vendorName, category, amount, date: dateCell.value, notes, projectId, vendorId, error }
  })
}

function parseVendorRows(records: Record<string, string>[]): VendorPayRow[] {
  const vendorByName = new Map(vendors.items.map((v) => [v.name.trim().toLowerCase(), v.id]))
  return records.map((rec) => {
    const vendorName = pick(rec, ['vendor', 'vendor name', 'vendor_name'])
    const amount = Number(pick(rec, ['amount', 'paid amount']).replace(/,/g, ''))
    const dateCell = parseDateCell(pick(rec, ['date', 'payment date', 'payment_date']), today)
    const method = resolveMethod(pick(rec, ['method', 'payment method', 'payment_method']))
    const notes = pick(rec, ['notes', 'note'])

    let error = ''
    let vendorId = ''
    if (!vendorName.trim()) error = 'Vendor is required'
    else {
      const id = vendorByName.get(vendorName.trim().toLowerCase())
      if (!id) error = `Vendor not found: "${vendorName.trim()}"`
      else vendorId = id
    }
    if (!error && !(amount > 0)) error = 'Invalid amount'
    if (!error && dateCell.error) error = dateCell.error
    if (!error && method.error) error = method.error

    return { vendorName, amount, date: dateCell.value, method: method.value, notes, vendorId, error }
  })
}

function reset() {
  expenseRows.value = []
  vendorRows.value = []
  fileName.value = ''
}
watch(subMode, reset)

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const text = await file.text()
  const { records } = csvToRecords(text)
  fileName.value = file.name
  if (subMode.value === 'expenses') expenseRows.value = parseExpenseRows(records)
  else vendorRows.value = parseVendorRows(records)
  input.value = ''
}

const validExpenseRows = computed(() => expenseRows.value.filter((r) => !r.error))
const invalidExpenseCount = computed(() => expenseRows.value.length - validExpenseRows.value.length)
const expenseTotal = computed(() => validExpenseRows.value.reduce((s, r) => s + r.amount, 0))

const validVendorRows = computed(() => vendorRows.value.filter((r) => !r.error))
const invalidVendorCount = computed(() => vendorRows.value.length - validVendorRows.value.length)
const vendorTotal = computed(() => validVendorRows.value.reduce((s, r) => s + r.amount, 0))

const hasRows = computed(() => (subMode.value === 'expenses' ? expenseRows.value.length : vendorRows.value.length) > 0)
const validCount = computed(() => (subMode.value === 'expenses' ? validExpenseRows.value.length : validVendorRows.value.length))
const invalidCount = computed(() => (subMode.value === 'expenses' ? invalidExpenseCount.value : invalidVendorCount.value))
const total = computed(() => (subMode.value === 'expenses' ? expenseTotal.value : vendorTotal.value))

function downloadTemplate() {
  if (subMode.value === 'expenses') {
    const csv = buildCsv(
      ['project', 'vendor', 'category', 'amount', 'date', 'notes'],
      [
        ['Wedding Film - Rahim', 'Lenscraft Rentals', 'Camera & Lens', 5000, today, 'Lens rental'],
        ['', '', 'Office Rent', 20000, today, 'Internal expense — no project'],
      ],
    )
    downloadCsv('cineasta-expenses-template.csv', csv)
  } else {
    const csv = buildCsv(
      ['vendor', 'amount', 'date', 'method', 'notes'],
      [['Lenscraft Rentals', 5000, today, 'bank', 'Partial payment']],
    )
    downloadCsv('cineasta-vendor-payments-template.csv', csv)
  }
}

async function importExpenses() {
  if (!validExpenseRows.value.length) return
  await guard(async () => {
    let ok = 0
    let fail = 0
    for (const r of validExpenseRows.value) {
      try {
        await expensesStore.add({
          type: r.projectId ? 'project' : 'internal',
          project_id: r.projectId,
          vendor_id: r.vendorId,
          asset_id: '',
          category: r.category.trim() || 'Uncategorized',
          amount: r.amount,
          expense_date: r.date,
          notes: r.notes,
        })
        ok++
      } catch {
        fail++
      }
    }
    ui.toast(
      fail ? `${ok} imported, ${fail} failed` : `${ok} expense${ok === 1 ? '' : 's'} imported`,
      fail && !ok ? 'error' : 'success',
    )
    if (ok) {
      await Promise.all([dashboard.fetch(true), projects.fetch(true)])
      reset()
      emit('done')
    }
  })
}

async function importVendorPayments() {
  if (!validVendorRows.value.length) return
  await guard(async () => {
    const detailCache: Record<string, VendorDetail> = {}
    let ok = 0
    let fail = 0
    for (const r of validVendorRows.value) {
      try {
        const detail = detailCache[r.vendorId] ?? (await repo.vendors.get(r.vendorId))
        detailCache[r.vendorId] = detail
        const allocations = allocatePayment(detail.bills, r.amount)
        for (const a of allocations) {
          await repo.vendors.pay({
            vendor_id: r.vendorId,
            bill_id: a.bill_id,
            amount: a.amount,
            payment_method: r.method,
            payment_date: r.date,
            notes: r.notes,
          })
          // Keep cached due amounts in sync so a vendor repeated across rows
          // allocates against what's left, not the pre-batch due.
          const bill = detail.bills.find((b) => b.id === a.bill_id)
          if (bill) bill.due = round2(Math.max(0, bill.due - a.amount))
        }
        ok++
      } catch {
        fail++
      }
    }
    ui.toast(
      fail ? `${ok} paid, ${fail} failed` : `${ok} vendor payment${ok === 1 ? '' : 's'} imported`,
      fail && !ok ? 'error' : 'success',
    )
    if (ok) {
      await Promise.all([dashboard.fetch(true), projects.fetch(true), vendors.fetch(true)])
      reset()
      emit('done')
    }
  })
}

function importRows() {
  if (subMode.value === 'expenses') return importExpenses()
  return importVendorPayments()
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <div class="flex rounded-xl bg-gray-100 p-1 text-sm font-medium">
      <button
        type="button"
        class="flex-1 rounded-lg py-2 transition"
        :class="subMode === 'expenses' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'"
        @click="subMode = 'expenses'"
      >Expenses</button>
      <button
        type="button"
        class="flex-1 rounded-lg py-2 transition"
        :class="subMode === 'vendor' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500'"
        @click="subMode = 'vendor'"
      >Vendor Payments</button>
    </div>

    <div class="card space-y-3 p-3.5">
      <p class="text-sm text-gray-600">
        Upload a CSV of {{ subMode === 'expenses' ? 'expenses' : 'vendor payments' }}. Each row becomes one entry —
        nothing is saved until you tap Import below.
      </p>
      <div class="flex gap-2">
        <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="onFile" />
        <button type="button" class="btn-primary flex-1 !py-2 text-sm" @click="fileInput?.click()">Choose CSV file…</button>
        <button type="button" class="btn-ghost !py-2 text-sm !bg-gray-100" @click="downloadTemplate">Template</button>
      </div>
      <p v-if="fileName" class="text-xs text-gray-400">Loaded: {{ fileName }}</p>
    </div>

    <template v-if="hasRows">
      <div class="card flex items-center justify-between p-3.5 text-sm">
        <span class="font-medium text-brand-700">{{ validCount }} ready to import</span>
        <span v-if="invalidCount" class="font-medium text-red-600">{{ invalidCount }} need fixing</span>
      </div>

      <ul class="space-y-1.5">
        <template v-if="subMode === 'expenses'">
          <li
            v-for="(r, i) in expenseRows"
            :key="i"
            class="card flex items-start gap-2 p-2.5 text-sm"
            :class="r.error ? 'bg-red-50/60' : ''"
          >
            <span class="mt-0.5 shrink-0" :class="r.error ? 'text-red-500' : 'text-brand-600'">{{ r.error ? '✕' : '✓' }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-gray-800">
                {{ r.category || 'Uncategorized' }} · {{ currency(r.amount) }}
                <span class="font-normal text-gray-400">{{ r.projectName || 'Internal' }}{{ r.vendorName ? ` · ${r.vendorName}` : '' }}</span>
              </p>
              <p v-if="r.error" class="text-xs text-red-600">{{ r.error }}</p>
            </div>
          </li>
        </template>
        <template v-else>
          <li
            v-for="(r, i) in vendorRows"
            :key="i"
            class="card flex items-start gap-2 p-2.5 text-sm"
            :class="r.error ? 'bg-red-50/60' : ''"
          >
            <span class="mt-0.5 shrink-0" :class="r.error ? 'text-red-500' : 'text-brand-600'">{{ r.error ? '✕' : '✓' }}</span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-gray-800">
                {{ r.vendorName || '—' }} · {{ currency(r.amount) }}
                <span class="font-normal text-gray-400">{{ r.method }}</span>
              </p>
              <p v-if="r.error" class="text-xs text-red-600">{{ r.error }}</p>
            </div>
          </li>
        </template>
      </ul>
    </template>

    <div v-if="hasRows" class="bottom-nav-offset fixed inset-x-0 z-30 mb-3 px-4 lg:bottom-3 lg:pl-60">
      <div class="mx-auto max-w-md">
        <button class="btn-primary w-full shadow-lg shadow-brand-600/20" :disabled="saving || !validCount" @click="importRows">
          {{ saving ? 'Importing…' : `Import ${validCount} ${subMode === 'expenses' ? 'expense' : 'payment'}${validCount === 1 ? '' : 's'} · ${currency(total)}` }}
        </button>
      </div>
    </div>
  </div>
</template>
