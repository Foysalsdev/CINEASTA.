<script setup lang="ts">
import type { NewExpense } from '~/types'
import { EXPENSE_CATEGORIES } from '~/utils/constants'

const props = defineProps<{ defaultProjectId?: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const projects = useProjectsStore()
const expenses = useExpensesStore()
const ui = useUiStore()
const { currency } = useFormat()

onMounted(() => {
  projects.fetch()
  expenses.fetch() // for category + vendor suggestions
})

const today = new Date().toISOString().slice(0, 10)
const form = reactive<NewExpense>({
  project_id: props.defaultProjectId ?? '',
  category: '',
  vendor: '',
  total_bill: 0,
  paid: 0,
  expense_date: today,
  notes: '',
})
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

const projectOptions = computed(() =>
  projects.items.map((p) => ({ value: p.id, label: p.project_name, hint: p.client_name })),
)

function distinct(list: string[]) {
  return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)))
}
const categoryOptions = computed(() => {
  const used = distinct(expenses.items.map((e) => String(e.category || '')))
  const seen = new Set(used.map((c) => c.toLowerCase()))
  const merged = [...used, ...EXPENSE_CATEGORIES.filter((c) => !seen.has(c.toLowerCase()))]
  return merged.map((c) => ({ value: c, label: c }))
})
const vendorOptions = computed(() =>
  distinct(expenses.items.map((e) => String(e.vendor || ''))).map((v) => ({ value: v, label: v })),
)

const due = computed(() => Math.max(0, (Number(form.total_bill) || 0) - (Number(form.paid) || 0)))

function validate(): boolean {
  errors.project_id = form.project_id ? '' : 'Select a project'
  errors.total_bill = form.total_bill > 0 ? '' : 'Total bill must be greater than 0'
  errors.paid = form.paid < 0 ? 'Paid cannot be negative' : ''
  return !errors.project_id && !errors.total_bill && !errors.paid
}

async function submit() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    await expenses.add({
      ...form,
      category: form.category.trim() || 'Uncategorized',
      vendor: form.vendor.trim(),
      total_bill: Number(form.total_bill) || 0,
      paid: Math.min(Math.max(0, Number(form.paid) || 0), Number(form.total_bill) || 0),
    })
    ui.toast('Expense bill added')
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
    <div v-if="!defaultProjectId">
      <label class="field-label">Project *</label>
      <Combobox v-model="form.project_id" :options="projectOptions" mode="select" placeholder="Search a project…" />
      <p v-if="errors.project_id" class="mt-1 text-xs text-red-600">{{ errors.project_id }}</p>
    </div>

    <div>
      <label class="field-label">Category</label>
      <Combobox v-model="form.category" :options="categoryOptions" mode="free" placeholder="Type or pick a category…" />
    </div>

    <div>
      <label class="field-label">Vendor / Paid to</label>
      <Combobox v-model="form.vendor" :options="vendorOptions" mode="free" placeholder="Who is the bill from?" />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Total Bill *</label>
        <input v-model.number="form.total_bill" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
        <p v-if="errors.total_bill" class="mt-1 text-xs text-red-600">{{ errors.total_bill }}</p>
      </div>
      <div>
        <label class="field-label">Paid</label>
        <input v-model.number="form.paid" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
        <p v-if="errors.paid" class="mt-1 text-xs text-red-600">{{ errors.paid }}</p>
      </div>
    </div>

    <!-- Live due preview -->
    <div class="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-2.5 text-sm">
      <span class="text-gray-500">Due (baki)</span>
      <span class="font-bold" :class="due > 0 ? 'text-amber-600' : 'text-brand-600'">{{ currency(due) }}</span>
    </div>

    <div>
      <label class="field-label">Date</label>
      <input v-model="form.expense_date" type="date" class="field-input" />
    </div>
    <div>
      <label class="field-label">Notes</label>
      <input v-model="form.notes" class="field-input" placeholder="Optional" />
    </div>
    <div class="flex gap-2 pt-1">
      <button type="button" class="btn-ghost flex-1" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn-primary flex-1" :disabled="saving">
        {{ saving ? 'Saving…' : 'Add bill' }}
      </button>
    </div>
  </form>
</template>
