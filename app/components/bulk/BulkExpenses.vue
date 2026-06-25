<script setup lang="ts">
import { EXPENSE_CATEGORIES } from '~/utils/constants'

const emit = defineEmits<{ done: [] }>()

const projects = useProjectsStore()
const expenses = useExpensesStore()
const dashboard = useDashboardStore()
const ui = useUiStore()
const { currency } = useFormat()

onMounted(() => {
  projects.fetch()
  expenses.fetch()
})

const today = new Date().toISOString().slice(0, 10)
const projectId = ref('') // empty → internal expense
const sharedDate = ref(today)

interface Row {
  category: string
  amount: number | null
}
const rows = reactive<Row[]>([{ category: '', amount: null }, { category: '', amount: null }, { category: '', amount: null }])
const saving = ref(false)

const projectOptions = computed(() => [
  { value: '', label: 'Internal / no project', hint: 'Office, overhead…' },
  ...projects.items.map((p) => ({ value: p.id, label: p.project_name, hint: p.client_name })),
])
const categoryOptions = computed(() => {
  const used = Array.from(new Set(expenses.items.map((e) => String(e.category || '')).filter(Boolean)))
  const seen = new Set(used.map((c) => c.toLowerCase()))
  return [...used, ...EXPENSE_CATEGORIES.filter((c) => !seen.has(c.toLowerCase()))].map((c) => ({ value: c, label: c }))
})

const valid = computed(() => rows.filter((r) => (Number(r.amount) || 0) > 0))
const total = computed(() => valid.value.reduce((s, r) => s + (Number(r.amount) || 0), 0))

function addRow() {
  rows.push({ category: '', amount: null })
}
function removeRow(i: number) {
  rows.splice(i, 1)
  if (!rows.length) addRow()
}

async function save() {
  if (saving.value || !valid.value.length) return
  saving.value = true
  try {
    for (const r of valid.value) {
      await expenses.add({
        type: projectId.value ? 'project' : 'internal',
        project_id: projectId.value,
        vendor_id: '',
        asset_id: '',
        category: r.category.trim() || 'Uncategorized',
        amount: Number(r.amount) || 0,
        expense_date: sharedDate.value,
        notes: '',
      })
    }
    ui.toast(`${valid.value.length} expense${valid.value.length > 1 ? 's' : ''} added`)
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
    <!-- Shared defaults -->
    <div class="card grid grid-cols-2 gap-3 p-3.5">
      <div class="col-span-2">
        <label class="field-label">Apply to</label>
        <Combobox v-model="projectId" :options="projectOptions" mode="select" placeholder="Project (or leave for Internal)…" />
      </div>
      <div class="col-span-2">
        <label class="field-label">Date (all rows)</label>
        <input v-model="sharedDate" type="date" class="field-input" />
      </div>
    </div>

    <!-- Rows -->
    <ul class="space-y-2">
      <li v-for="(r, i) in rows" :key="i" class="card flex items-center gap-2 p-2.5">
        <div class="flex-1">
          <Combobox v-model="r.category" :options="categoryOptions" mode="free" placeholder="Category…" />
        </div>
        <input v-model.number="r.amount" type="number" min="0" step="0.01" class="field-input !w-28 !py-2" placeholder="Amount" inputmode="decimal" />
        <button type="button" class="shrink-0 p-1.5 text-gray-300 active:text-red-500" aria-label="Remove" @click="removeRow(i)">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round" /></svg>
        </button>
      </li>
    </ul>

    <button type="button" class="btn-ghost w-full !bg-gray-100" @click="addRow">+ Add row</button>

    <!-- Sticky save bar -->
    <div class="bottom-nav-offset fixed inset-x-0 z-30 mb-3 px-4">
      <div class="mx-auto max-w-md">
        <button class="btn-primary w-full shadow-lg shadow-brand-600/20" :disabled="saving || !valid.length" @click="save">
          {{ saving ? 'Saving…' : `Save ${valid.length} expense${valid.length === 1 ? '' : 's'} · ${currency(total)}` }}
        </button>
      </div>
    </div>
  </div>
</template>
