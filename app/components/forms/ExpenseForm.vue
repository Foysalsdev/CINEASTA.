<script setup lang="ts">
import type { ExpenseType, NewExpense } from '~/types'
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from '~/utils/constants'

const props = defineProps<{ defaultProjectId?: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const projects = useProjectsStore()
const expenses = useExpensesStore()
const vendors = useVendorsStore()
const assets = useAssetsStore()
const ui = useUiStore()

onMounted(() => {
  projects.fetch()
  expenses.fetch()
  vendors.fetch()
  assets.fetch()
})

const today = new Date().toISOString().slice(0, 10)
const form = reactive<NewExpense>({
  type: (props.defaultProjectId ? 'project' : 'project') as ExpenseType,
  project_id: props.defaultProjectId ?? '',
  vendor_id: '',
  asset_id: '',
  category: '',
  amount: 0,
  expense_date: today,
  notes: '',
})
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

const showProject = computed(() => form.type !== 'internal')
const showAsset = computed(() => form.type === 'asset' || form.type === 'maintenance')

const projectOptions = computed(() =>
  projects.items.map((p) => ({ value: p.id, label: p.project_name, hint: p.client_name })),
)
const vendorOptions = computed(() => vendors.items.map((v) => ({ value: v.id, label: v.name, hint: v.phone })))
const assetOptions = computed(() => assets.items.map((a) => ({ value: a.id, label: a.name, hint: a.category })))

function distinct(list: string[]) {
  return Array.from(new Set(list.map((s) => s.trim()).filter(Boolean)))
}
const categoryOptions = computed(() => {
  const used = distinct(expenses.items.map((e) => String(e.category || '')))
  const seen = new Set(used.map((c) => c.toLowerCase()))
  return [...used, ...EXPENSE_CATEGORIES.filter((c) => !seen.has(c.toLowerCase()))].map((c) => ({ value: c, label: c }))
})

function validate(): boolean {
  errors.project_id = form.type === 'project' && !form.project_id ? 'Select a project' : ''
  errors.amount = form.amount > 0 ? '' : 'Amount must be greater than 0'
  return !errors.project_id && !errors.amount
}

async function submit() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    await expenses.add({
      ...form,
      project_id: showProject.value ? form.project_id : '',
      asset_id: showAsset.value ? form.asset_id : '',
      category: form.category.trim() || 'Uncategorized',
      amount: Number(form.amount) || 0,
    })
    ui.toast('Expense added')
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
    <!-- Expense type -->
    <div>
      <label class="field-label">Expense type</label>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="t in EXPENSE_TYPES"
          :key="t.value"
          type="button"
          class="rounded-xl px-3 py-2 text-left text-sm transition"
          :class="form.type === t.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'"
          @click="form.type = t.value"
        >
          <span class="block font-semibold">{{ t.label }}</span>
          <span class="block text-[11px]" :class="form.type === t.value ? 'text-white/80' : 'text-gray-400'">{{ t.hint }}</span>
        </button>
      </div>
    </div>

    <div v-if="showProject && !defaultProjectId">
      <label class="field-label">Project <span v-if="form.type === 'project'">*</span></label>
      <Combobox v-model="form.project_id" :options="projectOptions" mode="select" placeholder="Search a project…" />
      <p v-if="errors.project_id" class="mt-1 text-xs text-red-600">{{ errors.project_id }}</p>
    </div>

    <div v-if="showAsset">
      <label class="field-label">Asset</label>
      <Combobox v-model="form.asset_id" :options="assetOptions" mode="select" placeholder="Link an asset (optional)…" />
    </div>

    <div>
      <label class="field-label">Vendor / Paid to</label>
      <Combobox v-model="form.vendor_id" :options="vendorOptions" mode="select" placeholder="Pick a vendor (optional)…" />
      <p class="mt-1 text-xs text-gray-400">Add vendors from Finance → Vendors.</p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Category</label>
        <Combobox v-model="form.category" :options="categoryOptions" mode="free" placeholder="Type or pick…" />
      </div>
      <div>
        <label class="field-label">Amount *</label>
        <input v-model.number="form.amount" type="number" min="0" step="0.01" class="field-input" inputmode="decimal" />
        <p v-if="errors.amount" class="mt-1 text-xs text-red-600">{{ errors.amount }}</p>
      </div>
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
        {{ saving ? 'Saving…' : 'Add expense' }}
      </button>
    </div>
  </form>
</template>
