import type { ExpenseType, PaymentMethod, ProjectStatus } from '~/types'

export const EXPENSE_TYPES: { value: ExpenseType; label: string; hint: string }[] = [
  { value: 'project', label: 'Project Expense', hint: 'Cost tied to a project' },
  { value: 'internal', label: 'Internal Expense', hint: 'Office / overhead, no project' },
  { value: 'asset', label: 'Asset Purchase', hint: 'Equipment you own' },
  { value: 'maintenance', label: 'Maintenance', hint: 'Repair / upkeep' },
]

export const EXPENSE_TYPE_LABEL: Record<ExpenseType, string> = {
  project: 'Project',
  internal: 'Internal',
  asset: 'Asset',
  maintenance: 'Maintenance',
}

// Default category SUGGESTIONS for the expense typeahead. These are not
// enforced — the user can type any category. Tuned for film production based on
// the agency's quotation format.
export const EXPENSE_CATEGORIES: string[] = [
  'Directorial Team',
  'DOP & Camera Unit',
  'Light & Gear',
  'Art / Set',
  'Prop & Wardrobe',
  'Costume & Makeup',
  'Artist & Casting',
  'Location & Studio Rental',
  'Transportation',
  'Catering & Meal',
  'Production Crew',
  'Generator & Fuel',
  'Post Production',
  'Sound & Music',
  'Computer Graphics (CG)',
  'Miscellaneous',
]

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
]

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Categories are free-form, so colours are derived deterministically from the
// category name (same name → same colour every time) rather than a fixed map.
const CHART_PALETTE = [
  '#176a3a',
  '#2563eb',
  '#d97706',
  '#9333ea',
  '#dc2626',
  '#0891b2',
  '#65a30d',
  '#db2777',
  '#475569',
  '#ca8a04',
]

export function categoryColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return CHART_PALETTE[hash % CHART_PALETTE.length]!
}

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: 'bg-brand-100 text-brand-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-200 text-gray-600',
}
