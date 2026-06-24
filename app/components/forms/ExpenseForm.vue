<script setup lang="ts">
import type { ExpenseCategory, NewExpense } from '~/types'
import { EXPENSE_CATEGORIES } from '~/utils/constants'

const props = defineProps<{ defaultProjectId?: string }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const projects = useProjectsStore()
const expenses = useExpensesStore()
const ui = useUiStore()

onMounted(() => projects.fetch())

const today = new Date().toISOString().slice(0, 10)
const form = reactive<NewExpense>({
  project_id: props.defaultProjectId ?? '',
  category: 'Other' as ExpenseCategory,
  amount: 0,
  expense_date: today,
  notes: '',
})
const saving = ref(false)
const errors = reactive<Record<string, string>>({})

function validate(): boolean {
  errors.project_id = form.project_id ? '' : 'Select a project'
  errors.amount = form.amount > 0 ? '' : 'Amount must be greater than 0'
  return !errors.project_id && !errors.amount
}

async function submit() {
  if (!validate() || saving.value) return
  saving.value = true
  try {
    await expenses.add({ ...form, amount: Number(form.amount) || 0 })
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
    <div v-if="!defaultProjectId">
      <label class="field-label">Project *</label>
      <select v-model="form.project_id" class="field-input">
        <option value="" disabled>Select a project…</option>
        <option v-for="p in projects.items" :key="p.id" :value="p.id">
          {{ p.project_name }} — {{ p.client_name }}
        </option>
      </select>
      <p v-if="errors.project_id" class="mt-1 text-xs text-red-600">{{ errors.project_id }}</p>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Category</label>
        <select v-model="form.category" class="field-input">
          <option v-for="c in EXPENSE_CATEGORIES" :key="c" :value="c">{{ c }}</option>
        </select>
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
