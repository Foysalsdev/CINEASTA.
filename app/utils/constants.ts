import type {
  ExpenseCategory,
  PaymentMethod,
  ProjectStatus,
} from '~/types'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Salary',
  'Marketing',
  'Software',
  'Hosting',
  'Freelancer',
  'Transport',
  'Office',
  'Other',
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

// Stable colour map for charts/badges so a category/status always looks the same.
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Salary: '#176a3a',
  Marketing: '#1f7d49',
  Software: '#3f9866',
  Hosting: '#71b48d',
  Freelancer: '#d97706',
  Transport: '#2563eb',
  Office: '#9333ea',
  Other: '#64748b',
}

export const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: 'bg-brand-100 text-brand-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-gray-200 text-gray-600',
}
