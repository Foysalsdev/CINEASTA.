// =============================================================================
// Domain types — mirror the Google Sheets columns exactly.
// =============================================================================

export type ID = string

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'

export type PaymentMethod =
  | 'cash'
  | 'bank'
  | 'bkash'
  | 'nagad'
  | 'card'
  | 'cheque'
  | 'other'

export type ExpenseCategory =
  | 'Salary'
  | 'Marketing'
  | 'Software'
  | 'Hosting'
  | 'Freelancer'
  | 'Transport'
  | 'Office'
  | 'Other'

// --- Sheet: Clients --------------------------------------------------------
export interface Client {
  id: ID
  name: string
  phone: string
  email: string
  notes: string
  created_at: string
}

// --- Sheet: Projects -------------------------------------------------------
export interface Project {
  id: ID
  client_id: ID
  project_name: string
  contract_value: number
  start_date: string
  status: ProjectStatus
  created_at: string
}

// --- Sheet: Payments -------------------------------------------------------
export interface Payment {
  id: ID
  project_id: ID
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  notes: string
  created_at: string
}

// --- Sheet: Expenses -------------------------------------------------------
export interface Expense {
  id: ID
  project_id: ID
  category: ExpenseCategory
  amount: number
  expense_date: string
  notes: string
  created_at: string
}

// =============================================================================
// Derived / computed view models (output of the business-logic layer).
// =============================================================================

export interface ProjectMetrics {
  totalReceived: number
  totalExpense: number
  outstandingDue: number
  currentProfit: number
  expectedProfit: number
  profitMargin: number // percentage
  collectionRate: number // percentage of contract collected
}

export interface ProjectWithMetrics extends Project {
  client_name: string
  metrics: ProjectMetrics
}

export interface DashboardKpis {
  totalRevenue: number
  totalExpense: number
  netProfit: number
  outstandingDue: number
  collectionRate: number // percentage
  averageProjectProfit: number
  projectCount: number
  clientCount: number
}

export interface MonthlyPoint {
  month: string // YYYY-MM
  label: string // e.g. "Jun 25"
  revenue: number
  expense: number
  profit: number
}

export interface CategoryBreakdownPoint {
  category: ExpenseCategory
  amount: number
  percent: number
}

export interface RankedProject {
  id: ID
  name: string
  value: number
}

export interface RankedClient {
  id: ID
  name: string
  revenue: number
  projectCount: number
}

export interface DashboardData {
  kpis: DashboardKpis
  monthly: MonthlyPoint[]
  expenseBreakdown: CategoryBreakdownPoint[]
  topProjectsByProfit: RankedProject[]
  topClientsByRevenue: RankedClient[]
  recentPayments: Payment[]
  recentExpenses: Expense[]
}

// =============================================================================
// Reports
// =============================================================================

export interface MonthlyReportRow {
  month: string
  label: string
  revenue: number
  expense: number
  profit: number
}

export interface ProjectProfitReportRow {
  id: ID
  project: string
  revenue: number
  expense: number
  profit: number
  margin: number
}

export interface ClientRevenueReportRow {
  id: ID
  client: string
  revenue: number
  projectCount: number
}

// =============================================================================
// API envelope
// =============================================================================

export interface ApiResponse<T> {
  ok: boolean
  data: T | null
  error: string | null
}

// Payloads for create operations (server assigns id + created_at).
export type NewClient = Omit<Client, 'id' | 'created_at'>
export type NewProject = Omit<Project, 'id' | 'created_at'>
export type NewPayment = Omit<Payment, 'id' | 'created_at'>
export type NewExpense = Omit<Expense, 'id' | 'created_at'>
