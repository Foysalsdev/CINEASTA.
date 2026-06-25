<script setup lang="ts">
import type { PaymentMethod } from '~/types'
import { PAYMENT_METHODS } from '~/utils/constants'

const emit = defineEmits<{ done: [] }>()

const projects = useProjectsStore()
const payments = usePaymentsStore()
const dashboard = useDashboardStore()
const ui = useUiStore()
const { currency } = useFormat()

onMounted(() => projects.fetch())

const today = new Date().toISOString().slice(0, 10)
const projectId = ref('')
const method = ref<PaymentMethod>('bank')
const sharedDate = ref(today)
const error = ref('')

interface Row {
  amount: number | null
  notes: string
}
const rows = reactive<Row[]>([{ amount: null, notes: '' }, { amount: null, notes: '' }, { amount: null, notes: '' }])
const saving = ref(false)

const projectOptions = computed(() =>
  projects.items.map((p) => ({ value: p.id, label: p.project_name, hint: p.client_name })),
)

const valid = computed(() => rows.filter((r) => (Number(r.amount) || 0) > 0))
const total = computed(() => valid.value.reduce((s, r) => s + (Number(r.amount) || 0), 0))

function addRow() {
  rows.push({ amount: null, notes: '' })
}
function removeRow(i: number) {
  rows.splice(i, 1)
  if (!rows.length) addRow()
}

async function save() {
  if (saving.value || !valid.value.length) return
  if (!projectId.value) {
    error.value = 'Pick a project first'
    return
  }
  error.value = ''
  saving.value = true
  try {
    for (const r of valid.value) {
      await payments.add({
        project_id: projectId.value,
        amount: Number(r.amount) || 0,
        payment_method: method.value,
        payment_date: sharedDate.value,
        notes: r.notes,
      })
    }
    ui.toast(`${valid.value.length} payment${valid.value.length > 1 ? 's' : ''} recorded`)
    await Promise.all([dashboard.fetch(true), projects.fetch(true)])
    emit('done')
  } catch (e) {
    ui.toast(e instanceof Error ? e.message : 'Failed to save', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <div class="card grid grid-cols-2 gap-3 p-3.5">
      <div class="col-span-2">
        <label class="field-label">Project *</label>
        <Combobox v-model="projectId" :options="projectOptions" mode="select" placeholder="Pick a project…" />
        <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
      </div>
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
    </div>

    <ul class="space-y-2">
      <li v-for="(r, i) in rows" :key="i" class="card flex items-center gap-2 p-2.5">
        <input v-model.number="r.amount" type="number" min="0" step="0.01" class="field-input !w-32 !py-2" placeholder="Amount" inputmode="decimal" />
        <input v-model="r.notes" class="field-input flex-1 !py-2" placeholder="Note (optional)" />
        <button type="button" class="shrink-0 p-1.5 text-gray-300 active:text-red-500" aria-label="Remove" @click="removeRow(i)">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" /></svg>
        </button>
      </li>
    </ul>

    <button type="button" class="btn-ghost w-full !bg-gray-100" @click="addRow">+ Add row</button>

    <div class="bottom-nav-offset fixed inset-x-0 z-30 mb-3 px-4 lg:bottom-3 lg:pl-60">
      <div class="mx-auto max-w-md">
        <button class="btn-primary w-full shadow-lg shadow-brand-600/20" :disabled="saving || !valid.length" @click="save">
          {{ saving ? 'Saving…' : `Save ${valid.length} payment${valid.length === 1 ? '' : 's'} · ${currency(total)}` }}
        </button>
      </div>
    </div>
  </div>
</template>
